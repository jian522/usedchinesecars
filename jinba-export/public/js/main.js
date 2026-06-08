// Mobile menu toggle
(function() {
    const btn = document.getElementById('mobileMenuBtn');
    const nav = document.getElementById('mainNav');
    if (btn && nav) {
        btn.addEventListener('click', () => nav.classList.toggle('open'));
        document.addEventListener('click', (e) => {
            if (!btn.contains(e.target) && !nav.contains(e.target)) nav.classList.remove('open');
        });
    }

    // Language dropdown toggle
    const langToggle = document.getElementById('langToggle');
    const langDropdown = document.getElementById('langDropdown');
    if (langToggle && langDropdown) {
        langToggle.addEventListener('click', () => langDropdown.classList.toggle('active'));
        document.addEventListener('click', (e) => {
            if (!langToggle.contains(e.target) && !langDropdown.contains(e.target)) langDropdown.classList.remove('active');
        });
    }

    // Page view tracking
    fetch('/api/pageview', { method: 'POST' }).catch(() => {});
})();
