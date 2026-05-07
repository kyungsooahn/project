const fs = require('fs');
const path = '/home/user/project/study_cim.html';
let content = fs.readFileSync(path, 'utf8');

// Remove existing TOC and styles to start clean
content = content.replace(/<style>
\s+\.toc-container[\s\S]*?<\/style>/, '');
content = content.replace(/<nav class="toc-container">[\s\S]*?<\/nav>/, '');
content = content.replace(/<h2 id="sec\d+">/g, '<h2>');

const styles = `
    <style>
        .toc-container { background: rgba(99, 102, 241, 0.05); padding: 1.5rem; border-radius: 1rem; margin-bottom: 2rem; border: 1px solid rgba(99, 102, 241, 0.1); }
        .toc-title { font-size: 1.2rem; font-weight: bold; margin-bottom: 1rem; }
        .toc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 0.5rem 1rem; }
        .toc-item { text-decoration: none; color: inherit; font-size: 0.95rem; opacity: 0.8; transition: opacity 0.2s; }
        .toc-item:hover { opacity: 1; color: var(--primary); font-weight: 500; }
    </style>
`;
content = content.replace('</head>', styles + '</head>');

const tocLinks = [];
content = content.replace(/<h2>(\d+)\s+([^<]+)<\/h2>/g, (match, num, title) => {
    const id = 'sec' + num;
    const cleanTitle = title.trim();
    tocLinks.push({ id, text: num + ' ' + cleanTitle });
    return '<h2 id="' + id + '">' + num + ' ' + cleanTitle + '</h2>';
});

const tocHtml = `
            <nav class="toc-container">
                <div class="toc-title">📂 목차</div>
                <div class="toc-grid">
                    ${tocLinks.map(link => `<a href="#${link.id}" class="toc-item">${link.text}</a>`).join('\n                    ')}
                </div>
            </nav>
`;

content = content.replace('<main class="content-page">', '<main class="content-page">' + tocHtml);

fs.writeFileSync(path, content);
console.log('Successfully updated study_cim.html with TOC.');
