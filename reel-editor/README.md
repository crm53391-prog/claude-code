# 🎬 Reel Editor

سيت ويب كيمونطي ليك الفيديو على شكل **Instagram Reel** (1080×1920)، بنفس الستيل ديال فيديو مثال.

## شنو كيدير (الأساسيات)

- **كيحيد السكوت**، يعني الوقفات والفراغ فالهضرة (jump cuts).
- **كيقطع بنفس الإيقاع** ديال الفيديو المثال: كيحسب شحال كتدوم كل لقطة فالمثال ويطبقها على الفيديو ديالك.
- **الزوم**: إما زوم متناوب (punch-in: عادي، زوم، عادي...) ولا زوم بشوية (slow push-in).
- **9:16**: إلا كان الفيديو عمودي كيملا الشاشة، وإلا كان عرضي كيحطو فوق خلفية مضببة.
- **الذكاء الاصطناعي (Claude)**: كيشوف صور من الفيديو المثال ومن الفيديو ديالك، ويقرا الشرح اللي كتبتي (بالإنجليزية ولا الدارجة)، ومن بعد كيختار الإعدادات. بلا AI كيخدم بقواعد أوتوماتيكية.

## كيفاش تخدمو

خاصك Python 3.10+.

```bash
cd reel-editor
pip install -r requirements.txt
export ANTHROPIC_API_KEY=sk-ant-...   # اختياري، باش يخدم الـ AI
uvicorn app:app --port 8000
```

من بعد حل http://localhost:8000 فالبراوزر.

(فالويندوز استعمل `set ANTHROPIC_API_KEY=...` بلاصة `export`.)

FFmpeg كيتزاد أوتوماتيكيا مع `imageio-ffmpeg`. إلا كان عندك `ffmpeg` مثبت فالسيستيم، غادي يستعملو هو.

## Structure

| File | Role |
|---|---|
| `app.py` | FastAPI server: upload, background job, progress, download |
| `editor/ffmpeg_utils.py` | probe, scene-cut detection, silence detection, frame extraction |
| `editor/plan.py` | builds the edit plan: reference rhythm + user notes + Claude (`claude-opus-5`), with a rule-based fallback |
| `editor/render.py` | cuts silences, splits into shots, applies zoom + 9:16 framing, joins the shots |
| `static/index.html` | the web page |

## الخطوات الجاية (من بعد)

سبتايتلز أوتوماتيكيين، موسيقى، ترانزيشنز، تصحيح الألوان على حساب المثال، ونص فوق الفيديو.
