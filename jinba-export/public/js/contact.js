(function() {
    const form = document.getElementById('contactForm');
    const feedback = document.getElementById('formFeedback');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form).entries());
        feedback.className = 'form-feedback';
        feedback.textContent = '';

        try {
            const res = await fetch('/api/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                feedback.className = 'form-feedback success';
                feedback.textContent = form.dataset.successMsg || 'Message sent successfully! We will contact you soon.';
                form.reset();
            } else {
                const err = await res.json();
                feedback.className = 'form-feedback error';
                feedback.textContent = err.error || 'Failed to send message. Please try again.';
            }
        } catch (err) {
            feedback.className = 'form-feedback error';
            feedback.textContent = 'Network error. Please try again.';
        }
    });
})();
