/* ------------------------------------------------------------------
   script.js – logique principale du site (v2.2)
   ------------------------------------------------------------------
   Version extrêmement commentée : chaque ligne (ou presque) possède un 
   commentaire en français pour faciliter la compréhension pas‑à‑pas.
------------------------------------------------------------------ */

/* === Variables globales ============================================ */
const GAP = 10;                               // Marge haut/bas entre carte et image
const SPEED_BAR = 0.5;                        // Vitesse de la barre titre (0.5 = 2× plus lent)

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

  /* ----- B. Animation de la barre titre/menu ----------------------- */
  const topBar = document.getElementById('top-bar'); // Récupère la barre (#top-bar)
  const barH   = topBar ? topBar.offsetHeight : 0;   // Calcule sa hauteur (0 si absente)

  function updateTopBar() {              // Fonction qui décale la barre
    if (!topBar) return;                 // Quitte si la barre n'existe pas
    const off = Math.min(               // Calcul du décalage maximum
      window.scrollY * SPEED_BAR,       // Décalage proportionnel au scroll
      barH * 0.75                        // Ne dépasse pas 50 % de la hauteur de la barre
    );
    topBar.style.transform = `translateY(-${off}px)`; // Applique la transformation CSS
  }

  /* ----- C. Parallaxe des sections .chapter ------------------------ */
  const chapters = document.querySelectorAll('.chapter');   // Liste des sections avec image de fond

  chapters.forEach((sec) => {                              // Pour chaque section
    sec.style.setProperty('--bg', `url(${sec.dataset.bg})`);// Injecte l'URL d'image dans --bg
  });

  /* -- Recalcul des paramètres dépendant de la taille -------------- */
  function recalcChapters() {             // Recalcule hauteur carte & déplacement image
    chapters.forEach((sec) => {           // Boucle sur chaque section
      const card = sec.querySelector('.card, .bio-card'); // Sélectionne la carte interne
      if (!card) return;                 // Passe si pas de carte

      const cardH  = card.offsetHeight;   // Hauteur réelle de la carte
      const imgH   = window.innerHeight;  // Hauteur du viewport (image plein écran)
      const shiftMax = Math.max(          // Déplacement maximal nécessaire
        cardH - imgH + 2 * GAP,          // Formule dérivée de l'objectif 10 px / 10 px
        0                                // Pas de valeur négative
      );

      sec.dataset.shiftMax   = shiftMax;  // Stocke shiftMax en data-attribute
      sec.dataset.scrollSpan = Math.max(  // Stocke la plage de scroll (evite division par 0)
        cardH - 2 * GAP,                 // cardH moins marges haut/bas
        1                                // Valeur minimale = 1
      );
    });
  }

  /* -- Mise à jour scroll : calcule shift & alpha ------------------- */
  function updateParallax() {             // Fonction appelée à chaque frame de scroll
    chapters.forEach((sec) => {           // Parcourt toutes les sections
      const rect       = sec.getBoundingClientRect(); // Position section vs viewport
      const shiftMax   = +sec.dataset.shiftMax;       // Conversion string → number
      const scrollSpan = +sec.dataset.scrollSpan;     // Idem pour scrollSpan
      if (!scrollSpan) return;           // Sécurité : évite division par 0

      const progress = Math.min(         // Progression entre 0 et 1 dans la section
        Math.max((-rect.top + GAP) / scrollSpan, 0), // Normalisation
        1                                           // Clamp max à 1
      );

      const shift = progress * shiftMax;             // Déplacement de l'image
      sec.style.setProperty('--shift', `-${shift}px`);// Injecte dans la CSS variable

      const alpha = progress < 0.9 ?                // Opacité : 1 jusqu'à 90 %
        1 :                                         // puis décroît linéairement
        1 - (progress - 0.9) * 10;                 // 90 % → 100 % ⇒ 1 → 0
      sec.style.setProperty('--alpha', alpha);      // Met à jour l'opacité
    });
  }

  /* ----- D. Listeners optimisés ------------------------------------ */
  const onScroll = rafThrottle(() => {  // Wrapper scroll max 1×/frame
    updateTopBar();                    // Met à jour la barre titre/menu
    updateParallax();                  // Met à jour le parallaxe
  });

  window.addEventListener('scroll', onScroll, { passive: true }); // Scroll : onScroll

  // ------------- ESSAI AVEC LA FONCTION BIZZARRE D ACTUALISATION TOUS LES 60 FPS ----------------
  // window.addEventListener('resize', rafThrottle(() => {           // Resize : recalcul + MAJ
  //   recalcChapters();                    // Recalcule les hauteurs cartes
  //   updateTopBar();                      // Recalcule la barre (si hauteur change)
  //   updateParallax();                    // Recalcule la position image/opacité
  // }));

    // ------------- ESSAI SANS LA FONCTION BIZZARRE D ACTUALISATION TOUS LES 60 FPS ----------------
  window.addEventListener('scroll', () => {
  updateTopBar();
  updateParallax();   // exécution à chaque scroll
}, { passive: true });

  /* ----- E. Premier déclenchement ---------------------------------- */
  recalcChapters();                      // Mesure initiale des hauteurs
  updateTopBar();                        // Position initiale de la barre
  updateParallax();                      // Position initiale des images de fond
});


