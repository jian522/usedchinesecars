(function() {
    const track = document.getElementById('carouselTrack');
    const dots = document.getElementById('carouselDots');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');

    if (!track || !dots) return;

    const slides = track.querySelectorAll('.carousel-slide');
    const total = slides.length;
    if (total <= 1) return;

    let current = 0;
    let interval;

    // Create dots
    for (let i = 0; i < total; i++) {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', 'Slide ' + (i + 1));
        dot.addEventListener('click', () => goTo(i));
        dots.appendChild(dot);
    }

    const dotEls = dots.querySelectorAll('.carousel-dot');

    function goTo(index) {
        slides[current].classList.remove('active');
        dotEls[current].classList.remove('active');
        current = index;
        slides[current].classList.add('active');
        dotEls[current].classList.add('active');
    }

    function next() { goTo((current + 1) % total); }
    function prev() { goTo((current - 1 + total) % total); }

    function startAuto() { interval = setInterval(next, 5000); }
    function stopAuto() { clearInterval(interval); }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => { prev(); stopAuto(); startAuto(); });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => { next(); stopAuto(); startAuto(); });
    }

    startAuto();
})();
