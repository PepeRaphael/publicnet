/* ─────────────────────────────────────────────────────────
   CONFIGURATION — modifiez uniquement cette section
───────────────────────────────────────────────────────── */
const GITHUB_USER = 'PepeRaphael';
const GITHUB_REPO = 'publicnet';
const BRANCH      = 'main';

/* ─────────────────────────────────────────────────────────
   NAVBAR — scroll behavior + active link
───────────────────────────────────────────────────────── */
const navbar   = document.querySelector('.navbar');
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

function onScroll() {
  // Sticky style
  if (window.scrollY > 60) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }

  // Active nav link
  let current = '';
  sections.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 160) {
      current = sec.id;
    }
  });
  navLinks.forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === `#${current}`);
  });
}

window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ─────────────────────────────────────────────────────────
   SCROLL REVEAL — IntersectionObserver
───────────────────────────────────────────────────────── */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, i * 80);
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
);

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ─────────────────────────────────────────────────────────
   PUBLICATIONS — fetch from GitHub
───────────────────────────────────────────────────────── */
async function fetchPublications() {
  const grid     = document.getElementById('publications-grid');
  const countEl  = document.getElementById('pub-count');
  if (!grid) return;

  const base    = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/publications`;
  const pdfsUrl = `${base}/pdfs`;
  const imgsUrl = `${base}/images`;

  try {
    const [pdfRes, imgRes] = await Promise.all([
      fetch(pdfsUrl),
      fetch(imgsUrl)
    ]);

    if (!pdfRes.ok || !imgRes.ok) throw new Error('GitHub fetch failed');

    const pdfFiles = await pdfRes.json();
    const imgFiles = await imgRes.json();

    const pdfs = pdfFiles.filter(f => f.name.endsWith('.pdf'));

    if (pdfs.length === 0) {
      grid.innerHTML = '<p class="loader" style="font-style:italic;">Aucune publication trouvée.</p>';
      return;
    }

    if (countEl) countEl.textContent = pdfs.length;

    // Fetch commit dates in parallel
    const pubs = await Promise.all(pdfs.map(async (file) => {
      const baseName    = file.name.replace('.pdf', '');
      const displayTitle = baseName.replace(/[-_]/g, ' ');
      const pdfUrl      = file.download_url;

      const match   = imgFiles.find(img => {
        const n = img.name;
        return n.substring(0, n.lastIndexOf('.') !== -1 ? n.lastIndexOf('.') : n.length) === baseName;
      });
      const imgUrl  = match ? match.download_url : '';

      let formattedDate = '';
      try {
        const commitRes = await fetch(
          `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/commits?path=${encodeURIComponent(file.path)}&per_page=1`
        );
        if (commitRes.ok) {
          const commits = await commitRes.json();
          if (commits.length > 0) {
            formattedDate = new Date(commits[0].commit.committer.date)
              .toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
          }
        }
      } catch (_) {}

      return { displayTitle, pdfUrl, imgUrl, formattedDate };
    }));

    // Render cards
    grid.innerHTML = '';

    pubs.forEach((pub, idx) => {
      const card = document.createElement('a');
      card.href   = pub.pdfUrl;
      card.target = '_blank';
      card.rel    = 'noopener noreferrer';
      card.className = 'pub-card reveal';

      const fallbackSvg = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='220'><rect width='400' height='220' fill='%23111'/><text x='50%25' y='50%25' fill='%237A7670' font-family='Georgia,serif' font-size='13' text-anchor='middle' dominant-baseline='middle'>— Document —</text></svg>`;

      card.innerHTML = `
        <div class="pub-image-container">
          <img
            src="${pub.imgUrl || fallbackSvg}"
            alt="${pub.displayTitle}"
            loading="lazy"
            onerror="this.onerror=null;this.src='${fallbackSvg}'"
          >
          <div class="pub-overlay"></div>
          <div class="pub-open-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </div>
        </div>
        <div class="pub-content">
          <h3>${pub.displayTitle}</h3>
          ${pub.formattedDate ? `<span class="pub-date">${pub.formattedDate}</span>` : ''}
        </div>
      `;

      grid.appendChild(card);

      // Staggered reveal
      setTimeout(() => revealObserver.observe(card), idx * 40);
    });

  } catch (err) {
    console.error(err);
    grid.innerHTML = `<p class="loader" style="color:#c0392b;">Erreur lors du chargement. Vérifiez la structure du dépôt.</p>`;
  }
}

document.addEventListener('DOMContentLoaded', fetchPublications);
