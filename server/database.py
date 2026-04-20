import os
from sqlmodel import create_engine, SQLModel, Session
from dotenv import load_dotenv

load_dotenv()

# 로컬 PostgreSQL 주소 (Docker 사용 시 주소 확인 필요)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/anonymous_wood")

engine = create_engine(DATABASE_URL, echo=True) # echo=True는 쿼리 로그를 남겨줍니다 (학습용)

def init_db():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session