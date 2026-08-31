import json
import mimetypes
import os

from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

MODEL_NAME = os.getenv('GEMINI_MODEL', 'gemini-flash-latest')


def _extract_response_text(response_data):
    try:
        return response_data['candidates'][0]['content']['parts'][0]['text']
    except (KeyError, IndexError, TypeError) as error:
        raise RuntimeError('لم يرجع النموذج نتيجة صالحة') from error


def _parse_model_result(text):
    cleaned = text.strip()
    if cleaned.startswith('```'):
        cleaned = cleaned.split('\n', 1)[1].rsplit('```', 1)[0].strip()

    try:
        result = json.loads(cleaned)
    except json.JSONDecodeError as error:
        raise RuntimeError('النموذج أرسل نتيجة غير قابلة للقراءة') from error

    if not isinstance(result, dict):
        raise RuntimeError('تنسيق نتيجة النموذج غير صحيح')

    return {
        'extracted_text': str(result.get('extracted_text', 'لا يوجد نص واضح في الصورة')),
        'image_description': str(result.get('image_description', 'لم يتم إنشاء وصف للصورة'))
    }


def analyze_image(image_path):
    api_key = os.getenv('GEMINI_API_KEY', '').strip()
    if not api_key:
        raise RuntimeError('لم يتم ضبط GEMINI_API_KEY في ملف .env')
    try:
        api_key.encode('ascii')
    except UnicodeEncodeError as error:
        raise RuntimeError('قيمة GEMINI_API_KEY غير صحيحة. ضع مفتاح Gemini الحقيقي بدل النص التجريبي العربي') from error

    mime_type = mimetypes.guess_type(image_path)[0] or 'image/jpeg'
    with open(image_path, 'rb') as image_file:
        image_data = image_file.read()

    prompt = (
        'حلل الصورة وأعد JSON فقط بدون markdown أو شرح إضافي. '
        'استخرج كل النص الظاهر فيها بدقة، ثم اكتب وصفًا عربيًا مختصرًا لمحتوى الصورة. '
        'استخدم المفتاحين exactly: extracted_text و image_description. '
        'إذا لم يوجد نص، اكتب لا يوجد نص واضح في الصورة.'
    )
    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=[
            prompt,
            types.Part.from_bytes(data=image_data, mime_type=mime_type)
        ],
        config=types.GenerateContentConfig(
            temperature=0.1,
            response_mime_type='application/json'
        )
    )

    if not response.text:
        raise RuntimeError('لم يرجع النموذج نتيجة نصية')
    return _parse_model_result(response.text)