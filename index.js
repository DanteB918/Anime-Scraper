import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Main class for the Anitaku Scraper
 */
export class AnitakuScraper {
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
      const response = await axios.get(proxyUrl);
      return response.data;
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
    // Load HTML into cheerio
    const $ = cheerio.load(html);
    
    console.log('HTML Content Length:', html.length);
    
    // Get anime items from the structure
    const animeItems = $('.last_episodes ul.items li');
    
    console.log('Found anime items:', animeItems.length);
    
    const result = {};
    
    animeItems.each((index, item) => {
      const $item = $(item);
      
      // Extract elements
      const imgContainer = $item.find('.img');
      const imgElement = imgContainer.find('img');
      const anchorElement = imgContainer.find('a');
      
      const titleElement = $item.find('p.name a');
      const episodeElement = $item.find('p.episode');
      
      // Debug the first few items
      if (index < 3) {
        console.log('Item HTML:', $.html(item));
        console.log('Found img container:', imgContainer.length);
        console.log('Found img:', imgElement.length);
        console.log('Found anchor:', anchorElement.length);
        console.log('Found title:', titleElement.text());
        console.log('Found episode:', episodeElement.text());
      }
      
      if (imgElement.length && titleElement.length) {
        // Extract data based on the structure
        const title = titleElement.text().trim();
        const episode = episodeElement.text().trim();
        
        const imgSrc = imgElement.attr('src');
        const url = anchorElement.attr('href');
        
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
   * @param {string} animeUrl - The URL of the anime to scrape episodes for
   * @returns {Promise<Object>} - Object with episode data
   */
  async scrapeEpisodes(animeUrl) {
    try {
      // Ensure the URL is absolute
      const url = animeUrl.startsWith('http') ? animeUrl : `${this.baseUrl}${animeUrl}`;
      console.log(`Scraping episode data from: ${url}`);

      const html = await this.fetchHtml(url);
      
      // Load HTML into cheerio
      const $ = cheerio.load(html);
      
      // Get anime info
      const animeTitle = $('#wrapper_bg .anime_info_body_bg h1').text().trim();
      const animeImage = $('#wrapper_bg .anime_info_body_bg img').attr('src');
      const animeDescription = $('#wrapper_bg .anime_info_body_bg .description').text().trim();
      
      // Get episode list
      const episodeItems = $('#episode_page li a');
      const episodes = [];
      
      episodeItems.each((index, item) => {
        const $item = $(item);
        const epNum = $item.attr('ep_start');
        const epEnd = $item.attr('ep_end');
        
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
      
      // Load HTML into cheerio
      const $ = cheerio.load(html);
      
      // Get search results
      const searchItems = $('.items li');
      const results = [];
      
      searchItems.each((index, item) => {
        const $item = $(item);
        
        const nameElement = $item.find('.name a');
        const imageElement = $item.find('.img img');
        const releaseElement = $item.find('.released');
        
        const title = nameElement.text().trim();
        const url = nameElement.attr('href');
        const image = imageElement.attr('src');
        const released = releaseElement.text().trim();
        
        results.push({
          title,
          url: url.startsWith('http') ? url : `${this.baseUrl}${url}`,
          image: image.startsWith('http') ? image : `${this.baseUrl}${image}`,
          released
        });
      });
      
      return results;
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  }
}

// Default export for easier importing
export default AnitakuScraper;
