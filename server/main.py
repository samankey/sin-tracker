from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session
from database import init_db, get_session
from models import PostMetadata
import os
import hashlib
from contextlib import asynccontextmanager

from .config import SECRET_SALT
from .schemas import PostIssueRequest, UpdateIssueRequest
from .github_client import create_github_issue, list_github_issues, update_github_issue

@asynccontextmanager
async def lifespan(app: FastAPI):
    # [1] Startup: 서버가 켜질 때 실행될 로직
    print("🚀 비밀 세탁소 서버가 가동됩니다. DB를 초기화합니다.")
    init_db()
    
    yield  # 서버가 실행되는 동안 여기서 대기합니다.

    # [2] Shutdown: 서버가 꺼질 때 실행될 로직 (필요 시)
    print("💤 서버를 안전하게 종료합니다. 리소스를 정리합니다.")

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
    raw_string = f"{client_ip}{SECRET_SALT}"
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
        f"### 👤 작성자: 익명_{pwd_id}\n\n"
        f"{issue.content}\n\n"
        f"---\n"
        f"> **System Trace**\n"
        f"> IP_HASH: {ip_id}\n"
        f"> PWD_HASH: {pwd_id}"
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
async def list_posts():
    # Returns issues labeled `anonymous-post` and state=open
    try:
        issues = await list_github_issues()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    # Map to a simplified PostRecord shape
    return [
        {"id": i.get("number"), "title": i.get("title"), "content": i.get("body")} for i in issues
    ]


@app.patch("/update_issue/{issue_number}")
async def update_issue(issue_number: int, update: UpdateIssueRequest):
    # Forward updates (title/body/state) to GitHub issue
    payload = {}
    if update.title is not None:
        payload["title"] = update.title
    if update.body is not None:
        payload["body"] = update.body
    if update.state is not None:
        payload["state"] = update.state

    if not payload:
        raise HTTPException(status_code=400, detail="업데이트할 필드가 없습니다.")

    response = await update_github_issue(issue_number, payload)

    if response.status_code in (200, 201):
        return {"message": "업데이트 성공"}
    else:
        raise HTTPException(status_code=response.status_code, detail="업데이트에 실패했습니다.")