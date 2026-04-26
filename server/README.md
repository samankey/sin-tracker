# 🌲 Anonymous Wood - Server Side Work Summary

이 문서는 GitHub Issues와 SQLite를 결합한 하이브리드 익명 게시판 시스템인 **Anonymous Wood**의 백엔드 구현 사항을 정리합니다.

## 1. 개요 (Overview)
- **목적**: 사내 구성원을 위한 철저한 익명 게시판 서비스 구축
- **핵심 아키텍처**:
    - **콘텐츠 저장소**: GitHub Issues (인프라 비용 절감 및 공개 게시판 활용)
    - **메타데이터 저장소**: SQLite (보안 식별자, 신고 횟수 등 민감 데이터 관리)

## 2. 기술 스택 (Tech Stack)
- **Framework**: FastAPI (Asynchronous API Framework)
- **ORM**: SQLModel (SQLAlchemy + Pydantic 기반 최신 ORM)
- **Database**: SQLite (로컬 파일 기반 관계형 데이터베이스)
- **HTTP Client**: httpx (비비동기 GitHub API 통신)
- **Security**: hashlib (SHA-256 기반 익명 식별자 및 비밀번호 해싱)

## 3. 주요 구현 사항 (Key Features)

### 🛡️ 보안 및 익명성 (Security & Anonymity)
- **IP 해싱**: 사용자의 실 IP 주소를 서버만 알고 있는 `SECRET_SALT`와 조합하여 해싱함으로써 비가역적인 익명 ID(`ip_hash`)를 생성합니다.
- **비밀번호 해싱**: 게시글 수정 및 삭제 시 본인 확인을 위해 입력받은 비밀번호를 해싱하여 저장(`pwd_hash`)하며, 원본 비밀번호는 서버에 보관하지 않습니다.

### 🏗️ 하이브리드 데이터 모델링 (Hybrid Data Modeling)
- **PostMetadata**:
    - `issue_number`: GitHub 이슈 번호와 로컬 DB를 연결하는 외래 키 역할
    - `ip_hash`: 도배 방지 및 시스템 추적용 식별자
    - `pwd_hash`: 수정/삭제 권한 검증용 해시값
    - `report_count`: 자율 정화 시스템을 위한 신고 누적 횟수 관리

### 🔌 API 엔드포인트 (API Endpoints)
- **`POST /post_issue`**: GitHub 이슈를 생성하고 동시에 로컬 DB에 관리용 메타데이터를 기록합니다.
- **`GET /posts`**: GitHub API를 통해 현재 열려 있는(`open`) 익명 게시글 목록을 조회합니다.
- **`PATCH /update_issue/{issue_number}`**: 입력된 비밀번호 해시가 DB의 `pwd_hash`와 일치할 경우에만 게시글을 수정합니다.
- **`POST /delete_issue/{issue_number}`**: 비밀번호 검증 후 GitHub 이슈를 `closed` 상태로 변경하여 서비스 상에서 '은폐' 처리합니다.

## 4. 코드 구조화 및 리팩토링 (Refactoring)
- **관심사 분리 (SoC)**: 코드의 가독성과 유지보수성을 높이기 위해 모듈을 분리했습니다.
    - `main.py`: API 라우팅 및 비즈니스 로직 제어
    - `github_client.py`: GitHub API 통신 전용 비동기 클라이언트
    - `database.py` / `models.py`: DB 엔진 설정 및 테이블 스키마 정의
    - `schemas.py`: Pydantic을 이용한 요청 데이터 검증(Validation) 정의
- **Lifespan 핸들러**: FastAPI의 최신 권장 방식인 `lifespan`을 사용하여 서버 가동 시 DB 초기화(`init_db`)를 안전하게 처리합니다.

## 5. 데이터베이스 구조 (Database Schema)
현재 `anonymous_wood.db`에 생성된 `postmetadata` 테이블의 구조는 다음과 같습니다.

| Column | Type | Description |
| :--- | :--- | :--- |
| **id** | INTEGER (PK) | 고유 식별자 |
| **issue_number** | INTEGER (Index) | GitHub 이슈 고유 번호 |
| **ip_hash** | VARCHAR | 유저 IP 해시 (도배 방지용) |
| **pwd_hash** | VARCHAR | 본인 확인용 비밀번호 해시 |
| **report_count** | INTEGER | 신고 누적 횟수 (기본값 0) |
| **created_at** | DATETIME | 생성 일시 |
| **updated_at** | DATETIME | 수정 일시 |

---

이 작업 사항은 현재 **3단계(DB 연동)**를 성공적으로 마친 상태이며, 이후 **4단계(Redis를 통한 Rate Limiting)**로 확장 가능한 견고한 기반을 마련했습니다.