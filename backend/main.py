from fastapi import FastAPI 
from fastapi.middleware.cors import CORSMiddleware
import requests
import os
import json
from dotenv import load_dotenv
from google import genai

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

@app.get("/")
def health_check():
    return {"status": "AI COde Reviewer backend is running"}

@app.get("/api/review")
def get_pr_review(pr_url: str):
    # Validate URL format
    if "github.com" not in pr_url or "/pull/" not in pr_url:
        return {"error": "That doesn't look like a valid GitHub PR URL. Expected format: https://github.com/owner/repo/pull/123"}

    try:
        parts = pr_url.strip("/").split("/")
        owner = parts[-4]
        repo = parts[-3]
        pr_number = parts[-1]
    except IndexError:
        return {"error": "Could not parse the PR URL. Please check the format."}

    github_api_url = f"https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}/files"
    response = requests.get(github_api_url)

    if response.status_code == 404:
        return {"error": "PR not found. It may be private, deleted, or the URL is incorrect."}
    if response.status_code == 403:
        return {"error": "GitHub API rate limit reached. Please try again in a few minutes."}
    if response.status_code != 200:
        return {"error": f"Could not fetch PR from GitHub (status {response.status_code})."}

    files = response.json()

    if not files:
        return {"error": "This PR has no file changes to review."}

    diff_text = ""
    for f in files[:5]:
        diff_text += f"\n\nFile: {f['filename']}\n{f.get('patch', '')}"

    prompt = f"""You are a senior code reviewer. Review the following code diff and 
respond ONLY with valid JSON, no markdown, no backticks, no extra text, matching 
this exact schema:

{{
  "summary": "string",
  "issues": [
    {{"file": "string", "severity": "low|medium|high", "category": "bug|style|security|performance", "comment": "string"}}
  ],
  "overall_quality_score": number
}}

Diff to review:
{diff_text}
"""

    try:
        ai_response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=prompt
        )
    except Exception as e:
        return {"error": "AI review failed. The service may be temporarily unavailable. Please try again."}

    raw_text = ai_response.text.strip()
    raw_text = raw_text.replace("```json", "").replace("```", "").strip()

    try:
        review = json.loads(raw_text)
    except json.JSONDecodeError:
        return {"error": "Could not parse the AI's response. Please try again."}

    return review