from dotenv import load_dotenv
import os

load_dotenv()

# Support both plain names and VITE_ prefixed names (from existing .env)
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN") or os.getenv("VITE_GITHUB_TOKEN")
REPO_OWNER = os.getenv("REPO_OWNER") or os.getenv("VITE_REPO_OWNER")
REPO_NAME = os.getenv("REPO_NAME") or os.getenv("VITE_REPO_NAME")

GITHUB_API_URL = f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/issues"

# Fail fast when required env vars are missing
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