/* === ARCHIVAGE AUTOMATIQUE DES ÉVÉNEMENTS PASSÉS =================== */
(() => {
  const agendaCard   = document.querySelector('#agenda .card'); // carte blanche
  const events       = [...document.querySelectorAll('#agenda .event')];
  const today        = new Date();                              // date/heure actuelles
  const pastEvents   = [];                                      // stocke les anciens

  /* --- 1. Balaye chaque .event ------------------------------------- */
  events.forEach(ev => {
    const span      = ev.querySelector('.date');
    if (!span) return;

    /* Extrait “dd/mm/yy” grâce à une RegExp */
    const m         = span.textContent.match(/(\d{2})\/(\d{2})\/(\d{2})/);
    if (!m) return;

    const [ , d, mth, y ] = m;                // groupes capturés
    const year      = 2000 + parseInt(y, 10); // 25 → 2025
    const month     = parseInt(mth, 10) - 1;  // JS: 0 = janvier
    const day       = parseInt(d, 10);

    const eventDate = new Date(year, month, day, 23, 59, 59); // fin de journée

    /* Si l’événement est déjà passé → on l’archive */
    if (eventDate < today) {
      pastEvents.push(ev.cloneNode(true));  // on le garde pour l’archive
      ev.remove();                          // on le retire de la page actuelle
    }
  });

  /* --- 2. S’il existe des événements passés, crée le lien + la page */
  if (pastEvents.length && agendaCard) {
    /* A. Lien en bas-à-droite de la carte --------------------------- */
    const link      = document.createElement('a');
    link.textContent = 'Événements passés';
    link.style.cssText = 'position:absolute; right:20px; bottom:20px;';
    link.href        = 'past-events.html';      // page générée ci-dessous
    link.target      = '_blank';
    agendaCard.style.position = 'relative';     // pour positionner correctement
    agendaCard.appendChild(link);

    /* B. Génère un blob HTML et crée /past-events.html --------------- */
    const html = `
      <!DOCTYPE html><html lang="fr"><head>
        <meta charset="UTF-8">
        <title>Événements passés</title>
        <link rel="stylesheet" href="style.css">
      </head><body>
        <section class="content">
          <div class="card"><h2>Événements passés</h2>
            ${pastEvents.map(ev => ev.outerHTML).join('')}
          </div>
        </section>
      </body></html>`;

    /* Crée une URL objet pour ce contenu et intercepte le clic ------- */
    const blobURL = URL.createObjectURL(new Blob([html], {type: 'text/html'}));
    link.addEventListener('click', (e) => {
      e.preventDefault();
      window.open(blobURL, '_blank');
    }, { once:true }); // l’URL objet est créée une seule fois
  }
})();


/* ------------------- ESSAI POUR PORTABLE ------------------- */

  /* ---------- E. Menu mobile (burger) ---------------------------- */
  const burger = document.getElementById('burger');
  const mobileNav = document.querySelector('.mobile-nav');
  if (burger && mobileNav) {
    burger.addEventListener('click', () => {
      burger.classList.toggle('open');
      mobileNav.classList.toggle('open');
      document.body.classList.toggle('nav-open'); // empêche le scroll en fond
    });
    /* Ferme le menu quand on clique sur un lien */
    mobileNav.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => {
        burger.classList.remove('open');
        mobileNav.classList.remove('open');
        document.body.classList.remove('nav-open');
      })
    );
  }