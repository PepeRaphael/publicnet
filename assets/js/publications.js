/**
 * publications.js
 * Automatisation complète via l'API GitHub.
 * Pour publier, déposez simplement vos fichiers directement dans le dossier 'publications/' :
 * - Un fichier PDF (ex: Theorie-Information.pdf)
 * - Une image de couverture au même nom (ex: Theorie-Information.jpg ou .png)
 */

const CONFIG = {
    githubUsername: "", // Laissez vide : détecté automatiquement via l'URL GitHub Pages
    repoName: ""        // Laissez vide : détecté automatiquement via l'URL GitHub Pages
};

document.addEventListener('DOMContentLoaded', function () {
    let username = CONFIG.githubUsername;
    let repo = CONFIG.repoName;

    // Détection automatique de l'environnement GitHub Pages
    if (!username || !repo) {
        const hostname = window.location.hostname;
        if (hostname.endsWith('.github.io')) {
            username = hostname.split('.')[0];
            const pathSegments = window.location.pathname.split('/').filter(Boolean);
            repo = pathSegments[0] || (username + '.github.io');
        } else {
            // Configuration manuelle par défaut facultative pour le développement local
            username = "PepeRaphael";
            repo = "portfolio"; 
        }
    }

    const apiUrl = `https://api.github.com/repos/${username}/${repo}/contents/publications`;
    const grid = document.getElementById('publications-grid');
    const emptyState = document.getElementById('pub-empty');

    fetch(apiUrl)
        .then(res => {
            if (!res.ok) throw new Error("Impossible d'accéder au répertoire des publications.");
            return res.json();
        })
        .then(files => {
            if (!Array.isArray(files)) return;

            // Identification des paires de documents (PDF et images associés)
            const pdfFiles = files.filter(f => f.name.toLowerCase().endsWith('.pdf'));
            const imageFiles = files.filter(f => /\.(png|jpe?g|webp)$/i.test(f.name));

            if (grid) grid.innerHTML = '';

            if (pdfFiles.length === 0) {
                if (emptyState) emptyState.style.display = 'block';
                return;
            }

            pdfFiles.forEach(pdf => {
                const baseName = pdf.name.substring(0, pdf.name.lastIndexOf('.'));
                
                // Recherche d'un visuel possédant strictement la même nomenclature de base
                const matchingImage = imageFiles.find(img => {
                    const imgBase = img.name.substring(0, img.name.lastIndexOf('.'));
                    return imgBase === baseName;
                });

                const pdfPath = `publications/${pdf.name}`;
                const imagePath = matchingImage ? `publications/${matchingImage.name}` : 'images/bg.jpg';
                
                // Formatage propre du titre (Suppression des tirets et underscores)
                const displayTitle = baseName.replace(/[-_]+/g, ' ');

                // Structure HTML originale et uniforme de Massively (Balise <article> classique)
                const article = document.createElement('article');
                article.innerHTML = `
                    <header>
                        <h2><a href="${pdfPath}" target="_blank" rel="noopener">${displayTitle}</a></h2>
                    </header>
                    <a href="${pdfPath}" target="_blank" rel="noopener" class="image fit">
                        <img src="${imagePath}" alt="Cover of ${displayTitle}" />
                    </a>
                    <p>View, read, or download the complete research publication in PDF format directly in your browser.</p>
                    <ul class="actions special">
                        <li><a href="${pdfPath}" target="_blank" rel="noopener" class="button">Read Publication</a></li>
                    </ul>
                `;
                grid.appendChild(article);
            });
        })
        .catch(err => {
            console.warn('[publications.js]', err.message);
            if (grid) grid.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
        });
});
