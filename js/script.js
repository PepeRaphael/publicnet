const GITHUB_USER = 'PepeRaphael'; 
const GITHUB_REPO = 'publicnet';      
const BRANCH = 'main';         

async function fetchPublications() {
    const grid = document.getElementById('publications-grid');
    if (!grid) return;

    // Point d'accès de l'API GitHub pour le dossier des PDFs
    const apiUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/publications/pdfs`;

    try {
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const files = await response.json();
        
        // Vider le loader
        grid.innerHTML = '';

        // Filtrer uniquement les fichiers PDF
        const pdfFiles = files.filter(file => file.name.endsWith('.pdf'));

        if (pdfFiles.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Aucune publication trouvée.</p>';
            return;
        }

        pdfFiles.forEach(file => {
            // Extraction du nom de base (ex: "Ondes_Acoustiques.pdf" -> "Ondes_Acoustiques")
            const baseName = file.name.replace('.pdf', '');
            
            // Formatage du titre : remplace les tirets et underscores par des espaces
            const displayTitle = baseName.replace(/[-_]/g, ' ');

            // Construction des URLs brutes (raw) pour le PDF et l'image
            const pdfUrl = file.download_url;
            const imgUrl = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${BRANCH}/publications/images/${baseName}.jpg`;

            // Création de l'élément HTML interactif
            const card = document.createElement('a');
            card.href = pdfUrl;
            card.className = 'pub-card';
            card.target = '_blank'; // Ouvre le PDF dans un nouvel onglet
            card.rel = 'noopener noreferrer';

            card.innerHTML = `
                <div class="pub-image-container">
                    <img src="${imgUrl}" alt="${displayTitle}" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'100%\\' height=\\'100%\\'><rect width=\\'100%\\' height=\\'100%\\' fill=\\'%23e9ecef\\'/><text x=\\'50%\\' y=\\'50%\\' fill=\\'%236c757d\\' font-family=\\'Arial\\' font-size=\\'14\\' text-anchor=\\'middle\\' dominant-baseline=\\'middle\\'>Image non trouvée</text></svg>'">
                </div>
                <div class="pub-content">
                    <h3>${displayTitle}</h3>
                </div>
            `;

            grid.appendChild(card);
        });

    } catch (error) {
        console.error("Échec de la récupération des données de l'API:", error);
        grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: red;">Erreur lors du chargement des publications. Vérifiez la configuration du dépôt.</p>`;
    }
}

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', fetchPublications);
