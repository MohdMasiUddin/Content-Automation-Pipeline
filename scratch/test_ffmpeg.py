import sys
import os
from backend.services.subtitle_service import SubtitleService

def test():
    service = SubtitleService()
    srt_path = "test_sub.srt"
    with open(srt_path, "w") as f:
        f.write("1\n00:00:01,000 --> 00:00:03,000\nHello World\n")
    
    video_path = "test.mp4"
    output_path = "test_out.mp4"
    
    styling = {
        "font_size": 16,
        "color": "#c2f0c2",
        "outline_color": "#000000",
        "alignment": 2,
        "margin_v": 17
    }
    
    # Try different filter strings
    # Format 1: original: subtitles='test_sub.srt':force_style='...'
    # Format 2: subtitles=filename='test_sub.srt':force_style='...'
    # Format 3: subtitles='test_sub.srt':force_style=... (no quotes for force_style)
    # Format 4: subtitles=test_sub.srt:force_style='...'
    
    formats = [
        "subtitles='test_sub.srt':force_style='FontSize=16,PrimaryColour=&H00c2f0c2&,OutlineColour=&H00000000&,Alignment=2,MarginV=17'",
        "subtitles=filename='test_sub.srt':force_style='FontSize=16,PrimaryColour=&H00c2f0c2&,OutlineColour=&H00000000&,Alignment=2,MarginV=17'",
        "subtitles='test_sub.srt':force_style=FontSize=16,PrimaryColour=&H00c2f0c2&,OutlineColour=&H00000000&,Alignment=2,MarginV=17",
        "subtitles=test_sub.srt:force_style='FontSize=16,PrimaryColour=&H00c2f0c2&,OutlineColour=&H00000000&,Alignment=2,MarginV=17'"
    ]
    
    for i, fmt in enumerate(formats):
        print(f"\n--- Testing Format {i+1}: {fmt} ---")
        cmd = [
            "ffmpeg", "-y",
            "-i", video_path,
            "-vf", fmt,
            "-c:v", "libx264", "-preset", "fast", "-crf", "23",
            "-c:a", "aac", "-b:a", "192k",
            f"test_out_{i+1}.mp4"
        ]
        import subprocess
        res = subprocess.run(cmd, capture_output=True, text=True)
        print("Success:", os.path.exists(f"test_out_{i+1}.mp4"))
        if not os.path.exists(f"test_out_{i+1}.mp4"):
            print("Error:", res.stderr.split('\n')[-5:])

if __name__ == "__main__":
    test()
