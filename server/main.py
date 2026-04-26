from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from database import init_db, get_session
from models import PostMetadata
import os
import hashlib
from contextlib import asynccontextmanager
from datetime import date

from schemas import PostIssueRequest, UpdateIssueRequest, DeleteRequest
from github_client import GITHUB_API_URL, GITHUB_TOKEN, create_github_issue, list_github_issues, update_github_issue
import httpx

@asynccontextmanager
async def lifespan(app: FastAPI):
    # [1] Startup: 서버가 켜질 때 실행될 로직
    print("MUYAHO 서버가 가동됩니다. DB를 초기화합니다.")
    init_db()
    
    yield  # 서버가 실행되는 동안 여기서 대기합니다.

    # [2] Shutdown: 서버가 꺼질 때 실행될 로직 (필요 시)
    print("서버를 종료합니다. 리소스를 정리합니다.")

# lifespan을 FastAPI 인스턴스 생성 시 등록합니다.
app = FastAPI(lifespan=lifespan)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    # Allow both common dev ports for the client (5173 and 5174)
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/response schemas and GitHub client are in separate modules for clarity

SECRET_SALT = os.getenv("SECRET_SALT", "default_salt")

def get_ip_hash(request: Request) -> str:
    """
    유저의 IP를 가져와 솔트와 함께 해싱하여 익명 ID를 생성합니다.
    """
    client_ip = request.client.host
    today = date.today().isoformat()
    raw_string = f"{client_ip}{SECRET_SALT}{today}"
    return hashlib.sha256(raw_string.encode()).hexdigest()[:12]

@app.get("/")
def read_root():
    return {"message": "Welcome to the Anonymous Wood Server"}

@app.post("/post_issue")
async def create_issue(issue: PostIssueRequest, request: Request, db: Session = Depends(get_session)):
    # IP 기반 익명 ID 생성
    ip_id = get_ip_hash(request)
    # 기존 비밀번호 기반 ID 생성
    pwd_id = hashlib.sha256(issue.password.encode()).hexdigest()[:8]

    # 본문 구성
    # 유저는 본인의 비밀번호 ID로 식별하고, 시스템은 IP ID로 도배를 관리합니다.
    formatted_body = (
        f"{issue.content}\n\n"
        # f"---\n"
        # f"> **System Trace**\n"
        # f"> IP_HASH: {ip_id}\n"
        # f"> PWD_HASH: {pwd_id}"
    )

    response = await create_github_issue(issue.title, formatted_body, labels=["anonymous-post"])
    if response.status_code == 201:
        issue_data = response.json()
        # [5] DB에 메타데이터 저장 (3단계 핵심)
        new_meta = PostMetadata(
            issue_number=issue_data["number"],
            ip_hash=ip_id,
            pwd_hash=pwd_id,
        )
        db.add(new_meta)
        db.commit()

        # pwd_id로 변수명 수정
        return {"message": "익명 장부에 기록되었습니다.", "anonymous_id": pwd_id}
    else:
        raise HTTPException(status_code=response.status_code, detail="기록 실패")


