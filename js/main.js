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

  /* ================= Source Protection ================= */
  function initSourceProtection() {
    // Disable right-click context menu
    document.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      return false;
    });

    // Disable keyboard shortcuts for dev tools & view source
    document.addEventListener('keydown', function(e) {
      // F12
      if (e.key === 'F12') { e.preventDefault(); return false; }
      // Ctrl+Shift+I (Inspect)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') { e.preventDefault(); return false; }
      // Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === 'J') { e.preventDefault(); return false; }
      // Ctrl+Shift+C (Element picker)
      if (e.ctrlKey && e.shiftKey && e.key === 'C') { e.preventDefault(); return false; }
      // Ctrl+U (View Source)
      if (e.ctrlKey && e.key === 'u') { e.preventDefault(); return false; }
      if (e.ctrlKey && e.key === 'U') { e.preventDefault(); return false; }
      // Ctrl+S (Save page)
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); return false; }
      if (e.ctrlKey && e.key === 'S') { e.preventDefault(); return false; }
    });

    // Disable text selection via CSS (except inputs)
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.querySelectorAll('input, textarea').forEach(function(el) {
      el.style.userSelect = 'text';
      el.style.webkitUserSelect = 'text';
    });

    // Disable drag
    document.addEventListener('dragstart', function(e) { e.preventDefault(); });

    // Debugger trap — pauses execution when dev tools open
    (function antiDebug() {
      var threshold = 160;
      setInterval(function() {
        var before = performance.now();
        debugger;
        var after = performance.now();
        if (after - before > threshold) {
          document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:Poppins,sans-serif;background:#0f1923;color:#2ed1cd;font-size:1.2rem;text-align:center;padding:40px;"><div><h2 style="margin-bottom:16px;">Access Denied</h2><p style="color:#8ba8b5;">Developer tools are not permitted on this website.</p></div></div>';
        }
      }, 3000);
    })();

    // Disable copy (optional — keeps content protected)
    document.addEventListener('copy', function(e) {
      e.preventDefault();
      return false;
    });
  }

  /* ================= AI Chat Widget ================= */
  function initAIChat() {
    var fab = document.getElementById('aiChatFab');
    var win = document.getElementById('aiChatWindow');
    var body = document.getElementById('aiChatBody');
    var input = document.getElementById('aiChatInput');
    var send = document.getElementById('aiChatSend');
    var quickBtns = document.getElementById('aiQuickBtns');
    if (!fab || !win) return;

    var responses = {
      'services': 'We offer a full range of accounting services:\n\n• <strong>Bookkeeping & Reporting</strong> — cloud-based, monthly financials\n• <strong>Payroll Processing</strong> — CRA remittances, T4s, ROEs\n• <strong>Tax Strategy & Planning</strong> — year-round optimization\n• <strong>Corporate Tax (T2)</strong> — CCPC, SR&ED credits\n• <strong>Personal Tax (T1)</strong> — max refund guarantee\n• <strong>CRA Audit Defense</strong> — full representation\n• <strong>Business Advisory</strong> — fractional CFO\n• <strong>Wealth Management</strong> — RRSP, TFSA, estate\n\nWould you like details on any specific service?',
      'pricing': 'Our pricing is transparent with no hidden fees:\n\n• <strong>Personal Tax</strong> — from $49/return\n• <strong>Corporate Tax</strong> — from $499/return\n• <strong>Bookkeeping</strong> — from $199/month\n• <strong>Payroll</strong> — from $99/month\n\nBundle discounts available! Visit our <a href="pages/pricing.html" style="color:var(--teal-dk);font-weight:600;">Pricing page</a> for full details, or book a free consultation for a custom quote.',
      'audit': 'If you\'ve received a CRA notice, <strong>don\'t respond to CRA directly</strong> — contact us immediately.\n\nOur audit defense includes:\n• Full CRA communication management\n• Document assembly & strategy\n• Reassessment appeals\n• Voluntary Disclosure Program\n• Tax debt negotiation\n\n<strong>94% of our audits close with zero additional tax.</strong>\n\nCall us at <a href="tel:+18005559999" style="color:var(--teal-dk);font-weight:600;">1-800-555-9999</a> for immediate help.',
      'started': 'Getting started is easy:\n\n<strong>1.</strong> Book a <a href="pages/contact.html" style="color:var(--teal-dk);font-weight:600;">free 30-minute consultation</a>\n<strong>2.</strong> We assess your needs and recommend a plan\n<strong>3.</strong> Connect your accounts (we handle setup)\n<strong>4.</strong> You\'re up and running within 48 hours!\n\nNo commitment, no credit card required for the consultation.',
      'hours': 'We\'re available <strong>Monday to Friday, 8 AM – 7 PM MST</strong>.\n\nYou can reach us by:\n• Phone: <a href="tel:+18005559999" style="color:var(--teal-dk);font-weight:600;">1-800-555-9999</a>\n• Email: hello@keymetricsaccounting.ca\n• Or book online at our <a href="pages/contact.html" style="color:var(--teal-dk);font-weight:600;">Contact page</a>',
      'location': 'We\'re located at:\n\n<strong>4310 104 Ave NE\nCalgary, AB T3J 1W5</strong>\n\nBy appointment only. We also serve clients across Canada remotely.',
      'default': 'Thanks for your question! For the most accurate answer, I\'d recommend speaking with one of our CPAs directly.\n\nYou can:\n• <a href="pages/contact.html" style="color:var(--teal-dk);font-weight:600;">Book a free consultation</a>\n• Call <a href="tel:+18005559999" style="color:var(--teal-dk);font-weight:600;">1-800-555-9999</a>\n• Email hello@keymetricsaccounting.ca\n\nIs there anything else I can help with?'
    };

    function getTime() {
      return new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    }

    function addMsg(text, type) {
      var div = document.createElement('div');
      div.className = 'ai-msg ' + type;
      div.innerHTML = text.replace(/\n/g, '<br>') + '<div class="ai-msg-time">' + getTime() + '</div>';
      body.appendChild(div);
      body.scrollTop = body.scrollHeight;
    }

    function showTyping() {
      var div = document.createElement('div');
      div.className = 'ai-typing';
      div.id = 'aiTyping';
      div.innerHTML = '<span></span><span></span><span></span>';
      body.appendChild(div);
      body.scrollTop = body.scrollHeight;
    }

    function removeTyping() {
      var t = document.getElementById('aiTyping');
      if (t) t.remove();
    }

    function matchResponse(text) {
      var q = text.toLowerCase();

      // Greetings
      if (q.match(/^(hello|hi|hey|good morning|good afternoon|good evening|howdy)/)) return 'Hello! Welcome to Key Metrics Accounting. I can help you with questions about our bookkeeping, payroll, tax, and accounting services. What would you like to know?';
      if (q.match(/^(thank|thanks|thx|ty)/)) return 'You\'re welcome! If you have more questions about our services, feel free to ask anytime.';

      // Services
      if (q.match(/service|offer|what do you|help with|what can you/)) return responses.services;
      if (q.match(/bookkeep|book keep|monthly report|financial statement|reconcil/)) return 'Our <strong>Bookkeeping & Reporting</strong> service includes:\n\n• Daily transaction categorization\n• Monthly P&L, balance sheet, cash flow\n• Bank & credit card reconciliation\n• QuickBooks Online / Xero\n• HST/GST tracking\n\nStarting at <strong>$199/month</strong>. Books delivered within 48 hours of month-end.\n\nVisit our <a href="pages/services/bookkeeping.html" style="color:var(--teal-dk);font-weight:600;">Bookkeeping page</a> for details.';
      if (q.match(/payroll|t4|employee|salary|remittance|roe|direct deposit/)) return 'Our <strong>Payroll Service</strong> handles everything:\n\n• Direct deposit & pay stubs\n• CRA remittances (CPP, EI, income tax)\n• T4/T4A slip preparation\n• ROE filing\n• Multi-province compliance\n\nStarting at <strong>$99/month</strong> for 1-5 employees.\n\nVisit our <a href="pages/services/payroll.html" style="color:var(--teal-dk);font-weight:600;">Payroll page</a> for details.';
      if (q.match(/corporate tax|t2|ccpc|small business deduction|sred|sr&ed/)) return 'Our <strong>Corporate Tax (T2)</strong> service includes:\n\n• T2 return preparation & CCPC optimization\n• Small business deduction (15% rate)\n• SR&ED credit claims\n• CCA scheduling\n• Associated corporation analysis\n\nStarting at <strong>$499/return</strong>.\n\nVisit our <a href="pages/services/corporate-tax.html" style="color:var(--teal-dk);font-weight:600;">Corporate Tax page</a> for details.';
      if (q.match(/personal tax|t1|refund|rrsp|tfsa|deduct|self.employ/)) return 'Our <strong>Personal Tax (T1)</strong> service includes:\n\n• Full T1 preparation & NETFILE\n• RRSP/TFSA optimization\n• Rental income, investments, self-employment\n• Home office & vehicle deductions\n• Average <strong>$4,200 extra refund</strong>\n\nStarting at <strong>$49/return</strong>.\n\nVisit our <a href="pages/services/personal-tax.html" style="color:var(--teal-dk);font-weight:600;">Personal Tax page</a> for details.';
      if (q.match(/tax strateg|tax plan|save.*tax|minimize.*tax|tax optim/)) return 'Our <strong>Tax Strategy & Planning</strong> service provides year-round proactive optimization:\n\n• Income splitting strategies\n• RRSP/TFSA contribution timing\n• Corporate structure optimization\n• Capital gains planning\n• Multi-provincial compliance\n\nClients save an average of <strong>$40,000+ in year one</strong>.\n\nVisit our <a href="pages/services/tax-strategy.html" style="color:var(--teal-dk);font-weight:600;">Tax Strategy page</a>.';
      if (q.match(/audit|cra|notice|reassess|penalty|garnish|collection|appeal|voluntary disclosure|vdp/)) return responses.audit;
      if (q.match(/advisory|cfo|consult|business growth|valuation|exit plan|restructur/)) return 'Our <strong>Business Advisory</strong> service includes:\n\n• Fractional CFO & Controller services\n• Financial modeling & forecasting\n• Business valuation\n• Cash flow optimization\n• Corporate structure & exit planning\n\nClients see <strong>3.2x average revenue growth</strong> within 36 months.\n\nVisit our <a href="pages/services/business-advisory.html" style="color:var(--teal-dk);font-weight:600;">Business Advisory page</a>.';
      if (q.match(/wealth|estate|succession|investment|retirement|inherit/)) return 'Our <strong>Wealth Management</strong> service covers:\n\n• RRSP/TFSA/RESP optimization\n• Investment portfolio review\n• Retirement planning\n• Estate freeze & succession\n• Family trust structures\n\nOver <strong>$180M+ in client wealth</strong> under active advisory.\n\nVisit our <a href="pages/services/wealth-management.html" style="color:var(--teal-dk);font-weight:600;">Wealth Management page</a>.';

      // Pricing
      if (q.match(/pric|cost|how much|fee|rate|charge|quote|afford/)) return responses.pricing;

      // Getting started / contact
      if (q.match(/start|begin|sign up|onboard|get going|how do i|consult/)) return responses.started;
      if (q.match(/contact|call|phone|email|reach|talk|speak|book|appointment|meeting/)) return responses.hours;
      if (q.match(/address|location|where|office|visit|calgary|alberta/)) return responses.location;

      // Automation
      if (q.match(/automat|connect.*account|cloud|software|quickbooks|xero|integrate/)) return 'Our <strong>Automation Platform</strong> connects directly to your bank accounts, credit cards, and business tools to auto-categorize every transaction.\n\n• QuickBooks Online & Xero integration\n• 99.8% categorization accuracy\n• Real-time financial dashboard\n• 48-hour monthly report delivery\n\nVisit our <a href="pages/automation.html" style="color:var(--teal-dk);font-weight:600;">Automation page</a> to learn more.';

      // Small business
      if (q.match(/small business|startup|new business|incorporat|gst.*register|sole proprietor/)) return 'We specialize in <strong>small business accounting</strong> in Calgary:\n\n• Bookkeeping from $199/mo\n• GST/HST registration & filing\n• Incorporation advice\n• Payroll setup\n• Tax planning from day one\n\nOver <strong>500+ small businesses</strong> served across Alberta.\n\nVisit our <a href="pages/small-business.html" style="color:var(--teal-dk);font-weight:600;">Small Business page</a>.';

      // Blog
      if (q.match(/blog|article|read|learn|resource|insight|tip/)) return 'Check out our <strong>Blog & Insights</strong> for expert accounting tips, tax strategies, and financial guides for Canadian businesses.\n\nVisit our <a href="pages/blog.html" style="color:var(--teal-dk);font-weight:600;">Blog page</a> to browse all articles.';

      // About the company
      if (q.match(/about|who are|company|team|experience|year|history/)) return '<strong>Key Metrics Accounting</strong> has been serving Canadian businesses and individuals for over 18 years.\n\n• Based in Calgary, AB\n• 500+ businesses served\n• $2.4M+ in tax savings delivered\n• 94% CRA audit success rate\n• QuickBooks & Xero certified\n\nWe serve clients across all of Canada remotely.';

      // Off-topic — politely decline
      return 'I appreciate your question, but I can only help with topics related to <strong>Key Metrics Accounting</strong> services — bookkeeping, payroll, tax filing, CRA audits, and financial planning.\n\nHere are some things I can help with:\n• Our services & pricing\n• Getting started\n• CRA audit help\n• Contact information\n\nWould you like to know about any of these?';
    }

    // Text-to-Speech — bot reads response aloud
    function speakText(html) {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      var plain = html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\n/g, ' ').replace(/•/g, ', ');
      var utter = new SpeechSynthesisUtterance(plain);
      utter.lang = 'en-CA';
      utter.rate = 1;
      utter.pitch = 1;
      // Try to find a nice voice
      var voices = window.speechSynthesis.getVoices();
      var preferred = voices.find(function(v) { return v.lang.startsWith('en') && v.name.match(/female|samantha|google.*us|zira|jenny/i); });
      if (preferred) utter.voice = preferred;
      else if (voices.length) {
        var enVoice = voices.find(function(v) { return v.lang.startsWith('en'); });
        if (enVoice) utter.voice = enVoice;
      }
      window.speechSynthesis.speak(utter);
    }

    // Speech-to-Text — user speaks into mic
    var recognition = null;
    var isListening = false;
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-CA';

      recognition.onresult = function(event) {
        var transcript = event.results[0][0].transcript;
        input.value = transcript;
        sendMessage(transcript);
        input.value = '';
      };
      recognition.onend = function() {
        isListening = false;
        var micBtn = document.getElementById('aiMicBtn');
        if (micBtn) { micBtn.classList.remove('listening'); micBtn.title = 'Click to speak'; }
      };
      recognition.onerror = function() {
        isListening = false;
        var micBtn = document.getElementById('aiMicBtn');
        if (micBtn) micBtn.classList.remove('listening');
      };
    }

    // Add mic button to input area
    var inputArea = document.querySelector('.ai-chat-input');
    if (inputArea && recognition) {
      var micBtn = document.createElement('button');
      micBtn.id = 'aiMicBtn';
      micBtn.className = 'ai-mic-btn';
      micBtn.setAttribute('aria-label', 'Voice input');
      micBtn.title = 'Click to speak';
      micBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>';
      inputArea.insertBefore(micBtn, send);

      micBtn.addEventListener('click', function() {
        if (isListening) {
          recognition.stop();
          isListening = false;
          micBtn.classList.remove('listening');
        } else {
          recognition.start();
          isListening = true;
          micBtn.classList.add('listening');
          micBtn.title = 'Listening...';
        }
      });
    }

    // Add speaker toggle button to header
    var chatHeader = document.querySelector('.ai-chat-header');
    var voiceEnabled = true;
    if (chatHeader) {
      var speakerBtn = document.createElement('button');
      speakerBtn.id = 'aiSpeakerBtn';
      speakerBtn.className = 'ai-speaker-btn';
      speakerBtn.setAttribute('aria-label', 'Toggle voice');
      speakerBtn.title = 'Voice on';
      speakerBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>';
      chatHeader.insertBefore(speakerBtn, chatHeader.querySelector('.ai-chat-status'));

      speakerBtn.addEventListener('click', function() {
        voiceEnabled = !voiceEnabled;
        if (!voiceEnabled) {
          window.speechSynthesis.cancel();
          speakerBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';
          speakerBtn.title = 'Voice off';
        } else {
          speakerBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>';
          speakerBtn.title = 'Voice on';
        }
      });
    }

    function sendMessage(text) {
      if (!text.trim()) return;
      addMsg(text, 'user');
      if (quickBtns) quickBtns.style.display = 'none';
      showTyping();
      var delay = 800 + Math.random() * 1200;
      setTimeout(function() {
        removeTyping();
        var response = matchResponse(text);
        addMsg(response, 'bot');
        if (voiceEnabled) speakText(response);
      }, delay);
    }

    fab.addEventListener('click', function() {
      fab.classList.toggle('active');
      win.classList.toggle('open');
    });

    send.addEventListener('click', function() {
      sendMessage(input.value);
      input.value = '';
    });

    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        sendMessage(input.value);
        input.value = '';
      }
    });

    if (quickBtns) {
      quickBtns.querySelectorAll('.ai-quick-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          sendMessage(btn.getAttribute('data-q'));
        });
      });
    }
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
    initAIChat();
    initSourceProtection();
  });

})();
