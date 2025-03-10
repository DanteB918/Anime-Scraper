# 🎬 Anime Scraper

Powered By:

![image](https://github.com/user-attachments/assets/732808e9-6aad-4761-9e60-80baa6589dfa)


> A lightweight JavaScript-based web scraper for retrieving anime information from GoGoAnime/Anitaku for **educational purposes only**.

## ⚠️ Disclaimer

This project was created for **purely educational purposes** to demonstrate web scraping techniques and browser-based APIs. I am not responsible for how this tool is used. Users are responsible for ensuring their use of this tool complies with:  

1. The terms of service of any websites being scraped
2. Local laws regarding web scraping and data collection
3. Copyright and intellectual property rights

**I, the creator of this tool, assume no liability for any misuse of this software.**

## ✨ Features

- 📺 Scrape recent anime episodes from the homepage
- 🔍 Search for anime titles with keyword queries
- 📝 Retrieve detailed episode information
- 📄 JSON output for easy integration with other applications
- 🌐 CORS-friendly design with proxy support
- 📱 Responsive, minimal interface

## 📖 Usage

### Recent Episodes

Access the homepage to see the most recent anime episodes:

```
http://localhost:8080/index.html
```

Pagination is supported via URL parameter:

```
http://localhost:8080/index.html?page=2
```

### Search for Anime

Search for anime titles:

```
http://localhost:8080/search.html?search=demon+slayer
```

### Episode Details

Get detailed information about a specific episode:

```
http://localhost:8080/episode.html?show=one-piece&episode=1080
```

### Documentation

Full API documentation is available at:

```
http://localhost:8080/documentation.html
```

## 🛠️ Technologies Used

- Vanilla JavaScript (ES6+)
- HTML5/CSS3
- Browser's Fetch API
- DOM Parsing APIs
- Cross-Origin Resource Sharing (CORS) proxies

## 💻 Code Structure

- `index.html` - Homepage for recent episodes
- `search.html` - Search interface
- `episode.html` - Episode details page
- `scraper.js` - Core scraping logic for homepage
- `search-scraper.js` - Search functionality
- `episode-scraper.js` - Episode details scraper
- `documentation.html` - API documentation

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

---
