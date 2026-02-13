// Active States Logic
const links = document.querySelectorAll(".navLinks a");
const currentPage = window.location.pathname.split("/").pop() || "index.html";

links.forEach((link) => {
    const linkAttribute = link.getAttribute("href");
    if (linkAttribute === currentPage) {
        link.classList.add("text-green-500");
    } else {
        link.classList.remove("text-green-500");
    }
});

// Mobile Menu Logic
const btnMenu = document.getElementById("btnMenu");
const menuContainer = document.getElementById("mobileMenu");
const backdrop = document.getElementById("menuBackDrop");
const sheet = document.getElementById("menuSheet");

function toggleMenu() {
    const isClosed = sheet.classList.contains("translate-y-full");
    if (isClosed) {
        menuContainer.classList.remove("invisible", "pointer-events-none");
        backdrop.classList.replace("bg-charcoaldepths-950/0", "bg-charcoaldepths-950/80");
        backdrop.classList.replace("backdrop-blur-none", "backdrop-blur-[2px]");
        setTimeout(() => sheet.classList.remove("translate-y-full"), 10);
    } else {
        sheet.classList.add("translate-y-full");
        backdrop.classList.replace("bg-charcoaldepths-950/80", "bg-charcoaldepths-950/0");
        backdrop.classList.replace("backdrop-blur-[2px]", "backdrop-blur-none");
        setTimeout(() => menuContainer.classList.add("invisible", "pointer-events-none"), 300);
    }
}

btnMenu.addEventListener("click", toggleMenu);
backdrop.addEventListener("click", toggleMenu);

// Stats Section


const statsSection = document.getElementById("statsSection");
const counters = document.querySelectorAll(".counter");
let hasStarted = false;

const startCounting = () => {
  counters.forEach(counter => {
    const target = +counter.getAttribute("data-target");
    const speed = 500;;
    const updateCount = () => {
      const current = +counter.innerText;
      const increment = target / speed;

      if (current < target) {
        counter.innerText = Math.ceil(current + increment);
        setTimeout(updateCount, 20);
      } else {
        counter.innerText = target;
      }
    };
    updateCount();
  });
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !hasStarted) {
      startCounting();
      hasStarted = true;
  }
});
}, { threshold: 0.5 });

if (statsSection) {
  observer.observe(statsSection);
}

// Search Engine Logic

const pageUrls = ['index.html', 'domenii-activitate.html', 'despre.html', 'blog.html', 'contact.html'];

const blogCSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS6X_I85M8qP9-E_S2rQ9XlK8yWj6E8n4L-m8N0C_x_g/pub?output=csv";

let fullSiteIndex = []; 

async function indexStaticPages() {
    const promises = pageUrls.map(async (url) => {
        try {
            const res = await fetch(url);
            const htmlText = await res.text();
            const doc = new DOMParser().parseFromString(htmlText, 'text/html');
            
            // Clean noise
            doc.querySelectorAll('script, style, nav, footer, header, button, .material-symbols-outlined').forEach(el => el.remove());
            const content = (doc.querySelector('main') || doc.body).innerText;

            return {
                title: doc.querySelector('title')?.innerText || url,
                url: url,
                content: content.replace(/\s+/g, ' ').trim()
            };
        } catch (err) { return null; }
    });
    return (await Promise.all(promises)).filter(p => p);
}

async function indexBlog() {
    try {
        const res = await fetch(blogCSV);
        const text = await res.text();
        return text.split('\n').slice(1).map(row => {
            const cols = row.split(',');
            if (!cols[0]) return null;
            return {
                title: cols[0],
                url: `post.html?id=${encodeURIComponent(cols[0].trim())}`,
                content: (cols[0] + " " + (cols[3] || "")).toLowerCase()
            };
        }).filter(p => p);
    } catch (err) { return []; }
}

async function buildSearchIndex() {
    const [staticPages, blogPosts] = await Promise.all([indexStaticPages(), indexBlog()]);
    fullSiteIndex = [...staticPages, ...blogPosts];
}

