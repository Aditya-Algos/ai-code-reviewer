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
def get_pr_diff(pr_url: str):
    parts = pr_url.strip("/").split("/")
    owner = parts[-4]
    repo = parts[-3]
    pr_number = parts[-1]

    github_api_url = f"https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}/files"
    response =requests.get(github_api_url)

    if response.status_code != 200:
        return {"error": "Could not fetch PR", "status": response.status_code}

    files = response.json()

    diff_text=""
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

    ai_response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt
    )

    raw_text = ai_response.text.strip()

    raw_text = raw_text.replace("```json", "").replace("```", "").strip()

    try:
        review =json.loads(raw_text)
    except json.JSONDecodeError:
        return {"error": "Could not parse AI response", "raw_response": raw_text}

    return review