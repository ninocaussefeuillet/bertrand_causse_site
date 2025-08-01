/* ------------------------------------------------------------------
   script.js – logique principale du site
   ------------------------------------------------------------------
   A. Formulaire  (alerte de test + hook pour un envoi réel)
   B. Barre titre + menu : défilement plus lent, jamais hors écran
   C. Parallaxe ultra-léger & fondu pour chaque .chapter
------------------------------------------------------------------ */

document.addEventListener('DOMContentLoaded', () => {
  /* === A. FORMULAIRE ================================================= */
  const contactForm = document.getElementById('contact-form');
  if (contactForm){
    contactForm.addEventListener('submit', e=>{
      e.preventDefault();
      alert('Merci pour votre message !');
      /* 👉  Ici : fetch/Formspree pour un vrai envoi */
    });
  }

  /* === B. BARRE TITRE+MENU  ========================================= */
  const topBar   = document.getElementById('top-bar');
  const barH     = topBar ? topBar.offsetHeight : 0;  // hauteur totale
  const SPEED_BAR = 0.5;                              // 0.5 = 2 × plus lent

  /* === C. CHAPITRES (image de fond) ================================= */
  const chapters = document.querySelectorAll('.chapter');

  /* Injecte l’image déclarée dans data-bg → --bg */
  chapters.forEach(sec=>{
    sec.style.setProperty('--bg', `url(${sec.dataset.bg})`);
  });

    function handleScroll(){
    const y  = window.scrollY;
    const vh = window.innerHeight;

    /* --- B. Top bar -------------------------------------------------- */
    if (topBar){
      /* 2 × plus lent, sans dépasser la moitié de sa hauteur */
      const off = Math.min(y * SPEED_BAR, barH * 0.5);
      topBar.style.transform = `translateY(-${off}px)`;
    }

    /* --- C. Chapitres ------------------------------------------------ */
    chapters.forEach(sec=>{
      const rect = sec.getBoundingClientRect();

      /* progress = 0 (haut visible) → 1 (bas visible) */
      const progress = (vh - rect.top) / (rect.height + vh);
      const clamped  = Math.max(0, Math.min(1, progress));

      /* Image glisse de –10 px à +10 px */
      const shift = (clamped * 20) - 10;          // –10 → +10
      sec.style.setProperty('--shift', `${shift}px`);

      /* Fondu sur les 10 % de la fin de section */
      const alpha = (clamped < 0.9)
        ? 1
        : 1 - (clamped - 0.9) * 10;               // 1 → 0 entre 90 % et 100 %
      sec.style.setProperty('--alpha', alpha);
    });

    ticking = false;            // on réarme le throttle
  }

  /* ----------- throttle via requestAnimationFrame ------------------- */
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(handleScroll);
      ticking = true;
    }
  });
});

   
