# 🎬 Anitaku Scraper (NPM Package)

![image](https://github.com/user-attachments/assets/732808e9-6aad-4761-9e60-80baa6589dfa)

> A lightweight JavaScript-based web scraper for retrieving anime information from GoGoAnime/Anitaku for **educational purposes only**.

## ⚠️ Disclaimer

This project was created for **purely educational purposes** to demonstrate web scraping techniques and APIs. I am not responsible for how this tool is used. Users are responsible for ensuring their use of this tool complies with:  

1. The terms of service of any websites being scraped
2. Local laws regarding web scraping and data collection
3. Copyright and intellectual property rights

**I, the creator of this tool, assume no liability for any misuse of this software.**

## 📝 To Note:

Currently, this project RELIES on `https://anitaku.bz/`, if for whatever reason they go down, this package goes down.

## ✨ Features

- 📺 Scrape recent anime episodes from the homepage
- 🔍 Search for anime titles with keyword queries
- 📝 Retrieve detailed episode information
- 📄 JSON output for easy integration with other applications
- 🌐 CORS-friendly design with proxy support
- 📱 Works in both Node.js and browser environments

## 📖 Installation

### Using npm
```bash
npm install anitaku-scraper
```

### Using yarn
```bash
yarn add anitaku-scraper
```

## 📖 Usage

### Node.js Usage

```javascript
import AnitakuScraper from 'anitaku-scraper';

// Create a new instance of the scraper
const scraper = new AnitakuScraper();

// Get recent anime episodes from the homepage
async function getRecentEpisodes() {
  try {
    // Optional: specify page number (defaults to 1)
    const page = 1;
    const animeData = await scraper.scrapeHomePage(page);
    console.log(animeData);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Search for anime by title
async function searchAnime(keyword) {
  try {
    const searchResults = await scraper.searchAnime(keyword);
    console.log(searchResults);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Get episode details for a specific anime
async function getAnimeEpisodes(animeUrl) {
  try {
    const episodeData = await scraper.scrapeEpisodes(animeUrl);
    console.log(episodeData);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run examples
getRecentEpisodes();
searchAnime('demon slayer');
getAnimeEpisodes('/category/one-piece');
```

### Browser Usage

You can use this package in the browser by either importing it with a bundler like webpack or directly including the browser version from a CDN:

```html
<!-- Include from a CDN (after publishing) -->
<script src="https://cdn.jsdelivr.net/npm/anitaku-scraper/browser.js"></script>

<script>
  // Create a new instance
  const scraper = new AnitakuScraper();
  
  // Example: Get recent episodes
  async function loadRecentAnime() {
    try {
      const data = await scraper.scrapeHomePage(1);
      // Do something with the data
      console.log(data);
      document.getElementById('results').textContent = JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Error:', error);
    }
  }
  
  // Call function when page loads
  document.addEventListener('DOMContentLoaded', loadRecentAnime);
</script>
```

## 🛠️ API Reference

### `AnitakuScraper` Class

#### `scrapeHomePage(page = 1)`
- **Description**: Scrapes the homepage for recent anime episodes
- **Parameters**: 
  - `page` (Number): Page number to scrape (default: 1)
- **Returns**: Promise resolving to an object containing anime data

#### `searchAnime(keyword)`
- **Description**: Searches for anime by keyword
- **Parameters**:
  - `keyword` (String): Search term
- **Returns**: Promise resolving to an array of search results

#### `scrapeEpisodes(animeUrl)`
- **Description**: Gets episode information for a specific anime
- **Parameters**:
  - `animeUrl` (String): URL of the anime page
- **Returns**: Promise resolving to an object with episode data

## 💻 Original Web Interface

This package is derived from a web-based scraper interface. You can still access the original web interface:

- Recent Episodes: `https://danteb918.github.io/Anime-Scraper/index.html`
- Search: `https://danteb918.github.io/Anime-Scraper/search.html?search=demon+slayer`
- Episode Details: `https://danteb918.github.io/Anime-Scraper/episode.html?show=one-piece&episode=1080`

## 👨‍💻 Contributing

This project is **open source** and contributions are welcome! Feel free to fork, improve, and submit pull requests. Here's how you can contribute:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some feature'`)
5. Push to the branch (`git push origin feature/your-feature`)
6. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.
