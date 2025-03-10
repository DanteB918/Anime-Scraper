// DOM Elements
const resultsElement = document.getElementById('results');
const paginationTopElement = document.getElementById('pagination-top');
const paginationBottomElement = document.getElementById('pagination-bottom');

// Storage for the scraped data
let animeData = {};

/**
 * Get URL parameters from the current browser URL
 * @returns {Object} - URL parameters as an object
 */
function getUrlParams() {
    const params = {};
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    
    for (const [key, value] of urlParams) {
        params[key] = value;
    }
    
    return params;
}

/**
 * Fetch HTML content from a URL using a CORS proxy
 * @param {string} url - The URL to fetch HTML from
 * @returns {Promise<string>} - The HTML content
 */
async function fetchHtml(url) {
    try {
        // Using allorigins.win as a reliable CORS proxy
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

        const response = await fetch(proxyUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.text();
    } catch (error) {
        console.error(`Error fetching ${url}:`, error);
        throw error;
    }
}

/**
 * Parse HTML and extract anime data from GoGoAnime/Anitaku
 * @param {string} html - The HTML content to parse
 * @returns {Object} - Object with anime data in the requested format
 */
function parseAnimeData(html) {
    // Create a DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    console.log('HTML Content Length:', html.length);
    console.log('Document title:', doc.title);
    
    // Get anime items from the new GoGoAnime/Anitaku structure
    // The main container for recent episodes is ul.items within div.last_episodes
    let animeItems = doc.querySelectorAll('.last_episodes ul.items li');
    
    console.log('Found anime items:', animeItems.length);
    
    const result = {};
    
    animeItems.forEach((item, index) => {
        // GoGoAnime/Anitaku structure has specific classes we can target:
        // - div.img contains the image and link
        // - p.name contains the title
        // - p.episode contains the episode number
        
        const imgContainer = item.querySelector('.img');
        const imgElement = imgContainer ? imgContainer.querySelector('img') : null;
        const anchorElement = imgContainer ? imgContainer.querySelector('a') : null;
        
        const titleElement = item.querySelector('p.name a');
        const episodeElement = item.querySelector('p.episode');
        
        // Debug the first few items
        if (index < 3) {
            console.log('Item HTML:', item.outerHTML);
            console.log('Found img container:', imgContainer);
            console.log('Found img:', imgElement);
            console.log('Found anchor:', anchorElement);
            console.log('Found title:', titleElement);
            console.log('Found episode:', episodeElement);
        }
        
        if (imgElement && titleElement) {
            // Extract data based on the new structure
            const title = titleElement.textContent.trim();
            const episode = episodeElement ? episodeElement.textContent.trim() : '';
            
            const imgSrc = imgElement.getAttribute('src');
            const url = anchorElement ? anchorElement.getAttribute('href') : '';
            
            // Make URLs absolute
            const baseUrl = 'https://anitaku.bz';
            const absoluteUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
            const absoluteImgUrl = imgSrc.startsWith('http') ? imgSrc : 
                                 (imgSrc.startsWith('/') ? `${baseUrl}${imgSrc}` : 
                                 `${baseUrl}/${imgSrc}`);
            
            result[title] = {
                "episode": episode,
                "img": absoluteImgUrl,
                "url": absoluteUrl
            };
        }
    });

    console.log('Total parsed anime entries:', Object.keys(result).length);

    return result;
}

/**
 * Detect pagination information from the HTML
 * @param {string} html - The HTML content
 * @returns {Object} - Object with total pages and current page
 */
function detectPagination(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Look for pagination elements
    const paginationList = doc.querySelector('.pagination-list');
    if (!paginationList) {
        return { currentPage: 1, totalPages: 1 };
    }
    
    // Find the selected/current page
    const selectedItem = paginationList.querySelector('li.selected');
    const currentPage = selectedItem ? parseInt(selectedItem.textContent.trim()) : 1;
    
    // Find all page links to determine total pages
    const pageLinks = paginationList.querySelectorAll('li a');
    let highestPage = 1;
    
    pageLinks.forEach(link => {
        const page = parseInt(link.textContent.trim());
        if (!isNaN(page) && page > highestPage) {
            highestPage = page;
        }
    });
    
    return { currentPage, totalPages: highestPage };
}

/**
 * Generate pagination controls
 * @param {number} currentPage - The current page number
 * @param {number} totalPages - The total number of pages
 */
function generatePagination(currentPage, totalPages) {
    const createPaginationHTML = () => {
        let html = '';
        
        // Previous page button
        if (currentPage > 1) {
            html += `<a href="?page=${currentPage - 1}">Previous</a>`;
        }
        
        // First page
        if (currentPage > 3) {
            html += `<a href="?page=1">1</a>`;
            if (currentPage > 4) {
                html += `<span>...</span>`;
            }
        }
        
        // Pages around current
        for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
            if (i === currentPage) {
                html += `<a href="?page=${i}" class="current">${i}</a>`;
            } else {
                html += `<a href="?page=${i}">${i}</a>`;
            }
        }
        
        // Last page
        if (currentPage < totalPages - 2) {
            if (currentPage < totalPages - 3) {
                html += `<span>...</span>`;
            }
            html += `<a href="?page=${totalPages}">${totalPages}</a>`;
        }
        
        // Next page button
        if (currentPage < totalPages) {
            html += `<a href="?page=${currentPage + 1}">Next</a>`;
        }
        
        return html;
    };
    
    const paginationHTML = createPaginationHTML();
    
    // Update both pagination areas
    if (paginationTopElement) paginationTopElement.innerHTML = paginationHTML;
    if (paginationBottomElement) paginationBottomElement.innerHTML = paginationHTML;
}

/**
 * Display the results on the page
 * @param {Object} data - The data to display
 */
function displayResults(data) {
    resultsElement.textContent = JSON.stringify(data, null, 2);
}

/**
 * Main function to scrape the GoGoAnime/Anitaku website
 */
async function scrapeGoGoAnime() {
    try {
        // Get URL parameters
        const params = getUrlParams();
        const page = params.page || '1'; // Default to page 1 if not specified
        
        // Add page number to the page title for reference
        document.title = `Anime Scraper - Page ${page}`;
        
        // Fetch HTML from GoGoAnime/Anitaku with page parameter
        const url = `https://anitaku.bz/home.html?page=${page}`;
        console.log(`Scraping anime data from: ${url}`);
        
        const html = await fetchHtml(url);

        // Detect pagination information
        const paginationInfo = detectPagination(html);
        console.log('Pagination info:', paginationInfo);
        
        // Generate pagination controls
        generatePagination(parseInt(page), paginationInfo.totalPages);

        // Parse the HTML and extract anime data
        animeData = parseAnimeData(html);

        // Display the results
        displayResults(animeData);
        console.log(`Successfully scraped page ${page} anime data!`);
    } catch (error) {
        console.error('Scraping failed:', error);
        resultsElement.textContent = `Error: ${error.message}`;
    }
}

// Initialize - automatically scrape data when the page loads
document.addEventListener('DOMContentLoaded', () => {
    scrapeGoGoAnime();
});

// Run immediately if the page is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    scrapeGoGoAnime();
}