function performSearch(query, outputId) {
    const container = document.getElementById(outputId);
    if (!container) return;
    container.innerHTML = '';

    if (query.length < 3) {
        container.classList.add('hidden');
        return;
    }

    const lowerQuery = query.toLowerCase();

    const results = fullSiteIndex.filter(item => 
        item.title.toLowerCase().includes(lowerQuery) || 
        item.content.toLowerCase().includes(lowerQuery)
    );

    if (results.length > 0) {
        container.classList.remove('hidden');
        results.forEach(res => {
            const div = document.createElement('div');
            div.className = "block p-3 hover:bg-green-50 border-b border-gray-100 last:border-0 cursor-pointer group";
            
            div.onclick = () => {
                // Determine if the result is on the current page
                const currentPath = window.location.pathname.split("/").pop() || "index.html";
                const targetPath = res.url;
                const isCurrentPage = currentPath === targetPath;

                if (isCurrentPage) {
                    // Stay here and scroll
                    scrollToText(query);
                    // Clear input for a clean UI
                    const input = document.getElementById('search-input-desktop') || document.getElementById('search-input-mobile');
                    if (input) input.value = '';
                } else {
                    // Redirect to the other page and carry the search term in the URL
                    window.location.href = `${targetPath}?highlight=${encodeURIComponent(query)}`;
                }
                
                container.classList.add('hidden');
            };

            div.innerHTML = `
                <div class="font-bold text-charcoaldepths-800 text-sm group-hover:text-green-600 transition-colors">${res.title}</div>
                <div class="text-xs text-charcoaldepths-500 mt-1 truncate">${res.content.substring(0, 60)}...</div>
            `;
            container.appendChild(div);
        });
    } else {
        container.innerHTML = '<div class="p-3 text-xs text-center text-charcoaldepths-400">Niciun rezultat.</div>';
        container.classList.remove('hidden');
    }
}

// THE SCROLL LOGIC: Finds text on page and scrolls to it
function scrollToText(text) {
    const walker = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT, null, false);
    let node;
    while(node = walker.nextNode()) {
        if (node.textContent.toLowerCase().includes(text.toLowerCase())) {
            node.parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Optional: Highlight effect
            const originalColor = node.parentElement.style.backgroundColor;
            node.parentElement.style.backgroundColor = '#dcfce7';
            setTimeout(() => {
                node.parentElement.style.backgroundColor = originalColor;
            }, 2000);
            
            break; 
        }
    }
}


document.addEventListener('click', function(event) {
    const desktopSearchContainer = document.querySelector('.group');
    const desktopResults = document.getElementById('search-results');
    
    if (desktopSearchContainer && !desktopSearchContainer.contains(event.target)) {
        desktopResults.classList.add('hidden');
    }

    const mobileResults = document.getElementById('search-results-mobile');
    const mobileInput = document.getElementById('search-input-mobile');
    
    if (mobileResults && event.target !== mobileInput && !mobileResults.contains(event.target)) {
        mobileResults.classList.add('hidden');
    }
});

document.addEventListener('keydown', function(event) {
    if (event.key === "Escape") {
        const dResults = document.getElementById('search-results');
        const mResults = document.getElementById('search-results-mobile');
        const dInput = document.getElementById('search-input-desktop');
        const mInput = document.getElementById('search-input-mobile');

        if (dResults) dResults.classList.add('hidden');
        if (mResults) mResults.classList.add('hidden');
        if (dInput) dInput.blur();
        if (mInput) mInput.blur();
    }
});

const desktopWrapper = document.querySelector('.group');
if (desktopWrapper) {
    desktopWrapper.addEventListener('mouseleave', function() {
        const results = document.getElementById('search-results');
        const input = document.getElementById('search-input-desktop');
        if (document.activeElement !== input) {
            results.classList.add('hidden');
        }
    });
}

buildSearchIndex();

// Run this on every page load
window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const textToFind = urlParams.get('highlight');

    if (textToFind) {
        // Give the page a tiny bit of time to render before scrolling
        setTimeout(() => {
            scrollToText(textToFind);
        }, 500);
    }
});