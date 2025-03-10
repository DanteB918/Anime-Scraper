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
 * Parse HTML and extract anime search results from GoGoAnime/Anitaku
 * @param {string} html - The HTML content to parse
 * @returns {Object} - Object with anime data in the requested format
 */
function parseSearchResults(html) {
    // Create a DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    console.log('HTML Content Length:', html.length);
    console.log('Document title:', doc.title);
    
    // Get anime items from search results
    // In search results page, the items are in ul.items li under div.last_episodes
    let animeItems = doc.querySelectorAll('.last_episodes ul.items li');
    
    // If we don't find items with that selector, try alternative selectors for search results
    if (animeItems.length === 0) {
        animeItems = doc.querySelectorAll('.items li');
    }
    
    if (animeItems.length === 0) {
        // As a last resort, look for any list item that might contain anime info
        animeItems = doc.querySelectorAll('li.video-block');
    }
    
    console.log('Found anime items:', animeItems.length);
    
    const result = {};
    
    animeItems.forEach((item, index) => {
        // GoGoAnime/Anitaku search results have slightly different structure:
        // - div.img contains the image and link
        // - p.name contains the title
        // - In search results, there may be no episode number, or it might be in a different element
        
        const imgContainer = item.querySelector('.img');
        const imgElement = imgContainer ? imgContainer.querySelector('img') : null;
        const anchorElement = imgContainer ? imgContainer.querySelector('a') : null;
        
        const titleElement = item.querySelector('p.name a') || item.querySelector('a.name');
        const releaseElement = item.querySelector('p.released');
        
        // Debug the first few items
        if (index < 3) {
            console.log('Item HTML:', item.outerHTML);
            console.log('Found img container:', imgContainer);
            console.log('Found img:', imgElement);
            console.log('Found anchor:', anchorElement);
            console.log('Found title:', titleElement);
            console.log('Found release info:', releaseElement);
        }
        
        if ((imgElement || anchorElement) && titleElement) {
            // Extract data based on the structure
            const title = titleElement.textContent.trim();
            const releaseInfo = releaseElement ? releaseElement.textContent.trim() : '';
            
            // Get the image source, falling back to a placeholder if not found
            const imgSrc = imgElement ? imgElement.getAttribute('src') : 'https://gogocdn.net/images/404-image.png';
            
            // Get the URL from the anchor
            const url = anchorElement ? anchorElement.getAttribute('href') : 
                       (titleElement.parentElement.tagName === 'A' ? titleElement.parentElement.getAttribute('href') : '');
            
            // Make URLs absolute
            const baseUrl = 'https://anitaku.bz';
            const absoluteUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
            const absoluteImgUrl = imgSrc.startsWith('http') ? imgSrc : 
                                  (imgSrc.startsWith('/') ? `${baseUrl}${imgSrc}` : 
                                  `${baseUrl}/${imgSrc}`);
            
            result[title] = {
                "release": releaseInfo,
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
    
    // Default values
    let currentPage = 1;
    let totalPages = 1;
    
    // Try to find pagination info
    const paginationInfo = doc.querySelector('div.pagination');
    if (paginationInfo) {
        // Find current page, which is usually marked with a class like 'selected' or 'active'
        const activePage = paginationInfo.querySelector('a.active, a.selected, span.current');
        if (activePage) {
            currentPage = parseInt(activePage.textContent.trim(), 10) || 1;
        }
        
        // Try to find total pages
        // Method 1: Check for a 'last page' link
        const lastPageLink = Array.from(paginationInfo.querySelectorAll('a')).pop();
        if (lastPageLink) {
            const lastPageText = lastPageLink.textContent.trim();
            if (/^\d+$/.test(lastPageText)) {
                totalPages = parseInt(lastPageText, 10);
            }
        }
        
        // Method 2: Extract from URL if Method 1 fails
        if (totalPages === 1 && lastPageLink) {
            const href = lastPageLink.getAttribute('href');
            const pageMatch = href.match(/page=(\d+)/);
            if (pageMatch && pageMatch[1]) {
                totalPages = parseInt(pageMatch[1], 10);
            }
        }
    }
    
    return { currentPage, totalPages };
}

/**
 * Generate pagination controls
 * @param {number} currentPage - The current page number
 * @param {number} totalPages - The total number of pages
 */
function generatePagination(currentPage, totalPages) {
    // Don't show pagination if there's only one page
    if (totalPages <= 1) {
        paginationTopElement.innerHTML = '';
        paginationBottomElement.innerHTML = '';
        return;
    }
    
    // Generate pagination HTML
    let html = '<div class="pagination-container">';
    
    // Previous button
    if (currentPage > 1) {
        const prevPage = currentPage - 1;
        const pageParams = getUrlParams();
        pageParams.page = prevPage;
        const queryString = new URLSearchParams(pageParams).toString();
        html += `<a href="?${queryString}" class="pagination-link">« Previous</a>`;
    }
    
    // Page numbers
    // Show at most 5 page numbers, centered around the current page
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);
    
    for (let i = startPage; i <= endPage; i++) {
        const pageParams = getUrlParams();
        pageParams.page = i;
        const queryString = new URLSearchParams(pageParams).toString();
        
        if (i === currentPage) {
            html += `<span class="pagination-link active">${i}</span>`;
        } else {
            html += `<a href="?${queryString}" class="pagination-link">${i}</a>`;
        }
    }
    
    // Next button
    if (currentPage < totalPages) {
        const nextPage = currentPage + 1;
        const pageParams = getUrlParams();
        pageParams.page = nextPage;
        const queryString = new URLSearchParams(pageParams).toString();
        html += `<a href="?${queryString}" class="pagination-link">Next »</a>`;
    }
    
    html += '</div>';
    
    // Set the pagination HTML to both top and bottom containers
    paginationTopElement.innerHTML = html;
    paginationBottomElement.innerHTML = html;
    
    // Add some basic styling
    const style = document.createElement('style');
    style.textContent = `
        .pagination-container {
            display: flex;
            justify-content: center;
            margin: 20px 0;
            font-family: Arial, sans-serif;
        }
        .pagination-link {
            padding: 8px 12px;
            margin: 0 4px;
            text-decoration: none;
            background-color: #f0f0f0;
            color: #333;
            border-radius: 3px;
            transition: background-color 0.2s;
        }
        .pagination-link:hover {
            background-color: #e0e0e0;
        }
        .pagination-link.active {
            background-color: #4CAF50;
            color: white;
            cursor: default;
        }
    `;
    
    // Add the style to the head if it doesn't exist already
    if (!document.querySelector('style#pagination-style')) {
        style.id = 'pagination-style';
        document.head.appendChild(style);
    }
}

/**
 * Display the results on the page
 * @param {Object} data - The data to display
 */
function displayResults(data) {
    resultsElement.textContent = JSON.stringify(data, null, 2);
}

/**
 * Main function to scrape search results from the GoGoAnime/Anitaku website
 */
async function scrapeSearchResults() {
    try {
        // Get the search query from URL parameter
        const params = getUrlParams();
        const searchQuery = params.search;
        
        if (!searchQuery) {
            resultsElement.textContent = 'No search query provided. Use ?search=your+search+term in the URL.';
            return;
        }
        
        // Prepare the search URL
        const baseUrl = 'https://anitaku.bz/search.html';
        const page = params.page || 1;
        
        // GoGoAnime/Anitaku uses 'keyword' as the search parameter in their URL
        const searchUrl = `${baseUrl}?keyword=${encodeURIComponent(searchQuery)}&page=${page}`;
        
        console.log(`Scraping search results from: ${searchUrl}`);
        resultsElement.textContent = `Searching for "${searchQuery}"...`;
        
        // Fetch the search results page
        const html = await fetchHtml(searchUrl);
        console.log(`Fetched HTML content, length: ${html.length}`);
        
        // Parse the search results
        animeData = parseSearchResults(html);
        
        // Detect pagination information
        const { currentPage, totalPages } = detectPagination(html);
        console.log(`Pagination: ${currentPage} / ${totalPages}`);
        
        // Generate pagination controls
        generatePagination(currentPage, totalPages);
        
        // Display the results
        displayResults(animeData);
        
        console.log('Successfully scraped search results!');
    } catch (error) {
        console.error('Search scraping failed:', error);
        resultsElement.textContent = `Error: ${error.message}`;
    }
}

// Initialize - automatically scrape data when the page loads
document.addEventListener('DOMContentLoaded', () => {
    scrapeSearchResults();
});

// Run immediately if the page is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('Page already loaded, starting search scraper...');
    scrapeSearchResults();
}
