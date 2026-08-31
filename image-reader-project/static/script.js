document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('imageInput');
    const lightbox = document.getElementById('lightbox');
    const preview = document.getElementById('preview');
    const dropHint = document.getElementById('dropHint');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const resetBtn = document.getElementById('resetBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const copyBtn = document.getElementById('copyBtn');
    const removeFile = document.getElementById('removeFile');
    const fileMeta = document.getElementById('fileMeta');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const status = document.getElementById('status');
    const results = document.getElementById('results');
    const textResult = document.getElementById('textResult');
    const captionResult = document.getElementById('captionResult');
    const themeToggle = document.getElementById('themeToggle');
    const maxFileSize = 10 * 1024 * 1024;

    function applyTextDirection(element, text) {
        const normalizedText = (text || '').trim();
        if (!normalizedText) {
            element.style.direction = 'rtl';
            element.style.textAlign = 'right';
            return;
        }

        const englishLetters = (normalizedText.match(/[A-Za-z]/g) || []).length;
        const arabicLetters = (normalizedText.match(/[\u0600-\u06FF]/g) || []).length;

        const isEnglish = englishLetters > 0 && (arabicLetters === 0 || englishLetters >= arabicLetters);
        const direction = isEnglish ? 'ltr' : 'rtl';

        element.style.direction = direction;
        element.style.textAlign = direction === 'ltr' ? 'left' : 'right';
    }

    // 1. إدارة الوضع الليلي/النهاري
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        themeToggle.textContent = '☀️';
    }

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        themeToggle.textContent = isLight ? '☀️' : '🌙';
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });

    // 2. إعادة ضبط الواجهة
    function resetView(message = '') {
        preview.removeAttribute('src');
        preview.hidden = true;
        dropHint.hidden = false;
        analyzeBtn.disabled = true;
        results.hidden = true;
        status.textContent = message;
        fileMeta.hidden = true;
        imageInput.value = '';
    }

    // 3. معالجة اختيار الصور
    function handleFile(file) {
        if (!file) return;
        if (!file.type.startsWith('image/') || file.size > maxFileSize) {
            resetView(file.size > maxFileSize ? 'حجم الصورة أكبر من 10 ميجابايت' : 'اختر ملف صورة صالحًا');
            return;
        }
        preview.src = URL.createObjectURL(file);
        preview.hidden = false;
        dropHint.hidden = true;
        fileName.textContent = file.name;
        fileSize.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
        fileMeta.hidden = false;
        analyzeBtn.disabled = false;
        results.hidden = true;
        status.textContent = '';
    }

    lightbox.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', () => handleFile(imageInput.files[0]));

    // 4. السحب والإفلات (Drag & Drop)
    ['dragenter', 'dragover'].forEach(eventName => {
        lightbox.addEventListener(eventName, (e) => {
            e.preventDefault();
            lightbox.classList.add('drag-over');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        lightbox.addEventListener(eventName, (e) => {
            e.preventDefault();
            lightbox.classList.remove('drag-over');
        });
    });

    lightbox.addEventListener('drop', (e) => {
        const file = e.dataTransfer.files[0];
        if (file) {
            imageInput.files = e.dataTransfer.files;
            handleFile(file);
        }
    });

    resetBtn.addEventListener('click', () => resetView());
    removeFile.addEventListener('click', () => resetView());

    // 5. النسخ والتنزيل
    copyBtn.addEventListener('click', async () => {
        await navigator.clipboard.writeText(document.getElementById('textResult').textContent);
        copyBtn.textContent = 'تم النسخ!';
        setTimeout(() => { copyBtn.textContent = 'نسخ'; }, 1500);
    });

    downloadBtn.addEventListener('click', () => {
        const content = `النص المستخرج:\n${document.getElementById('textResult').textContent}\n\nوصف الصورة:\n${document.getElementById('captionResult').textContent}`;
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'تحليل-الصورة.txt';
        link.click();
        URL.revokeObjectURL(link.href);
    });

    // 6. إرسال الطلب ومعالجة النتيجة
    analyzeBtn.addEventListener('click', async () => {
        const file = imageInput.files[0];
        if (!file) return;

        analyzeBtn.disabled = true;
        lightbox.classList.add('scanning');
        status.textContent = 'جاري الفحص...';
        results.hidden = true;

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch('/analyze', { method: 'POST', body: formData });
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'حدث خطأ أثناء الفحص');

            const textContent = Array.isArray(data.extracted_text)
                ? data.extracted_text.join('\n')
                : (data.extracted_text || 'لا يوجد نص مستخرج');

            textResult.textContent = textContent;
            captionResult.textContent = data.image_description || '—';
            applyTextDirection(textResult, textContent);
            applyTextDirection(captionResult, data.image_description || '—');
            results.hidden = false;
            status.textContent = 'تم الفحص بنجاح';

            results.scrollIntoView({ behavior: 'smooth' });
        } catch (err) {
            status.textContent = err.message || 'حدث خطأ، حاول مرة أخرى';
        } finally {
            lightbox.classList.remove('scanning');
            analyzeBtn.disabled = false;
        }
    });
});