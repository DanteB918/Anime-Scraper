/**
 * GoGoAnime/Anitaku Episode Page Scraper
 * This script extracts details from an anime episode page when loaded
 */

// Storage for the scraped data
let episodeData = {};

/**
 * Fetch current page HTML content - useful for testing with different URLs
 * @returns {Promise<string>} - The HTML content
 */
async function fetchCurrentPageHtml() {
    try {
        // Use custom URL if provided, otherwise use current page URL
        const url = window.animeEpisodeUrl || window.location.href;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.text();
    } catch (error) {
        console.error(`Error fetching page:`, error);
        return document.documentElement.outerHTML; // Fallback to current page HTML
    }
}

/**
 * Extract anime episode data from the HTML
 * @param {Document} doc - The HTML document to parse
 * @returns {Object} - Extracted episode data
 */
function parseEpisodeData(doc) {
    const result = {};
    
    // Basic anime info
    try {
        // Title information
        const titleElement = doc.querySelector('.anime_video_body h1');
        if (titleElement) {
            result.fullTitle = titleElement.textContent.trim();
        }
        
        // Extract anime name and episode number from title
        const titleMatch = result.fullTitle?.match(/([^\d]+)\s+Episode\s+(\d+)/);
        if (titleMatch) {
            result.animeName = titleMatch[1].trim();
            result.episodeNumber = titleMatch[2];
        }
        
        // Get anime category
        const categoryElement = doc.querySelector('.anime_video_body_cate a');
        if (categoryElement) {
            result.category = {
                name: categoryElement.textContent.trim(),
                url: categoryElement.getAttribute('href')
            };
        }
        
        // Get main anime page link
        const animeInfoElement = doc.querySelector('.anime-info a');
        if (animeInfoElement) {
            result.animeUrl = animeInfoElement.getAttribute('href');
        }

        // Video iframe source (current server)
        const videoIframe = doc.querySelector('.play-video iframe');
        if (videoIframe) {
            result.currentVideoUrl = videoIframe.getAttribute('src');
        }
        
        // Extract all available servers
        const serverElements = doc.querySelectorAll('.anime_muti_link ul li a');
        result.servers = [];
        
        serverElements.forEach(server => {
            result.servers.push({
                name: server.querySelector('i')?.nextSibling?.textContent.trim() || 'Unknown',
                url: server.getAttribute('data-video'),
                serverType: server.getAttribute('rel')
            });
        });
        
        // Get episode navigation (previous/next)
        const prevEpisode = doc.querySelector('.anime_video_body_episodes_l a');
        if (prevEpisode) {
            result.previousEpisode = {
                url: prevEpisode.getAttribute('href'),
                title: prevEpisode.textContent.trim()
            };
        }
        
        const nextEpisode = doc.querySelector('.anime_video_body_episodes_r a');
        if (nextEpisode) {
            result.nextEpisode = {
                url: nextEpisode.getAttribute('href'),
                title: nextEpisode.textContent.trim()
            };
        }
        
        // Extract related episodes
        const relatedEpisodes = [];
        const episodeItems = doc.querySelectorAll('#load_ep a');
        
        episodeItems.forEach(item => {
            relatedEpisodes.push({
                number: item.getAttribute('ep_end'),
                url: item.getAttribute('href'),
                title: item.textContent.trim()
            });
        });
        
        result.relatedEpisodes = relatedEpisodes;
        
        // Get anime description from meta
        const metaDescription = doc.querySelector('meta[name="description"]');
        if (metaDescription) {
            result.description = metaDescription.getAttribute('content');
        }
        
        // Get anime thumbnail/cover image
        const metaImage = doc.querySelector('meta[itemprop="image"]');
        if (metaImage) {
            result.coverImage = metaImage.getAttribute('content');
        }
    } catch (error) {
        console.error('Error parsing episode data:', error);
    }
    
    return result;
}

/**
 * Display the scraped data in the page or console
 * @param {Object} data - The scraped data to display
 */
function displayResults(data) {
    console.log('Scraped Episode Data:', data);
    
    // Dispatch an event with the scraped data for other scripts to use
    const event = new CustomEvent('episodeDataScraped', {
        detail: data,
        bubbles: true,
        cancelable: true
    });
    document.dispatchEvent(event);
    
    // No floating panel - removed for cleaner interface
}

/**
 * Main function to scrape the anime episode page
 */
async function scrapeEpisodePage() {
    try {
        // Use custom URL if provided, otherwise use current page URL
        const url = window.animeEpisodeUrl || window.location.href;
        console.log(`Scraping anime episode data from: ${url}`);
        
        // If we're using a custom URL, we need to fetch the HTML
        let doc;
        if (window.animeEpisodeUrl) {
            const html = await fetchCurrentPageHtml();
            const parser = new DOMParser();
            doc = parser.parseFromString(html, 'text/html');
        } else {
            // Just use the current document
            doc = document;
        }
        
        // Parse the HTML and extract episode data
        episodeData = parseEpisodeData(doc);
        
        // Display the results
        displayResults(episodeData);
        
        console.log('Successfully scraped episode data!');
    } catch (error) {
        console.error('Episode scraping failed:', error);
    }
}

// Initialize - automatically scrape data when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded, starting scraper...');
    scrapeEpisodePage();
});

// Run immediately if the page is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('Page already loaded, starting scraper...');
    scrapeEpisodePage();
}
