# MUYAHO - Client

익명 게시판 서비스 **MUYAHO**의 프론트엔드 프로젝트입니다. GitHub Issues를 백엔드 저장소로 활용하며, 최신 웹 기술을 통해 견고하고 유지보수가 용이한 아키텍처를 지향합니다.

## 🛠 Tech Stack

- **Framework**: React 18 (Vite)
- **Styling**: Tailwind CSS v4
- **State Management**: TanStack Query (React Query) v5
- **Form Management**: React Hook Form
- **Validation**: Zod
- **API Client**: Axios

## 🏗 Architecture & Key Features

### 1. 선언적 서버 상태 관리 (TanStack Query)
- `useQuery`와 `useMutation`을 활용하여 비동기 데이터 흐름을 관리합니다.
- **Infinite Scroll**: `useInfiniteQuery`와 `react-intersection-observer`를 결합하여 대량의 게시글을 효율적으로 로드합니다.
- **Hybrid Sync**: GitHub API의 인덱싱 지연 문제를 해결하기 위해 백엔드와 협력하여 실시간성을 보장하는 필터링 로직을 구현했습니다.

### 2. 관심사의 분리 (Component Refactoring)
비대했던 단일 컴포넌트를 기능 단위로 분리하여 가독성과 재사용성을 높였습니다:
- `PostForm`: Zod 스키마 기반의 유효성 검사가 적용된 글쓰기 폼.
- `PostCard`: 게시글 렌더링 및 익명 ID(IP Hash) 표시 로직.
- `DeleteModal`: 삭제 시 비밀번호 검증을 위한 전용 모달.

### 3. 고성능 폼 유효성 검사 (React Hook Form + Zod)
- **비제어 컴포넌트**: 리렌더링 최적화를 위해 React Hook Form을 사용합니다.
- **Schema Validation**: Zod를 통해 제목(2-20자), 내용(5-2000자), 비밀번호(4-20자)에 대한 엄격한 규칙을 적용했습니다.

### 4. 반응형 디자인 & UX
- **Tailwind v4**: CSS-first 방식의 최신 Tailwind를 사용하여 스타일링했습니다.
- **Responsive Layout**: 모바일 화면에서도 버튼이 튀어나가지 않도록 반응형 UI를 제공합니다.
- **Real-time Feedback**: 게시/삭제 작업 시 각각 독립적인 로딩 상태(`isAdding`, `isRemoving`)를 UI에 반영합니다.

## 🚀 Getting Started

### Installation
```bash
cd client
npm install