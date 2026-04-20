import httpx
from typing import Any, List
from .config import GITHUB_API_URL, GITHUB_TOKEN, REPO_OWNER, REPO_NAME


async def create_github_issue(title: str, body: str, labels: List[str] | None = None) -> httpx.Response:
    async with httpx.AsyncClient() as client:
        return await client.post(
            GITHUB_API_URL,
            headers={
                "Authorization": f"token {GITHUB_TOKEN}",
                "Accept": "application/vnd.github.v3+json",
            },
            json={
                "title": title,
                "body": body,
                "labels": labels or [],
            },
        )


async def list_github_issues(labels: str = "anonymous-post", state: str = "open") -> List[Any]:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/issues",
            params={"labels": labels, "state": state},
            headers={
                "Authorization": f"token {GITHUB_TOKEN}",
                "Accept": "application/vnd.github.v3+json",
            },
        )
        response.raise_for_status()
        return response.json()


async def update_github_issue(issue_number: int, payload: dict) -> httpx.Response:
    async with httpx.AsyncClient() as client:
        return await client.patch(
            f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/issues/{issue_number}",
            headers={
                "Authorization": f"token {GITHUB_TOKEN}",
                "Accept": "application/vnd.github.v3+json",
            },
            json=payload,
        )
