from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import httpx
import os
from dotenv import load_dotenv
import hashlib

load_dotenv()
app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    # Allow both common dev ports for the client (5173 and 5174)
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
REPO_OWNER = os.getenv("REPO_OWNER")
REPO_NAME = os.getenv("REPO_NAME")
GITHUB_API_URL = f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/issues"

# Fail fast when required env vars are missing to avoid confusing 401 responses from GitHub.
missing = [
    name for name, val in (
        ("GITHUB_TOKEN", GITHUB_TOKEN),
        ("REPO_OWNER", REPO_OWNER),
        ("REPO_NAME", REPO_NAME),
    )
    if not val
]
if missing:
    raise RuntimeError(
        "Missing required environment variables: " + ", ".join(missing) + 
        ". Please set them (e.g. in server/.env) before starting the server."
    )

class PostIssueRequest(BaseModel):
    title: str
    content: str
    password: str


class UpdateIssueRequest(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    state: Optional[str] = None

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
async def create_issue(issue: PostIssueRequest, request: Request):
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

    async with httpx.AsyncClient() as client:
        response = await client.post(
            GITHUB_API_URL,
            headers={
                "Authorization": f"token {GITHUB_TOKEN}",
                "Accept": "application/vnd.github.v3+json",
            },
            json={
                "title": issue.title,
                "body": formatted_body,
                "labels": ["anonymous-post"]
            }
        )
        
        if response.status_code == 201:
            return {"message": "익명 장부에 기록되었습니다.", "anonymous_id": anonymous_id}
        else:
            raise HTTPException(status_code=response.status_code, detail="기록에 실패했습니다.")


@app.get("/posts")
async def list_posts():
    # Returns issues labeled `anonymous-post` and state=open
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/issues",
            params={"labels": "anonymous-post", "state": "open"},
            headers={
                "Authorization": f"token {GITHUB_TOKEN}",
                "Accept": "application/vnd.github.v3+json",
            },
        )

        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="조회에 실패했습니다.")

        issues = response.json()
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

    async with httpx.AsyncClient() as client:
        response = await client.patch(
            f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/issues/{issue_number}",
            headers={
                "Authorization": f"token {GITHUB_TOKEN}",
                "Accept": "application/vnd.github.v3+json",
            },
            json=payload,
        )

        if response.status_code in (200, 201):
            return {"message": "업데이트 성공"}
        else:
            raise HTTPException(status_code=response.status_code, detail="업데이트에 실패했습니다.")