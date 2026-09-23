"""Turn an EditPlan into a finished 1080x1920 reel."""
from pathlib import Path
from typing import Callable

from . import ffmpeg_utils as ff
from .plan import EditPlan

W, H, FPS = 1080, 1920, 30
PAD = 0.12          # keep a little air around speech so words are not clipped
MIN_PIECE = 0.35    # drop fragments shorter than this


def keep_ranges(video: Path, info: ff.VideoInfo, plan: EditPlan) -> list[tuple[float, float]]:
    """Parts of the video to keep (everything except long silences)."""
    if not (plan.remove_silences and info.has_audio):
        return [(0.0, info.duration)]
    quiet = ff.silences(video, plan.silence_db, plan.min_silence)
    ranges, cursor = [], 0.0
    for start, end in quiet:
        if start - cursor > 0:
            ranges.append((max(0.0, cursor - PAD), min(info.duration, start + PAD)))
        cursor = end
    if cursor < info.duration:
        ranges.append((max(0.0, cursor - PAD), info.duration))
    ranges = [(a, b) for a, b in ranges if b - a >= MIN_PIECE]
    return ranges or [(0.0, info.duration)]  # all silent? keep everything


def split_into_shots(ranges: list[tuple[float, float]], shot_length: float) -> list[tuple[float, float]]:
    """Chop kept ranges into shots of roughly `shot_length` seconds (evenly, no tiny leftovers)."""
    shots = []
    for a, b in ranges:
        n = max(1, round((b - a) / shot_length))
        step = (b - a) / n
        shots += [(a + i * step, a + (i + 1) * step) for i in range(n)]
    return shots


def _frame_filter(fit: str) -> str:
    if fit == "blur":
        return (
            f"split[bg][fg];"
            f"[bg]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},boxblur=25:2[bg];"
            f"[fg]scale={W}:{H}:force_original_aspect_ratio=decrease[fg];"
            f"[bg][fg]overlay=(W-w)/2:(H-h)/2"
        )
    return f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}"


def _zoom_filter(plan: EditPlan, index: int, duration: float) -> str:
    z = plan.zoom_amount
    if plan.zoom_style == "punch" and index % 2 == 1 and z > 1.001:
        zw, zh = int(W * z) // 2 * 2, int(H * z) // 2 * 2
        return f",scale={zw}:{zh},crop={W}:{H}"
    if plan.zoom_style == "slow" and z > 1.001:
        frames = max(1, int(duration * FPS))
        return (
            f",zoompan=z='1+{z - 1:.3f}*on/{frames}':d=1:s={W}x{H}:fps={FPS}"
            f":x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
        )
    return ""


def render(video: Path, info: ff.VideoInfo, plan: EditPlan, work: Path, out: Path,
           progress: Callable[[float, str], None]) -> dict:
    fit = plan.fit
    if fit == "auto":
        fit = "crop" if info.height >= info.width else "blur"

    progress(0.05, "كنلقاو فين كاين السكوت...")
    shots = split_into_shots(keep_ranges(video, info, plan), plan.shot_length)

    shot_dir = work / "shots"
    shot_dir.mkdir(parents=True, exist_ok=True)
    files = []
    for i, (start, end) in enumerate(shots):
        progress(0.1 + 0.8 * i / len(shots), f"كنمونطيو اللقطة {i + 1} من {len(shots)}")
        dur = end - start
        vf = _frame_filter(fit) + _zoom_filter(plan, i, dur) + f",fps={FPS},setsar=1,format=yuv420p"
        dest = shot_dir / f"shot_{i:04d}.mp4"
        args = ["-y", "-ss", f"{start:.3f}", "-t", f"{dur:.3f}", "-i", str(video)]
        if not info.has_audio:
            args += ["-f", "lavfi", "-t", f"{dur:.3f}", "-i", "anullsrc=r=44100:cl=stereo"]
        # Same codec settings for every shot so they can be joined without re-encoding.
        args += [
            "-filter_complex", f"[0:v]{vf}[v]", "-map", "[v]",
            "-map", "0:a:0" if info.has_audio else "1:a:0",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
            "-c:a", "aac", "-b:a", "160k", "-ar", "44100", "-ac", "2",
            "-shortest", str(dest),
        ]
        ff.run(args)
        files.append(dest)

    progress(0.92, "كنجمعو اللقطات...")
    concat_list = work / "concat.txt"
    concat_list.write_text("".join(f"file '{f.resolve().as_posix()}'\n" for f in files))
    ff.run(["-y", "-f", "concat", "-safe", "0", "-i", str(concat_list),
            "-c", "copy", "-movflags", "+faststart", str(out)])

    final = ff.probe(out)
    return {
        "shots": len(shots),
        "original_duration": round(info.duration, 1),
        "final_duration": round(final.duration, 1),
        "fit": fit,
    }
