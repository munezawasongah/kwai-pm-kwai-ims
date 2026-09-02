document.addEventListener('DOMContentLoaded', () => {
  const header = document.getElementById('siteHeader');
  const burger = document.querySelector('.burger');
  const mobileMenu = document.querySelector('.mobile-menu');

  window.addEventListener('scroll', () => {
    if (header && !header.classList.contains('solid')) {
      header.classList.toggle('scrolled', window.scrollY > 40);
    }
  });

  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
      burger.textContent = mobileMenu.classList.contains('open') ? '✕' : '☰';
    });
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        burger.textContent = '☰';
      });
    });
  }

  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  revealEls.forEach(el => io.observe(el));

  const gallery = document.querySelector('.gallery-scroll');
  const prevBtn = document.querySelector('[data-gallery-prev]');
  const nextBtn = document.querySelector('[data-gallery-next]');
  if (gallery && prevBtn && nextBtn) {
    const scrollAmt = () => gallery.querySelector('.gallery-item')?.offsetWidth + 22 || 300;
    prevBtn.addEventListener('click', () => gallery.scrollBy({ left: -scrollAmt(), behavior: 'smooth' }));
    nextBtn.addEventListener('click', () => gallery.scrollBy({ left: scrollAmt(), behavior: 'smooth' }));
  }

  // Contact form -> real enquiry in the management system.
  const form = document.getElementById('journeyForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('.form-submit');
      const original = btn.textContent;

      btn.disabled = true;
      btn.style.opacity = '0.75';
      btn.textContent = 'Sending...';

      const fd = new FormData(form);
      const payload = {
        fname: fd.get('fname') || '',
        lname: fd.get('lname') || '',
        email: fd.get('email') || '',
        phone: fd.get('phone') || '',
        dates: fd.get('dates') || '',
        guests: fd.get('guests') || '',
        trip: fd.getAll('trip'),
        message: fd.get('message') || '',
        company: fd.get('company') || ''
      };

      try {
        const res = await fetch('/api/public/enquiry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to send');
        }

        btn.textContent = 'Enquiry Sent \u2713';
        form.reset();
        setTimeout(() => {
          btn.textContent = original;
          btn.style.opacity = '1';
          btn.disabled = false;
        }, 3200);
      } catch (err) {
        // Tell the visitor the truth and give them a working alternative.
        btn.textContent = 'Could not send \u2014 try WhatsApp';
        btn.style.background = '#b3452f';
        setTimeout(() => {
          btn.textContent = original;
          btn.style.background = '';
          btn.style.opacity = '1';
          btn.disabled = false;
        }, 4000);
      }
    });
  }
});