@app.get("/posts")
async def list_posts(db: Session = Depends(get_session)):
    try:
        # 1. GitHub에서 기본 이슈 목록 가져오기 (인덱싱 지연 발생 가능)
        issues = await list_github_issues()
        issue_dict = {i.get("number"): i for i in issues}

        # 2. 우리 DB에서 삭제되지 않은 최근 메타데이터 가져오기
        # (최신 10개 정도만 체크해도 Add Flicker는 충분히 잡습니다)
        statement = select(PostMetadata).where(PostMetadata.is_deleted == False).order_by(PostMetadata.id.desc()).limit(10)
        recent_metas = db.exec(statement).all()

        results = []
        
        async with httpx.AsyncClient() as client:
            for meta in recent_metas:
                num = meta.issue_number
                
                # Case A: GitHub 리스트에 이미 있는 경우 -> 그대로 사용
                if num in issue_dict:
                    target_issue = issue_dict[num]
                    results.append({
                        "id": num,
                        "title": target_issue.get("title"),
                        "content": target_issue.get("body"),
                        "author_id": meta.pwd_hash
                    })
                
                # Case B: DB에는 있는데 GitHub 리스트(Search)에는 없는 경우 (Add Flicker 상황)
                else:
                    # 해당 이슈 번호로 "직접" 단일 조회 (단일 조희는 인덱싱과 상관없이 즉시 반영됨)
                    single_issue_url = f"{GITHUB_API_URL}/{num}"
                    resp = await client.get(single_issue_url, headers={
                        "Authorization": f"token {GITHUB_TOKEN}",
                        "Accept": "application/vnd.github.v3+json",
                    })
                    
                    if resp.status_code == 200:
                        target_issue = resp.json()
                        # 이슈가 open 상태인 경우만 추가
                        if target_issue.get("state") == "open":
                            results.append({
                                "id": num,
                                "title": target_issue.get("title"),
                                "content": target_issue.get("body"),
                                "author_id": meta.pwd_hash
                            })

        return results
    except Exception as exc:
        print(f"❌ Error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@app.patch("/update_issue/{issue_number}")
async def update_issue(
    issue_number: int, 
    update: UpdateIssueRequest, 
    db: Session = Depends(get_session)
):
    # [1] DB 보안 검증: 해당 글의 비밀번호 해시 가져오기
    statement = select(PostMetadata).where(PostMetadata.issue_number == issue_number)
    metadata = db.exec(statement).first()

    if not metadata:
        raise HTTPException(status_code=404, detail="수정할 기록이 없습니다.")

    # [2] 비밀번호 대조
    input_pwd_hash = hashlib.sha256(update.password.encode()).hexdigest()[:8]
    if metadata.pwd_hash != input_pwd_hash:
        raise HTTPException(status_code=403, detail="비밀번호가 틀려 수정할 수 없습니다. 🙅‍♂️")

    # [3] 업데이트할 데이터 구성
    payload = {}
    if update.title:
        payload["title"] = update.title
    if update.content:
        # GitHub API는 본문을 'body'라는 키로 받으므로 변환해서 넣어줍니다.
        payload["body"] = update.content 

    if not payload:
        raise HTTPException(status_code=400, detail="수정할 내용이 입력되지 않았습니다.")

    # [4] GitHub 반영
    response = await update_github_issue(issue_number, payload)

    if response.status_code in (200, 201):
        return {"message": "글이 성공적으로 수정되었습니다."}
    else:
        raise HTTPException(status_code=response.status_code, detail="GitHub 반영 실패")

@app.post("/delete_issue/{issue_number}")
async def delete_issue(issue_number: int, req: DeleteRequest, db: Session = Depends(get_session)):
    statement = select(PostMetadata).where(PostMetadata.issue_number == issue_number)
    metadata = db.exec(statement).first()
    """
    DB에 저장된 pwd_hash와 유저가 입력한 비밀번호를 비교하여 
    일치할 경우에만 GitHub 이슈를 닫습니다.
    """
    if not metadata:
        raise HTTPException(status_code=404, detail="삭제할 기록을 찾을 수 없습니다.")

    input_pwd_hash = hashlib.sha256(req.password.encode()).hexdigest()[:8]
    if metadata.pwd_hash != input_pwd_hash:
        raise HTTPException(status_code=403, detail="비밀번호가 일치하지 않습니다.")

    # [중요] GitHub 반영 전에 우리 DB 상태를 먼저 변경 (즉시 반영을 위해)
    metadata.is_deleted = True
    db.add(metadata)
    db.commit()

    # GitHub 이슈 닫기
    response = await update_github_issue(issue_number, {"state": "closed"})

    if response.status_code in (200, 201):
        return {"message": "성공적으로 흔적을 지웠습니다."}
    else:
        raise HTTPException(status_code=response.status_code, detail="GitHub 반영에 실패했습니다.")