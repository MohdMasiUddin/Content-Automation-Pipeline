import os
import shutil
import sys

def get_ffmpeg_path() -> str:
    """Dynamically resolve the path to the FFmpeg binary across macOS and Linux."""
    # 1. Environment variable override
    env_path = os.environ.get("FFMPEG_PATH")
    if env_path and os.path.exists(env_path):
        return env_path
        
    # 2. System PATH check
    system_path = shutil.which("ffmpeg")
    if system_path:
        return system_path
        
    # 3. Known installation path fallbacks
    fallbacks = [
        "/opt/homebrew/bin/ffmpeg",  # macOS Apple Silicon
        "/usr/local/bin/ffmpeg",     # macOS Intel / Linux Custom
        "/usr/bin/ffmpeg",           # Linux Package Manager
    ]
    for fb in fallbacks:
        if os.path.exists(fb):
            return fb
            
    # Default to system invocation
    return "ffmpeg"

def get_ffprobe_path() -> str:
    """Dynamically resolve the path to the FFprobe binary across macOS and Linux."""
    # 1. Environment variable override
    env_path = os.environ.get("FFPROBE_PATH")
    if env_path and os.path.exists(env_path):
        return env_path
        
    # 2. System PATH check
    system_path = shutil.which("ffprobe")
    if system_path:
        return system_path
        
    # 3. Known installation path fallbacks
    fallbacks = [
        "/opt/homebrew/bin/ffprobe",  # macOS Apple Silicon
        "/usr/local/bin/ffprobe",     # macOS Intel / Linux Custom
        "/usr/bin/ffprobe",           # Linux Package Manager
    ]
    for fb in fallbacks:
        if os.path.exists(fb):
            return fb
            
    # Default to system invocation
    return "ffprobe"

def escape_ffmpeg_filter_path(path: str) -> str:
    """Escape path for use in FFmpeg filter complexes (-vf subtitles/overlay)."""
    # Normalize to forward slashes
    normalized = path.replace("\\", "/")
    
    # Escape drive letter colon only on Windows (e.g. C\:/...)
    if sys.platform == "win32" and ":" in normalized:
        drive, rest = normalized.split(":", 1)
        normalized = f"{drive}\\:{rest}"
        
    # Escape single quotes
    return normalized.replace("'", "'\\''")
