from pydantic import BaseModel
from typing import Optional


class PostIssueRequest(BaseModel):
    title: str
    content: str
    password: str


class UpdateIssueRequest(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    state: Optional[str] = None
