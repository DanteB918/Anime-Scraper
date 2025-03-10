// DOM Elements
const resultsElement = document.getElementById('results');

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
