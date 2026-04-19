from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Configure CORS so the React frontend can communicate with the FastAPI server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Change this to specific domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the FastAPI Server"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
