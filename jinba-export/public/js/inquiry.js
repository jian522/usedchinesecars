(function() {
    const form = document.getElementById('carInquiryForm');
    const feedback = document.getElementById('inquiryFeedback');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        feedback.className = 'form-feedback';
        feedback.textContent = '';

        const data = Object.fromEntries(new FormData(form).entries());
        const lang = document.documentElement.lang || 'en';

        try {
            const res = await fetch('/api/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                feedback.className = 'form-feedback success';
                feedback.textContent = lang === 'zh' ? '询价已发送，我们会尽快回复您！'
                    : lang === 'ru' ? 'Запрос отправлен!'
                    : lang === 'ar' ? 'تم إرسال الاستفسار!'
                    : 'Inquiry sent! We will contact you soon.';
                form.reset();
            } else {
                const err = await res.json();
                feedback.className = 'form-feedback error';
                feedback.textContent = err.error || (lang === 'zh' ? '发送失败，请重试' : 'Failed to send. Please try again.');
            }
        } catch (err) {
            feedback.className = 'form-feedback error';
            feedback.textContent = 'Network error. Please try again.';
        }
    });
})();
