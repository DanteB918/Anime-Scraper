import AnitakuScraper from '../index.js';

// Create a new instance of the scraper
const scraper = new AnitakuScraper();

// Get recent anime episodes from the homepage
async function getRecentEpisodes() {
  try {
    console.log('Fetching recent episodes...');
    const data = await scraper.scrapeHomePage(1);
    console.log('Recent episodes data:', data.results.length, 'items found');
    console.log(JSON.stringify(data.results, null, 2));
  } catch (error) {
    console.error('Error fetching recent episodes:', error);
  }
}

// Search for anime by title
async function searchAnime(keyword) {
  try {
    console.log(`Searching for "${keyword}"...`);
    const data = await scraper.searchAnime(keyword);
    console.log('Search results:', data.results.length, 'items found');
    console.log(JSON.stringify(data.results, null, 2));
  } catch (error) {
    console.error('Error searching anime:', error);
  }
}

// Get episode details for a specific anime
async function getAnimeEpisodes(animeUrl) {
  try {
    console.log(`Fetching episode data for ${animeUrl}...`);
    const data = await scraper.scrapeEpisodes(animeUrl);
    console.log('Episode data:', data.results.length, 'items found');
    console.log(JSON.stringify(data.results, null, 2));
  } catch (error) {
    console.error('Error fetching episode data:', error);
  }
}

// Execute examples - uncomment the ones you want to run
(async () => {
  await getRecentEpisodes();
  // await searchAnime('demon slayer');
  // await getAnimeEpisodes('/category/one-piece');
})();
