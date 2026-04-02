/* ================================================================
   VERTEX ACCOUNTING — Main JavaScript
   Particle Canvas · 3D Card Tilt · Counters · Slider · All FX
   ================================================================ */

(function () {
  'use strict';

  /* ================= DOM Ready ================= */
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  /* ================= Sticky Navbar ================= */
  function initNavbar() {
    const nav = document.querySelector('.navbar');
    if (!nav) return;
    function onScroll() { nav.classList.toggle('scrolled', window.scrollY > 40); }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ================= Hamburger Menu ================= */
  function initHamburger() {
    const btn = document.getElementById('hamburger');
    const menu = document.getElementById('mobile-nav');
    if (!btn || !menu) return;

    btn.addEventListener('click', () => {
      const open = btn.classList.toggle('open');
      menu.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
      btn.setAttribute('aria-expanded', String(open));
    });

    menu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        btn.classList.remove('open');
        menu.classList.remove('open');
        document.body.style.overflow = '';
        btn.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('click', e => {
      if (!btn.contains(e.target) && !menu.contains(e.target)) {
        btn.classList.remove('open');
        menu.classList.remove('open');
        document.body.style.overflow = '';
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ================= Smooth Scroll ================= */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const href = a.getAttribute('href');
        if (href === '#') return;
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 76;
        window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
      });
    });
  }

  /* ================= Scroll Reveal ================= */
  function initScrollReveal() {
    const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    if (!els.length) return;

    if (!('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('visible'));
      return;
    }

    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    els.forEach(el => obs.observe(el));
  }

  /* ================= Animated Number Counter ================= */
  function animateCounter(el) {
    const target = parseInt(el.dataset.count, 10);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const duration = 2200;
    const startTime = performance.now();

    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = prefix + Math.round(target * eased) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = prefix + target + suffix;
    }
    requestAnimationFrame(tick);
  }

  function initCounters() {
    const counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    if (!('IntersectionObserver' in window)) {
      counters.forEach(el => {
        el.textContent = (el.dataset.prefix || '') + el.dataset.count + (el.dataset.suffix || '');
      });
      return;
    }

    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(el => obs.observe(el));
  }

  /* ================= Testimonial Slider ================= */
  function initTestimonialSlider() {
    const track = document.getElementById('testimonialTrack');
    const dots  = document.querySelectorAll('.t-dot');
    const prev  = document.querySelector('.t-prev');
    const next  = document.querySelector('.t-next');
    if (!track) return;

    const total = track.children.length;
    let current = 0;
    let timer   = null;

    function goTo(idx) {
      current = (idx + total) % total;
      track.style.transform = `translateX(-${current * 100}%)`;
      dots.forEach((d, i) => {
        d.classList.toggle('active', i === current);
        d.setAttribute('aria-current', String(i === current));
      });
    }

    function startAuto() { timer = setInterval(() => goTo(current + 1), 5500); }
    function stopAuto()  { clearInterval(timer); }

    if (prev) prev.addEventListener('click', () => { stopAuto(); goTo(current - 1); startAuto(); });
    if (next) next.addEventListener('click', () => { stopAuto(); goTo(current + 1); startAuto(); });
    dots.forEach((d, i) => d.addEventListener('click', () => { stopAuto(); goTo(i); startAuto(); }));

    // Touch swipe
    let touchX = 0;
    track.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 42) { stopAuto(); goTo(dx < 0 ? current + 1 : current - 1); startAuto(); }
    });

    goTo(0);
    startAuto();

    const wrapper = track.closest('.testimonial-slider');
    if (wrapper) {
      wrapper.addEventListener('mouseenter', stopAuto);
      wrapper.addEventListener('mouseleave', startAuto);
    }
  }

  /* ================= Hero Canvas Particles ================= */
  function initParticles() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;

    // Skip on low-power devices (reduce motion preference)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      canvas.style.display = 'none';
      return;
    }

    const ctx = canvas.getContext('2d');
    const COUNT   = window.innerWidth < 768 ? 35 : 65;
    const MAX_DIST = 130;
    const MOUSE   = { x: null, y: null };
    let W, H, particles = [], animId;

    function resize() {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }

    function createParticles() {
      particles = [];
      for (let i = 0; i < COUNT; i++) {
        particles.push({
          x:     Math.random() * W,
          y:     Math.random() * H,
          vx:    (Math.random() - 0.5) * 0.45,
          vy:    (Math.random() - 0.5) * 0.45,
          r:     Math.random() * 1.8 + 0.8,
          alpha: Math.random() * 0.45 + 0.2
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // Connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(59,130,246,${(1 - dist / MAX_DIST) * 0.14})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      // Particles
      particles.forEach(p => {
        // Mouse repulsion
        if (MOUSE.x !== null) {
          const dx = p.x - MOUSE.x;
          const dy = p.y - MOUSE.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            p.vx += (dx / dist) * 0.05;
            p.vy += (dy / dist) * 0.05;
          }
        }

        p.vx *= 0.99;
        p.vy *= 0.99;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        p.x = Math.max(0, Math.min(W, p.x));
        p.y = Math.max(0, Math.min(H, p.y));

        // Glow circle
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
        grd.addColorStop(0, `rgba(59,130,246,${p.alpha})`);
        grd.addColorStop(1, 'rgba(59,130,246,0)');
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(147,197,253,${p.alpha})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    }

    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      MOUSE.x = e.clientX - rect.left;
      MOUSE.y = e.clientY - rect.top;
    });
    canvas.addEventListener('mouseleave', () => { MOUSE.x = null; MOUSE.y = null; });

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        cancelAnimationFrame(animId);
        resize();
        createParticles();
        draw();
      }, 200);
    });

    resize();
    createParticles();
    draw();

    // Pause when tab hidden for performance
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(animId);
      else draw();
    });
  }

  /* ================= 3D Card Tilt (Mouse) ================= */
  function initCardTilt() {
    // Skip on touch/mobile devices
    if (window.matchMedia('(hover: none)').matches) return;

    document.querySelectorAll('[data-tilt]').forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.transition = 'none';
      });

      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width  - 0.5;
        const y = (e.clientY - rect.top)  / rect.height - 0.5;
        const rotX = y * -16;
        const rotY = x *  16;
        card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(12px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transition = 'transform 0.55s cubic-bezier(0.23,1,0.32,1)';
        card.style.transform  = '';
      });
    });
  }

  /* ================= Flip Card Touch Support ================= */
  function initFlipCards() {
    // On touch devices, tap to flip since hover doesn't work
    if (!window.matchMedia('(hover: none)').matches) return;

    document.querySelectorAll('.flip-card').forEach(card => {
      card.addEventListener('click', () => {
        card.classList.toggle('flipped');
      });
    });
  }

  /* ================= Cursor Glow (Desktop) ================= */
  function initCursorGlow() {
    const cursor = document.getElementById('cursorGlow');
    if (!cursor) return;
    if (window.matchMedia('(hover: none)').matches) {
      cursor.style.display = 'none';
      return;
    }

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let cx = mx, cy = my;

    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

    (function animate() {
      cx += (mx - cx) * 0.065;
      cy += (my - cy) * 0.065;
      cursor.style.left = cx + 'px';
      cursor.style.top  = cy + 'px';
      requestAnimationFrame(animate);
    })();
  }

  /* ================= Active Nav Link on Scroll ================= */
  function initActiveNav() {
    const sections  = document.querySelectorAll('section[id]');
    const navLinks  = document.querySelectorAll('.nav-link');
    if (!sections.length) return;

    function update() {
      const offset = 120;
      let active = '';
      sections.forEach(sec => {
        if (window.scrollY >= sec.offsetTop - offset) active = sec.id;
      });
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href').includes(active));
      });
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ================= Back to Top Button ================= */
  function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;

    window.addEventListener('scroll', () => {
      btn.classList.toggle('visible', window.scrollY > 450);
    }, { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ================= Contact Form ================= */
  function initContactForm() {
    const form = document.querySelector('.contact-form');
    if (!form) return;

    form.addEventListener('submit', e => {
      e.preventDefault();
      const btn = form.querySelector('[type="submit"]');
      if (!btn) return;
      const orig = btn.innerHTML;
      btn.innerHTML  = '⏳ Sending…';
      btn.disabled   = true;

      setTimeout(() => {
        btn.innerHTML = '✅ Message Sent!';
        btn.style.background = '#10b981';
        form.reset();
        setTimeout(() => {
          btn.innerHTML         = orig;
          btn.disabled          = false;
          btn.style.background  = '';
        }, 3800);
      }, 1800);
    });
  }

  /* ================= FAQ Accordion ================= */
  function initFAQ() {
    const items = document.querySelectorAll('.faq-item');
    if (!items.length) return;

    items.forEach(item => {
      const question = item.querySelector('.faq-question');
      if (!question) return;
      question.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');

        // Close all items
        items.forEach(i => {
          i.classList.remove('open');
          const btn = i.querySelector('.faq-question');
          const ans = i.querySelector('.faq-answer');
          if (btn) btn.setAttribute('aria-expanded', 'false');
          if (ans) ans.setAttribute('hidden', '');
        });

        // Open clicked item if it was closed
        if (!isOpen) {
          item.classList.add('open');
          question.setAttribute('aria-expanded', 'true');
          const answer = item.querySelector('.faq-answer');
          if (answer) answer.removeAttribute('hidden');
        }
      });
    });
  }

  /* ================= Blog Filter ================= */
  function initBlogFilter() {
    const filters = document.querySelectorAll('.blog-filter');
    const cards = document.querySelectorAll('.blog-card');
    if (!filters.length || !cards.length) return;

    filters.forEach(btn => {
      btn.addEventListener('click', () => {
        filters.forEach(f => f.classList.remove('active'));
        btn.classList.add('active');

        const category = btn.textContent.trim().toLowerCase();

        cards.forEach(card => {
          if (category === 'all') {
            card.style.display = '';
            return;
          }
          const tags = card.querySelectorAll('.blog-tag');
          const match = Array.from(tags).some(tag =>
            tag.textContent.trim().toLowerCase() === category
          );
          card.style.display = match ? '' : 'none';
        });
      });
    });
  }

  /* ================= Theme Switcher ================= */
  function initThemeSwitcher() {
    var toggle = document.querySelector('.theme-toggle');
    var btn = document.querySelector('.theme-toggle-btn');
    var opts = document.querySelectorAll('.theme-dd-opt');
    if (!toggle || !btn) return;

    // Load saved theme
    var saved = localStorage.getItem('kma-theme') || 'light';
    if (saved !== 'light') {
      document.documentElement.setAttribute('data-theme', saved);
      opts.forEach(function(o) {
        o.classList.toggle('active', o.getAttribute('data-mode') === saved);
      });
    }

    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      toggle.classList.toggle('open');
      // Close language dropdown if open
      var lang = document.querySelector('.custom-lang');
      if (lang) lang.classList.remove('open');
    });

    document.addEventListener('click', function() { toggle.classList.remove('open'); });

    opts.forEach(function(opt) {
      opt.addEventListener('click', function(e) {
        e.stopPropagation();
        var theme = opt.getAttribute('data-mode');
        if (theme === 'light') {
          document.documentElement.removeAttribute('data-theme');
        } else {
          document.documentElement.setAttribute('data-theme', theme);
        }
        localStorage.setItem('kma-theme', theme);
        opts.forEach(function(o) {
          o.classList.toggle('active', o.getAttribute('data-mode') === theme);
        });
        toggle.classList.remove('open');
      });
    });
  }

  /* ================= Initialize Everything ================= */
  ready(() => {
    initNavbar();
    initHamburger();
    initSmoothScroll();
    initScrollReveal();
    initCounters();
    initTestimonialSlider();
    initParticles();
    initCardTilt();
    initCursorGlow();
    initActiveNav();
    initBackToTop();
    initContactForm();
    initFAQ();
    initFlipCards();
    initBlogFilter();
    initThemeSwitcher();
  });

})();
