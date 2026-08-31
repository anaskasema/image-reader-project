# محطة فحص الصور

مشروع Flask لتحليل الصور باستخدام نموذج رؤية خارجي جاهز عبر Gemini API. يستخرج النص الظاهر في الصورة ويكتب وصفًا عربيًا لمحتواها.

## التقنيات المستخدمة
- Flask
- Gemini Vision API (استخراج النص ووصف الصورة)
- Pillow (التحقق من الصور)
- Requests (الاتصال بالـ API)

## طريقة التشغيل

1. جهّز بيئة افتراضية (اختياري بس مستحسن):
```
python -m venv venv
source venv/bin/activate      # على ويندوز: venv\Scripts\activate
```

2. ثبّت المكتبات:
```
pip install -r requirements.txt
```

3. أنشئ ملفًا باسم `.env` اعتمادًا على `.env.example`، وضع فيه مفتاح Gemini:

```env
GEMINI_API_KEY=مفتاحك_هنا
GEMINI_MODEL=gemini-flash-latest
```

يمكن الحصول على المفتاح من Google AI Studio. لا تضع المفتاح داخل `index.html` ولا ترفعه إلى Git.

4. شغّل السيرفر:
```
python app.py
```

5. افتح المتصفح على:
```
http://127.0.0.1:5000
```

## طريقة العمل

- الواجهة ترسل الصورة إلى `POST /analyze`.
- Flask يتحقق من النوع والحجم، ثم يرسل الصورة إلى Gemini.
- Gemini يعيد JSON يحتوي على `extracted_text` و`image_description`.
- الصورة تحفظ مؤقتًا داخل `uploads/` وتحذف بعد كل تحليل.
- الحد الأقصى للصورة 10 ميجابايت والامتدادات المدعومة: PNG وJPG وWEBP وGIF.

## الاختبارات

```powershell
\.venv\Scripts\python.exe -m unittest -v test_app.py
```
