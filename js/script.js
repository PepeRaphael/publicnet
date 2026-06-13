const GITHUB_USER = 'PepeRaphael';
const GITHUB_REPO = 'publicnet';
const BRANCH = 'main';

async function fetchPublications() {
    const grid = document.getElementById('publications-grid');
    if (!grid) return;

    const pdfsUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/publications/pdfs`;
    const imgsUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/publications/images`;

    try {
        const [pdfResponse, imgResponse] = await Promise.all([
            fetch(pdfsUrl),
            fetch(imgsUrl)
        ]);

        if (!pdfResponse.ok || !imgResponse.ok) throw new Error();

        const pdfFiles = await pdfResponse.json();
        const imgFiles = await imgResponse.json();

        grid.innerHTML = '';

        const pdfs = pdfFiles.filter(file => file.name.endsWith('.pdf'));

        if (pdfs.length === 0) {
            grid.innerHTML = '<div style="color: #555; width: 100%; text-align: center;">No publications found.</div>';
            return;
        }

        const publicationsData = await Promise.all(pdfs.map(async (file) => {
            const baseName = file.name.replace('.pdf', '');
            const displayTitle = baseName.replace(/[-_]/g, ' ');
            const pdfUrl = file.download_url;

            const matchingImg = imgFiles.find(img => {
                const lastDotIndex = img.name.lastIndexOf('.');
                const imgBaseName = lastDotIndex !== -1 ? img.name.substring(0, lastDotIndex) : img.name;
                return imgBaseName === baseName;
            });

            const imgUrl = matchingImg ? matchingImg.download_url : '';
            let formattedDate = 'Date unknown';

            try {
                const commitUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/commits?path=${file.path}&per_page=1`;
                const commitResponse = await fetch(commitUrl);
                if (commitResponse.ok) {
                    const commitData = await commitResponse.json();
                    if (commitData.length > 0) {
                        const dateObj = new Date(commitData[0].commit.committer.date);
                        formattedDate = dateObj.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        });
                    }
                }
            } catch (e) {}

            return { displayTitle, pdfUrl, imgUrl, formattedDate };
        }));

        publicationsData.forEach(pub => {
            const card = document.createElement('a');
            card.href = pub.pdfUrl;
            card.className = 'card';
            card.target = '_blank';
            card.rel = 'noopener noreferrer';

            card.innerHTML = `
                <div class="card-header">
                    <img src="${pub.imgUrl}" alt="${pub.displayTitle}" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'100%\\' height=\\'100%\\'><rect width=\\'100%\\' height=\\'100%\\' fill=\\'%23cccccc\\'/></svg>'">
                </div>
                <div class="card-body">
                    <div class="card-title">${pub.displayTitle}</div>
                    <div class="card-sub-title">Published: ${pub.formattedDate}</div>
                </div>
            `;
            grid.appendChild(card);
        });

    } catch (error) {
        grid.innerHTML = `<div style="color: red; width: 100%; text-align: center;">Error loading data. Please check the repository structure.</div>`;
    }
}

document.addEventListener('DOMContentLoaded', fetchPublications);
