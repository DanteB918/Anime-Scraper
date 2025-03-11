/**
 * Browser-compatible version of the Anitaku Scraper
 */
class AnitakuScraper {
  /**
   * Create a new AnitakuScraper instance
   */
  constructor() {
    this.baseUrl = 'https://anitaku.bz';
    this.corsProxy = 'https://api.allorigins.win/raw?url=';
  }

  /**
   * Fetch HTML content from a URL using a CORS proxy
   * @param {string} url - The URL to fetch HTML from
   * @returns {Promise<string>} - The HTML content
   */
  async fetchHtml(url) {
    try {
      const proxyUrl = `${this.corsProxy}${encodeURIComponent(url)}`;
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
  parseAnimeData(html) {
    // Create a DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    console.log('HTML Content Length:', html.length);
    
    // Get anime items from the new GoGoAnime/Anitaku structure
    let animeItems = doc.querySelectorAll('.last_episodes ul.items li');
    
    console.log('Found anime items:', animeItems.length);
    
    const result = {};
    
    animeItems.forEach((item, index) => {
      // Extract elements
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
        // Extract data based on the structure
        const title = titleElement.textContent.trim();
        const episode = episodeElement ? episodeElement.textContent.trim() : '';
        
        const imgSrc = imgElement.getAttribute('src');
        const url = anchorElement ? anchorElement.getAttribute('href') : '';
        
        // Make URLs absolute
        const absoluteUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
        const absoluteImgUrl = imgSrc.startsWith('http') ? imgSrc : 
                               (imgSrc.startsWith('/') ? `${this.baseUrl}${imgSrc}` : 
                               `${this.baseUrl}/${imgSrc}`);
        
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
   * Scrape anime data from a specific page
   * @param {number} page - The page number to scrape (default: 1)
   * @returns {Promise<Object>} - Object with anime data
   */
  async scrapeHomePage(page = 1) {
    try {
      // Fetch HTML from Anitaku with page parameter
      const url = `${this.baseUrl}/home.html?page=${page}`;
      console.log(`Scraping anime data from: ${url}`);

      const html = await this.fetchHtml(url);

      // Parse the HTML and extract anime data
      const animeData = this.parseAnimeData(html);
      console.log(`Successfully scraped page ${page} anime data!`);
      
      return animeData;
    } catch (error) {
      console.error('Scraping failed:', error);
      throw error;
    }
  }

  /**
   * Scrape episode data from a specific anime URL
   * This is a simplified version for browser use
   */
  async scrapeEpisodes(animeUrl) {
    try {
      // Ensure the URL is absolute
      const url = animeUrl.startsWith('http') ? animeUrl : `${this.baseUrl}${animeUrl}`;
      console.log(`Scraping episode data from: ${url}`);

      const html = await this.fetchHtml(url);
      
      // Use DOMParser for browser
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Get anime info
      const animeTitle = doc.querySelector('#wrapper_bg .anime_info_body_bg h1')?.textContent.trim() || '';
      const animeImage = doc.querySelector('#wrapper_bg .anime_info_body_bg img')?.getAttribute('src') || '';
      const animeDescription = doc.querySelector('#wrapper_bg .anime_info_body_bg .description')?.textContent.trim() || '';
      
      // Get episode list
      const episodeItems = doc.querySelectorAll('#episode_page li a');
      const episodes = [];
      
      episodeItems.forEach(item => {
        const epNum = item.getAttribute('ep_start');
        const epEnd = item.getAttribute('ep_end');
        
        episodes.push({
          start: epNum,
          end: epEnd
        });
      });
      
      const result = {
        title: animeTitle,
        image: animeImage,
        description: animeDescription,
        episodes: episodes
      };
      
      return result;
    } catch (error) {
      console.error('Episode scraping failed:', error);
      throw error;
    }
  }

  /**
   * Search for anime by keyword
   * @param {string} keyword - The keyword to search for
   * @returns {Promise<Object>} - Object with search results
   */
  async searchAnime(keyword) {
    try {
      const searchUrl = `${this.baseUrl}/search.html?keyword=${encodeURIComponent(keyword)}`;
      console.log(`Searching anime with keyword: ${keyword}`);

      const html = await this.fetchHtml(searchUrl);
      
      // Use DOMParser for browser
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Get search results
      const searchItems = doc.querySelectorAll('.items li');
      const results = [];
      
      searchItems.forEach(item => {
        const nameElement = item.querySelector('.name a');
        const imageElement = item.querySelector('.img img');
        const releaseElement = item.querySelector('.released');
        
        if (nameElement && imageElement) {
          const title = nameElement.textContent.trim();
          const url = nameElement.getAttribute('href') || '';
          const image = imageElement.getAttribute('src') || '';
          const released = releaseElement ? releaseElement.textContent.trim() : '';
          
          results.push({
            title,
            url: url.startsWith('http') ? url : `${this.baseUrl}${url}`,
            image: image.startsWith('http') ? image : `${this.baseUrl}${image}`,
            released
          });
        }
      });
      
      return results;
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  }
}

// Make available in the global scope for browser use
window.AnitakuScraper = AnitakuScraper;
