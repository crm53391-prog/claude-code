"""Reel Editor web app: upload a video (+ optional reference reel), get an edited 9:16 reel back.

Run:  uvicorn app:app --reload   then open http://localhost:8000
"""
import shutil
import threading
import traceback
import uuid
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse

from editor import ffmpeg_utils as ff
from editor.plan import make_plan, plan_dict
from editor.render import render

ROOT = Path(__file__).parent
JOBS_DIR = ROOT / "jobs"
MAX_UPLOAD = 1024 * 1024 * 1024  # 1 GB per file

app = FastAPI(title="Reel Editor")
jobs: dict[str, dict] = {}


def _save(upload: UploadFile, dest: Path) -> Path:
    size = 0
    with dest.open("wb") as f:
        while chunk := upload.file.read(1024 * 1024):
            size += len(chunk)
            if size > MAX_UPLOAD:
                raise HTTPException(413, "File too large (max 1 GB)")
            f.write(chunk)
    return dest


def _process(job_id: str, video: Path, ref: Path | None, notes: str, use_ai: bool) -> None:
    job = jobs[job_id]
    work = video.parent

    def progress(value: float, message: str) -> None:
        job["progress"], job["message"] = round(value, 3), message

    try:
        progress(0.01, "كنقراو الفيديو...")
        info = ff.probe(video)
        progress(0.02, "كنحللو الفيديو المثال..." if ref else "كنجهزو المونتاج...")
        plan, ai_warning = make_plan(video, info, ref, notes, use_ai, work)
        job["plan"], job["warning"] = plan_dict(plan), ai_warning
        job["stats"] = render(video, info, plan, work, work / "output.mp4", progress)
        progress(1.0, "سالينا! 🎉")
        job["status"] = "done"
    except Exception as exc:
        traceback.print_exc()
        job["status"], job["error"] = "error", str(exc)[-800:]
    finally:
        shutil.rmtree(work / "shots", ignore_errors=True)


@app.get("/")
def index():
    return FileResponse(ROOT / "static" / "index.html")


@app.post("/api/edit")
def create_edit(
    video: UploadFile = File(...),
    reference: UploadFile | None = File(None),
    notes: str = Form(""),
    use_ai: bool = Form(True),
):
    job_id = uuid.uuid4().hex[:12]
    work = JOBS_DIR / job_id
    work.mkdir(parents=True)
    video_path = _save(video, work / ("input" + Path(video.filename or "").suffix))
    ref_path = None
    if reference is not None and reference.filename:
        ref_path = _save(reference, work / ("reference" + Path(reference.filename).suffix))

    jobs[job_id] = {"status": "running", "progress": 0.0, "message": "بدينا..."}
    threading.Thread(
        target=_process, args=(job_id, video_path, ref_path, notes, use_ai), daemon=True
    ).start()
    return {"job_id": job_id}


@app.get("/api/jobs/{job_id}")
def job_status(job_id: str):
    if job_id not in jobs:
        raise HTTPException(404, "Job not found")
    return jobs[job_id]


@app.get("/api/jobs/{job_id}/video")
def job_video(job_id: str, download: bool = False):
    out = JOBS_DIR / job_id / "output.mp4"
    if jobs.get(job_id, {}).get("status") != "done" or not out.exists():
        raise HTTPException(404, "Video not ready")
    return FileResponse(out, media_type="video/mp4",
                        filename=f"reel_{job_id}.mp4" if download else None)
