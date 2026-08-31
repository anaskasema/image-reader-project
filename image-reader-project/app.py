from flask import Flask, render_template, request, jsonify
import os
import uuid
from PIL import Image
from werkzeug.utils import secure_filename
from models.external_model import analyze_image

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'gif'}
MAX_FILE_SIZE = 10 * 1024 * 1024
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.errorhandler(413)
def file_too_large(_error):
    return jsonify({'error': 'حجم الصورة يجب ألا يتجاوز 10 ميجابايت'}), 413


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/health')
def health():
    return jsonify({'status': 'ok'})


@app.route('/analyze', methods=['POST'])
def analyze():
    if 'image' not in request.files:
        return jsonify({'error': 'لم يتم رفع صورة'}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'لم يتم اختيار أي ملف'}), 400
    if not allowed_file(file.filename):
        return jsonify({'error': 'نوع الملف غير مدعوم. استخدم PNG أو JPG أو WEBP'}), 400

    original_name = secure_filename(file.filename)
    ext = os.path.splitext(original_name)[1].lower()

    unique_filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
    file.save(filepath)

    try:
        with Image.open(filepath) as image:
            image.verify()

        result = analyze_image(filepath)
        return jsonify({
            'extracted_text': result['extracted_text'],
            'image_description': result['image_description']
        })
    except Exception as e:
        app.logger.exception('Image analysis failed')
        return jsonify({'error': str(e)}), 502
    finally:
        # حذف الصورة بعد المعالجة
        if os.path.exists(filepath):
            os.remove(filepath)


if __name__ == '__main__':
    app.run(debug=True)