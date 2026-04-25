from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class PostMetadata(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    issue_number: int = Field(index=True)  # GitHub 이슈 번호 (검색 최적화를 위한 인덱스 추가)
    ip_hash: str                           # 도배 방지용 IP 식별값
    pwd_hash: str                          # 수정/삭제 검증용 비밀번호 식별값
    report_count: int = Field(default=0)   # 신고 누적 횟수
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
