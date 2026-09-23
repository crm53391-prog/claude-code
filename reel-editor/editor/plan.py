"""Decide *how* to edit: from the reference video's rhythm, the user's notes, and (optionally) Claude."""
import base64
import json
import os
import statistics
from dataclasses import asdict, dataclass
from pathlib import Path

from . import ffmpeg_utils as ff

MODEL = "claude-opus-5"


@dataclass
class EditPlan:
    remove_silences: bool = True
    silence_db: float = -32.0      # quieter than this counts as silence
    min_silence: float = 0.45      # only cut pauses longer than this (seconds)
    shot_length: float = 2.5       # target seconds between cuts / zoom changes
    zoom_style: str = "punch"      # "punch" (alternate 100% / zoomed), "slow" (push-in), "none"
    zoom_amount: float = 1.18      # 1.0 = no zoom
    fit: str = "auto"              # "crop" (fill 9:16), "blur" (blurred background), "auto"
    summary: str = ""              # human-readable explanation shown in the UI
    source: str = "rules"          # "ai" or "rules"


def reference_stats(ref: Path) -> dict:
    info = ff.probe(ref)
    cuts = ff.scene_cuts(ref)
    bounds = [0.0, *cuts, info.duration]
    shots = [b - a for a, b in zip(bounds, bounds[1:]) if b - a > 0.15]
    return {
        "duration": round(info.duration, 2),
        "cut_count": len(cuts),
        "avg_shot_length": round(statistics.mean(shots), 2) if shots else None,
        "median_shot_length": round(statistics.median(shots), 2) if shots else None,
        "vertical": info.height > info.width,
    }


def rules_plan(ref: dict | None) -> EditPlan:
    plan = EditPlan()
    if ref and ref.get("median_shot_length"):
        plan.shot_length = min(6.0, max(1.0, ref["median_shot_length"]))
        plan.summary = (
            f"الفيديو المثال فيه {ref['cut_count']} قطعة، وكل لقطة كتدوم تقريبا "
            f"{plan.shot_length:.1f} ثانية. طبقنا نفس الإيقاع مع زوم متناوب وحيدنا السكوت."
        )
    else:
        plan.summary = "مونتاج أساسي: حيدنا السكوت، قطعنا كل 2.5 ثانية، وزدنا زوم متناوب."
    return plan


_SCHEMA = {
    "type": "object",
    "properties": {
        "remove_silences": {"type": "boolean"},
        "silence_db": {"type": "number", "description": "Silence threshold in dB, between -45 and -20"},
        "min_silence": {"type": "number", "description": "Minimum pause to cut, 0.2 to 2.0 seconds"},
        "shot_length": {"type": "number", "description": "Seconds between cuts/zoom changes, 0.8 to 8"},
        "zoom_style": {"type": "string", "enum": ["punch", "slow", "none"]},
        "zoom_amount": {"type": "number", "description": "1.0 to 1.5"},
        "fit": {"type": "string", "enum": ["crop", "blur", "auto"]},
        "summary": {"type": "string", "description": "2-3 sentences in Moroccan Darija (Arabic script) explaining the edit"},
    },
    "required": ["remove_silences", "silence_db", "min_silence", "shot_length",
                 "zoom_style", "zoom_amount", "fit", "summary"],
    "additionalProperties": False,
}

_PROMPT = """You are a professional Instagram Reels editor. Decide the basic edit for the USER video
so it matches the style of the REFERENCE video (if given) and the user's notes.

Available tools (only these):
- remove_silences: cut dead air / pauses (jump cuts). Great for talking videos, bad for music-only or b-roll.
- shot_length: how often a cut or zoom change happens. Match the reference rhythm.
- zoom_style: "punch" = alternate between normal and zoomed-in every shot (classic talking-head reel),
  "slow" = gentle continuous push-in on each shot, "none".
- zoom_amount: how strong the zoom is.
- fit: how to turn the video into 9:16. "crop" fills the screen, "blur" keeps the whole frame over a
  blurred copy (good for horizontal footage), "auto" picks by aspect ratio.

The measured numbers are reliable; the frames show what the videos look like.
User notes (may be English, Darija or French; they override the reference when they conflict):
{notes}

Reference stats: {ref}
User video stats: {user}"""


def _image_block(path: Path) -> dict:
    data = base64.standard_b64encode(path.read_bytes()).decode("utf-8")
    return {"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": data}}


def ai_plan(user_video: Path, user_info: ff.VideoInfo, ref_video: Path | None,
            ref: dict | None, notes: str, work: Path) -> EditPlan:
    import anthropic

    content: list[dict] = []
    if ref_video:
        content.append({"type": "text", "text": "REFERENCE video frames (in order):"})
        content += [_image_block(p) for p in ff.extract_frames(ref_video, ref["duration"], work / "ref_frames")]
    content.append({"type": "text", "text": "USER video frames (in order):"})
    content += [_image_block(p) for p in ff.extract_frames(user_video, user_info.duration, work / "user_frames", 4)]
    content.append({"type": "text", "text": _PROMPT.format(
        notes=notes.strip() or "(none)",
        ref=json.dumps(ref) if ref else "(no reference video)",
        user=json.dumps({
            "duration": round(user_info.duration, 2),
            "width": user_info.width,
            "height": user_info.height,
            "has_audio": user_info.has_audio,
        }),
    )})

    client = anthropic.Anthropic()
    response = client.beta.messages.create(
        model=MODEL,
        max_tokens=16000,
        thinking={"type": "adaptive"},
        output_config={"effort": "medium", "format": {"type": "json_schema", "schema": _SCHEMA}},
        betas=["server-side-fallback-2026-07-01"],
        fallbacks="default",
        messages=[{"role": "user", "content": content}],
    )
    if response.stop_reason == "refusal":
        raise RuntimeError("AI declined the request")
    text = next(b.text for b in response.content if b.type == "text")
    data = json.loads(text)

    plan = EditPlan(**data, source="ai")
    # Keep values in a safe range whatever the model returns.
    plan.silence_db = min(-20.0, max(-45.0, plan.silence_db))
    plan.min_silence = min(2.0, max(0.2, plan.min_silence))
    plan.shot_length = min(8.0, max(0.8, plan.shot_length))
    plan.zoom_amount = min(1.5, max(1.0, plan.zoom_amount))
    return plan


def make_plan(user_video: Path, user_info: ff.VideoInfo, ref_video: Path | None,
              notes: str, use_ai: bool, work: Path) -> tuple[EditPlan, str | None]:
    """Returns the plan and, if the AI was requested but failed, the reason."""
    ref = reference_stats(ref_video) if ref_video else None
    if use_ai and os.environ.get("ANTHROPIC_API_KEY"):
        try:
            return ai_plan(user_video, user_info, ref_video, ref, notes, work), None
        except Exception as exc:  # any AI failure falls back to the rule-based edit
            return rules_plan(ref), f"AI unavailable ({type(exc).__name__}): {exc}"[:300]
    reason = "ANTHROPIC_API_KEY is not set" if use_ai else None
    return rules_plan(ref), reason


def plan_dict(plan: EditPlan) -> dict:
    return asdict(plan)
