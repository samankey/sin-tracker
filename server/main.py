from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import os
from dotenv import load_dotenv
import hashlib

load_dotenv()
app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
REPO_OWNER = os.getenv("REPO_OWNER")
REPO_NAME = os.getenv("REPO_NAME")
GITHUB_API_URL = f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/issues"

class PostIssueRequest(BaseModel):
    title: str
    content: str
    password: str

@app.get("/")
def read_root():
    return {"message": "Welcome to the Anonymous Wood Server"}

@app.post("/post_issue")
async def create_issue(issue: PostIssueRequest):
    anonymous_id = hashlib.sha256(issue.password.encode()).hexdigest()[:8]
    
    formatted_body = f"### 👤 익명_{anonymous_id}님의 제보\n\n---\n\n{issue.content}"

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