/* ---- Nav scroll state ---- */
    const nav = document.getElementById('mainNav');
    const onScroll = () => nav.classList.toggle('nav--scrolled', window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ---- Mobile menu ---- */
    const mobileMenu = document.getElementById('mobileMenu');
    const menuOpen   = document.getElementById('menuOpen');
    const menuClose  = document.getElementById('menuClose');
    const openMenu   = () => { mobileMenu.classList.add('is-open'); menuOpen.setAttribute('aria-expanded','true'); document.body.style.overflow='hidden'; };
    const closeMenu  = () => { mobileMenu.classList.remove('is-open'); menuOpen.setAttribute('aria-expanded','false'); document.body.style.overflow=''; };
    menuOpen.addEventListener('click', openMenu);
    menuClose.addEventListener('click', closeMenu);
    mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

    /* ---- Hero parallax ---- */
    const heroBg    = document.getElementById('heroBg');
    const heroEl    = heroBg.parentElement;
    let   rafPending = false;
    function applyParallax() {
        const sy = window.scrollY;
        if (sy < heroEl.offsetHeight + 200)
            heroBg.style.transform = `translateY(${sy * 0.32}px)`;
        rafPending = false;
    }
    window.addEventListener('scroll', () => {
        if (!rafPending) { rafPending = true; requestAnimationFrame(applyParallax); }
    }, { passive: true });

    /* ---- IntersectionObserver reveals ---- */
    const io = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));

    /* ---- Carousel ---- */
    const track = document.getElementById('carouselTrack');
    const dots  = document.getElementById('carouselDots');
    const cards = [...track.querySelectorAll('.service-card')];
    let   active = 0;

    /* Build dots */
    cards.forEach((_, i) => {
        const d = document.createElement('button');
        d.className = 'carousel-dot' + (i === 0 ? ' is-active' : '');
        d.setAttribute('role', 'tab');
        d.setAttribute('aria-label', `Ir al tratamiento ${i+1}`);
        d.setAttribute('aria-selected', i === 0);
        d.addEventListener('click', () => goTo(i));
        dots.appendChild(d);
    });

    function goTo(i) {
        const pad = parseFloat(getComputedStyle(track).paddingLeft) || 0;
        track.scrollTo({ left: cards[i].offsetLeft - pad, behavior: 'smooth' });
    }

    function syncDots() {
        const pad = parseFloat(getComputedStyle(track).paddingLeft) || 0;
        let nearest = 0, minD = Infinity;
        cards.forEach((c, i) => {
            const d = Math.abs(c.offsetLeft - pad - track.scrollLeft);
            if (d < minD) { minD = d; nearest = i; }
        });
        if (nearest !== active) {
        dots.children[active].classList.remove('is-active');
        dots.children[active].setAttribute('aria-selected', 'false');
        dots.children[nearest].classList.add('is-active');
        dots.children[nearest].setAttribute('aria-selected', 'true');
        active = nearest;
        }
        document.getElementById('carouselPrev').disabled = active === 0;
        document.getElementById('carouselNext').disabled = active === cards.length - 1;
    }

    track.addEventListener('scroll', syncDots, { passive: true });
    document.getElementById('carouselPrev').addEventListener('click', () => goTo(Math.max(0, active - 1)));
    document.getElementById('carouselNext').addEventListener('click', () => goTo(Math.min(cards.length - 1, active + 1)));
    syncDots();

    /* Desktop drag-to-scroll */
    let drag = false, startX, startSL;
    track.addEventListener('mousedown', e => {
        drag = true; startX = e.pageX - track.offsetLeft; startSL = track.scrollLeft;
        track.classList.add('is-dragging'); e.preventDefault();
    });
    document.addEventListener('mousemove', e => {
        if (!drag) return;
        track.scrollLeft = startSL - (e.pageX - track.offsetLeft - startX) * 1.4;
    });
    document.addEventListener('mouseup', () => { if (!drag) return; drag = false; track.classList.remove('is-dragging'); syncDots(); });

    /* ---- Booking form with advanced validation ---- */
    const form    = document.getElementById('bookingForm');
    const success = document.getElementById('formSuccess');
    const dateInp = document.getElementById('date');
    const btn     = form.querySelector('.form-submit');
    
    dateInp.min = new Date().toISOString().split('T')[0];
    
    // Validation patterns
    const patterns = {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        phone: /^(\+\d{1,3}[- ]?)?\d{3,}[- ]?\d{3,}[- ]?\d{3,}$/
    };
    
    // Form validation function
    function validateForm() {
        let isValid = true;
        const errors = [];
        
        // Check required fields
        form.querySelectorAll('[required]').forEach(field => {
            const value = field.value.trim();
            const isOk = !!value;
            
            field.style.borderColor = isOk ? '' : 'var(--terracotta)';
            field.setAttribute('aria-invalid', isOk ? 'false' : 'true');
            
            if (!isOk) {
                isValid = false;
                errors.push(`${field.name}`);
            } else {
                // Additional validation for specific fields
                if (field.type === 'email' && !patterns.email.test(value)) {
                    field.style.borderColor = 'var(--terracotta)';
                    field.setAttribute('aria-invalid', 'true');
                    isValid = false;
                    errors.push('Email inválido');
                }
            }
        });
        
        // Optional phone validation if provided
        const phoneField = form.querySelector('[name="phone"]');
        if (phoneField && phoneField.value.trim() && !patterns.phone.test(phoneField.value)) {
            phoneField.style.borderColor = 'var(--terracotta)';
            phoneField.setAttribute('aria-invalid', 'true');
            isValid = false;
            errors.push('Teléfono inválido');
        }
        
        if (!isValid && errors.length > 0) {
            form.querySelector('[aria-invalid="true"]')?.focus();
        }
        
        return isValid;
    }
    
    // Real-time validation
    form.querySelectorAll('input, select, textarea').forEach(field => {
        field.addEventListener('input', () => {
            if (field.value.trim()) {
                field.style.borderColor = '';
                field.removeAttribute('aria-invalid');
            }
        });
        
        field.addEventListener('blur', () => {
            if (field.value.trim() && field.type === 'email') {
                const isValid = patterns.email.test(field.value);
                field.style.borderColor = isValid ? '' : 'var(--terracotta)';
                field.setAttribute('aria-invalid', isValid ? 'false' : 'true');
            }
        });
    });
    
    // Form submission
    let isSubmitting = false;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (isSubmitting) return;
        if (!validateForm()) return;
        
        isSubmitting = true;
        btn.textContent = 'Enviando…';
        btn.disabled = true;
        
        try {
            // Collect form data
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            
            // Log data for verification (in production, send to your backend)
            console.log('Booking data received:', data);
            
            // Simulate server processing
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Success state
            form.style.display = 'none';
            success.classList.add('is-visible');
            success.focus();
            
        } catch (error) {
            console.error('Submission error:', error);
            btn.textContent = 'Solicitar mi reserva';
            btn.disabled = false;
            isSubmitting = false;
            alert('Ocurrió un error. Por favor, intenta nuevamente.');
        }
    });