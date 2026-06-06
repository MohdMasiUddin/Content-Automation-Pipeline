import os
from backend.services.subtitle_service import subtitle_service

api_key = os.environ.get("GEMINI_API_KEY", "AQ.Ab8RN6JKu71hgT10I6aEECwiG6fGRZrBCkDUFgwQZj4f415IBA")
audio_path = "/home/unknown/Documents/for masi/outputs/.temp_subtitles/#trend [-uTeYhvpVKI].mp3"

res = subtitle_service._generate_srt_gemini(api_key, audio_path)
print("--- GENERATED SRT ---")
print(res)
print("---------------------")
