/* ------------------------------------------------------------------
   script.js – logique principale du site (v2.2)
   ------------------------------------------------------------------
   Version extrêmement commentée : chaque ligne (ou presque) possède un 
   commentaire en français pour faciliter la compréhension pas‑à‑pas.
------------------------------------------------------------------ */

/* === Variables globales ============================================ */
const GAP = 10;                               // Marge haut/bas entre carte et image
const SPEED_BAR = 0.5;                        // Vitesse de la barre titre (0.5 = 2× plus lent)


// ------------------------------------------------------------------------------------------------------------------------------------------
// 1. EN GROS CA C EST UN TRUC JUSTE POUR QUE LE SITE REACTUALISE PAS TROP DE FOIS CE QUI POURRAIT LE FAIRE BEUGGER
// ------------------------------------------------------------------------------------------------------------------------------------------

/* === Petit helper throttle basé sur requestAnimationFrame ========== */
function rafThrottle(fn) {                    // Fonction utilitaire – crée un wrapper throttlé
  let ticking = false;                        // Indique si une frame est déjà planifiée
  return function (...args) {                 // Retourne la fonction throttlée
    if (!ticking) {                           // Si aucune frame en attente
      requestAnimationFrame(() => {           // Planifie l'exécution sur la prochaine frame
        fn.apply(this, args);                 // Appelle la fonction d'origine avec ses arguments
        ticking = false;                      // Libère le verrou après exécution
      });
      ticking = true;                         // Verrouille jusqu'à la prochaine frame
    }
  };
}

// ------------------------------------------------------------------------------------------------------------------------------------------
// 2. ENVOI DE MAIL
// ------------------------------------------------------------------------------------------------------------------------------------------

/* === Initialisation quand le DOM est prêt : EN GROS CA ENVOIE UN MAIL ========================== */
document.addEventListener('DOMContentLoaded', () => { // Attendre que le HTML soit chargé
  /*/* ----- A. Gestion du formulaire ---------------------------------- */
  const contactForm = document.getElementById('contact-form'); // Sélectionne #contact-form
  if (contactForm) {                       // Vérifie que le formulaire existe

    // 1. Récupère dynamiquement l'URL définie dans l'attribut "action" du <form>
    const endpoint = contactForm.action;    // ex. https://formsubmit.co/ton@email.com

    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();                   // Bloque l'envoi classique

      try {
        /* 2. Prépare les données du formulaire ---------------------- */
        const formData = new FormData(contactForm); // Récupère tous les champs

        /* 3. Envoie via fetch() vers l'endpoint --------------------- */
        const res = await fetch(endpoint, {
          method: 'POST',                  // Méthode POST obligatoire
          body: formData,                  // Le corps : données multi‑part
          headers: { 'Accept': 'application/json' } // Demande une réponse JSON
        });

        /* 4. Traite la réponse -------------------------------------- */
        if (res.ok) {
          alert('Message envoyé, je vous réponds au plus vite !'); // Succès côté réseau
          contactForm.reset();              // Réinitialise les champs
        } else {
          const data = await res.json().catch(() => ({}));
          const msg  = data.error || 'Erreur lors de l’envoi.';
          alert(msg);
        }
      } catch (err) {
        // Gestion d'une éventuelle erreur réseau
        alert('Impossible d’envoyer le message. Vérifiez votre connexion.');
        console.error(err);
      }
    });
  }
}); // <-- point-virgule ajouté ici pour sécuriser l'IIFE suivante

// ------------------------------------------------------------------------------------------------------------------------------------------
// 5. ARCHIVAGE AUTOMATIQUE DES ÉVÉNEMENTS PASSÉS
// ------------------------------------------------------------------------------------------------------------------------------------------

;(() => {
  const agendaCard   = document.querySelector('#agenda .chapter-card'); // correction sélecteur
  const events       = [...document.querySelectorAll('#agenda .event')];
  const today        = new Date();
  const pastEvents   = [];

  events.forEach(ev => {
    const span      = ev.querySelector('.date');
    if (!span) return;

    const m         = span.textContent.match(/(\d{2})\/(\d{2})\/(\d{2})/);
    if (!m) return;

    const [ , d, mth, y ] = m;
    const year      = 2000 + parseInt(y, 10);
    const month     = parseInt(mth, 10) - 1;
    const day       = parseInt(d, 10);

    const eventDate = new Date(year, month, day, 23, 59, 59);

    if (eventDate < today) {
      pastEvents.push(ev.cloneNode(true));
      ev.remove();
    }
  });

  if (pastEvents.length && agendaCard) {
    const link = document.createElement('a');
    link.textContent = ' → Événements passés';
    link.href = 'past-events.html';
    link.target = '_blank';
    link.classList.add('classic-link'); // applique ton style CSS
    link.style.position = 'absolute';
    link.style.right = '20px';
    link.style.bottom = '20px';

agendaCard.style.position = 'relative';
agendaCard.appendChild(link);

    // URLs absolues pour éviter les chemins cassés dans la page blob
const base          = new URL('.', location.href);                 // répertoire courant du site
const cssUrl        = new URL('style.css', base).href;             // URL absolue vers ton CSS
const agendaImgUrl  = new URL('images/agenda.jpeg', base).href;    // même image que l’Agenda

const html = `
  <!DOCTYPE html><html lang="fr"><head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Événements passés</title>

    <!-- mêmes polices/icônes que sur l’index -->
    <link href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <link rel="stylesheet" href="${cssUrl}">
  </head>
  <body>
    <section class="chapter" id="past-agenda">
      <figure class="chapter-hero">
        <img class="chapter-img" src="${agendaImgUrl}" alt="agenda">
        <figcaption class="chapter-title">
          <h2>Événements passés</h2>
        </figcaption>
      </figure>

      <div class="chapter-card -full">
        ${pastEvents.map(ev => ev.outerHTML).join('')}

        <p style="margin-top:16px">
          <a href="${location.href}" class="classic-link"> ← Retour au site</a>
        </p>
      </div>
    </section>
  </body>
  </html>`;

    const blobURL = URL.createObjectURL(new Blob([html], {type: 'text/html'}));
    link.addEventListener('click', (e) => {
      e.preventDefault();
      window.open(blobURL, '_blank');
    }, { once:true });
  }
})(); // <-- IIFE sécurisée

// ------------------------------------------------------------------------------------------------------------------------------------------
// 6. VERSION PORTABLE (MENU BURGER)
// ------------------------------------------------------------------------------------------------------------------------------------------

;(() => {
  const burger = document.getElementById('burger');
  const mobileNav = document.querySelector('.mobile-nav');
  const body = document.body;

  if (!burger || !mobileNav) return;

  const closeMenu = () => {
    burger.classList.remove('open');
    mobileNav.classList.remove('open');
    body.classList.remove('nav-open');
    burger.setAttribute('aria-expanded', 'false');
  };

  const openMenu = () => {
    burger.classList.add('open');
    mobileNav.classList.add('open');
    body.classList.add('nav-open');
    burger.setAttribute('aria-expanded', 'true');
  };

  const toggleMenu = () => {
    burger.classList.contains('open') ? closeMenu() : openMenu();
  };

  burger.addEventListener('click', toggleMenu);

  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  mobileNav.addEventListener('click', (e) => {
    if (e.target === mobileNav) closeMenu();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  const mq = window.matchMedia('(min-width: 769px)');
  const handleDesktop = (ev) => { if (ev.matches) closeMenu(); };
  mq.addEventListener ? mq.addEventListener('change', handleDesktop) : mq.addListener(handleDesktop);
})(); // <-- IIFE sécurisée