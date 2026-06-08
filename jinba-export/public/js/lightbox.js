/* ============================================
   Image Lightbox — Car Detail Page
   ============================================ */

(function () {
    'use strict';

    var overlay = null;
    var lightboxImg = null;
    var counterEl = null;
    var images = [];
    var currentIndex = 0;

    // --- DOM helpers ---

    function createElement(tag, attrs) {
        var el = document.createElement(tag);
        if (attrs) {
            Object.keys(attrs).forEach(function (k) {
                if (k === 'className') {
                    el.className = attrs[k];
                } else if (k === 'html') {
                    el.innerHTML = attrs[k];
                } else if (k === 'text') {
                    el.textContent = attrs[k];
                } else {
                    el.setAttribute(k, attrs[k]);
                }
            });
        }
        return el;
    }

    function buildOverlay() {
        if (overlay) return;

        overlay = createElement('div', { className: 'lightbox-overlay' });

        // Close button
        var closeBtn = createElement('button', {
            className: 'lightbox-close',
            html: '&times;',
            'aria-label': 'Close'
        });
        closeBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            closeLightbox();
        });

        // Prev button
        var prevBtn = createElement('button', {
            className: 'lightbox-nav lightbox-prev',
            'aria-label': 'Previous image'
        });
        prevBtn.innerHTML =
            '<svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>';
        prevBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            navigate(-1);
        });

        // Next button
        var nextBtn = createElement('button', {
            className: 'lightbox-nav lightbox-next',
            'aria-label': 'Next image'
        });
        nextBtn.innerHTML =
            '<svg viewBox="0 0 24 24"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>';
        nextBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            navigate(1);
        });

        // Image wrapper
        var wrapper = createElement('div', { className: 'lightbox-image-wrapper' });
        lightboxImg = createElement('img', { alt: '' });
        wrapper.appendChild(lightboxImg);

        // Counter
        counterEl = createElement('div', { className: 'lightbox-counter' });

        // Assemble
        overlay.appendChild(closeBtn);
        overlay.appendChild(prevBtn);
        overlay.appendChild(nextBtn);
        overlay.appendChild(wrapper);
        overlay.appendChild(counterEl);

        // Close on backdrop click
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) {
                closeLightbox();
            }
        });

        document.body.appendChild(overlay);
    }

    // --- Core ---

    function openLightbox(index) {
        if (!images.length) return;

        buildOverlay();

        currentIndex = Math.max(0, Math.min(index, images.length - 1));
        updateImage();

        // Toggle single-image class for hiding nav / counter
        overlay.classList.toggle('single-image', images.length <= 1);

        // Show
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        if (!overlay) return;
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    function navigate(direction) {
        if (images.length <= 1) return;
        currentIndex = (currentIndex + direction + images.length) % images.length;
        updateImage();
    }

    function updateImage() {
        if (!lightboxImg || !images[currentIndex]) return;
        lightboxImg.src = images[currentIndex].url;
        lightboxImg.alt = images[currentIndex].alt || '';
        counterEl.textContent = (currentIndex + 1) + ' / ' + images.length;
    }

    // --- Keyboard ---

    function onKeyDown(e) {
        if (!overlay || !overlay.classList.contains('active')) return;

        switch (e.key) {
            case 'Escape':
                closeLightbox();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                navigate(-1);
                break;
            case 'ArrowRight':
                e.preventDefault();
                navigate(1);
                break;
        }
    }

    // --- Init ---

    function init(galleryEl) {
        if (!galleryEl) return;

        // Parse images from data attribute
        try {
            var raw = galleryEl.getAttribute('data-images');
            images = raw ? JSON.parse(raw) : [];
        } catch (_) {
            images = [];
        }

        if (!images.length) return;

        // Wire up main image
        var mainImg = galleryEl.querySelector('.gallery-main img');
        var primaryIdx = images.findIndex(function (im) { return im.is_primary; });
        var startIdx = primaryIdx >= 0 ? primaryIdx : 0;

        if (mainImg) {
            mainImg.addEventListener('click', function () {
                openLightbox(startIdx);
            });
            mainImg.style.cursor = 'pointer';
        }

        // Wire up thumbnails
        var thumbs = galleryEl.querySelectorAll('.gallery-thumb');
        thumbs.forEach(function (thumb, i) {
            thumb.addEventListener('click', function () {
                openLightbox(i);
            });
            thumb.style.cursor = 'pointer';
        });

        // Keyboard listener
        document.addEventListener('keydown', onKeyDown);
    }

    // Auto-init when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            var el = document.querySelector('.car-gallery');
            if (el) init(el);
        });
    } else {
        var el = document.querySelector('.car-gallery');
        if (el) init(el);
    }

    // Expose for debugging and inline use
    window.openLightbox = openLightbox;
    window.closeLightbox = closeLightbox;
})();
