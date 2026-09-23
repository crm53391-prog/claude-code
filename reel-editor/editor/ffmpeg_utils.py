"""Thin helpers around the ffmpeg binary (probing, scene cuts, silences, frames)."""
import re
import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path


def ffmpeg_bin() -> str:
    """System ffmpeg if installed, otherwise the one bundled with imageio-ffmpeg."""
    found = shutil.which("ffmpeg")
    if found:
        return found
    try:
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError as exc:
        raise RuntimeError(
            "ffmpeg not found. Install it (https://ffmpeg.org) or run: pip install imageio-ffmpeg"
        ) from exc


def run(args: list[str]) -> subprocess.CompletedProcess:
    """Run ffmpeg with the given args; raise with the tail of stderr on failure."""
    proc = subprocess.run(
        [ffmpeg_bin(), "-hide_banner", *args],
        capture_output=True,
        text=True,
        errors="replace",
    )
    if proc.returncode != 0:
        raise RuntimeError("ffmpeg failed:\n" + proc.stderr[-2000:])
    return proc


@dataclass
class VideoInfo:
    duration: float
    width: int
    height: int
    fps: float
    has_audio: bool


def probe(path: Path) -> VideoInfo:
    # `ffmpeg -i` with no output exits non-zero but prints stream info to stderr.
    proc = subprocess.run(
        [ffmpeg_bin(), "-hide_banner", "-i", str(path)],
        capture_output=True,
        text=True,
        errors="replace",
    )
    err = proc.stderr
    m = re.search(r"Duration: (\d+):(\d+):(\d+(?:\.\d+)?)", err)
    if not m:
        raise RuntimeError("Could not read this video file.")
    duration = int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3))

    video_line = next((l for l in err.splitlines() if "Video:" in l), "")
    size = re.search(r"\b(\d{2,5})x(\d{2,5})\b", video_line)
    if not size:
        raise RuntimeError("No video stream found in this file.")
    width, height = int(size.group(1)), int(size.group(2))
    # Phone videos often carry a rotation flag; swap so width/height match what you see.
    if re.search(r"rotat\w*\D*(-?90|270)", err):
        width, height = height, width
    fps_m = re.search(r"(\d+(?:\.\d+)?) fps", video_line)
    fps = float(fps_m.group(1)) if fps_m else 30.0
    return VideoInfo(duration, width, height, fps, "Audio:" in err)


def scene_cuts(path: Path, threshold: float = 0.3) -> list[float]:
    """Timestamps (seconds) where the picture changes sharply, i.e. editing cuts."""
    proc = run([
        "-i", str(path),
        "-vf", f"scale=320:-2,select='gt(scene,{threshold})',showinfo",
        "-an", "-f", "null", "-",
    ])
    return [float(t) for t in re.findall(r"pts_time:(\d+(?:\.\d+)?)", proc.stderr)]


def silences(path: Path, noise_db: float, min_silence: float) -> list[tuple[float, float]]:
    """(start, end) of every quiet stretch longer than `min_silence` seconds."""
    proc = run([
        "-i", str(path),
        "-af", f"silencedetect=noise={noise_db}dB:d={min_silence}",
        "-vn", "-f", "null", "-",
    ])
    starts = [float(x) for x in re.findall(r"silence_start: (-?\d+(?:\.\d+)?)", proc.stderr)]
    ends = [float(x) for x in re.findall(r"silence_end: (\d+(?:\.\d+)?)", proc.stderr)]
    out = []
    for i, s in enumerate(starts):
        e = ends[i] if i < len(ends) else float("inf")  # silence running to the end
        out.append((max(0.0, s), e))
    return out


def extract_frames(path: Path, duration: float, out_dir: Path, count: int = 6) -> list[Path]:
    """Save `count` evenly spaced small JPEG frames for the AI to look at."""
    out_dir.mkdir(parents=True, exist_ok=True)
    frames = []
    for i in range(count):
        t = duration * (i + 0.5) / count
        dest = out_dir / f"frame_{i:02d}.jpg"
        try:
            run(["-y", "-ss", f"{t:.2f}", "-i", str(path), "-frames:v", "1",
                 "-vf", "scale=-2:480", "-q:v", "5", str(dest)])
        except RuntimeError:
            continue
        if dest.exists():
            frames.append(dest)
    return frames
