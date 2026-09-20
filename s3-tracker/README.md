# مسار S3 — S3 Track

لوحة تتبع محاضرات وأساتذة سيميستر 3 بالطب (Anatomie III، Sémiologie I، Physiologie II، Biochimie clinique، Fonctions vitales et secourisme، Art et histoire de la médecine)، مبنية من البيانات الحقيقية ديال الموديولات.

## الملفات

- `index.html` — الصفحة النهائية (self-contained، بلا اعتماديات خارجية غير Google Fonts).
- `build_tracker.py` — السكريبت اللي كيبني `index.html` من `modules_data.json`.
- `modules_data.json` — بنية الموديولات/الدروس/الأساتذة.

## المميزات

- الرئيسية فيها كرت لكل مادة (6 موديولات) مع نسبة التقدم.
- صفحة خاصة بكل مادة فيها الدروس مجموعين حسب الأستاذ.
- تتبع حالة كل درس بثلاث مراحل: باقي / كنخدم فيها / خلصتها.
- ملاحظات نصية تحت كل درس.
- إضافة ملفات/دعامات (PDF أو صور) لكل مادة.
- عداد للامتحان.
- ثلاث لغات للواجهة: العربية، English، Français.
- صوت خفيف عند كل تفاعل.

## ملاحظة مهمة

هاد الصفحة مبنية باش تخدم داخل بيئة **Claude Artifacts** (كتستعمل `window.claude.use('artifact')` و `window.claude.use('assets')` باش تحفظ التقدم والملفات أوتوماتيك). إلا فتحتيها كملف `.html` عادي (بحال GitHub Pages أو محليا)، غادي تخدم كصفحة عرض فقط (read-only) بلا حفظ تلقائي، حيت هاد الخاصيات غير متوفرة برا Claude.

النسخة الحية والقابلة للتعديل: يمكن الوصول ليها عبر رابط Claude Artifact.

## إعادة البناء

```bash
python3 build_tracker.py
```
