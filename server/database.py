# server/database.py
import os
from sqlmodel import create_engine, SQLModel, Session
from dotenv import load_dotenv

load_dotenv()

# [수정됨] PostgreSQL 대신 서버 폴더 안에 'anonymous_wood.db'라는 파일 형태의 DB를 만듭니다.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./anonymous_wood.db")

# SQLite는 여러 스레드 접근을 허용하기 위해 특별한 설정이 필요합니다.
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, echo=True, connect_args=connect_args)

def init_db():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session