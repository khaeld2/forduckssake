// Ensure marked is properly initialized
marked.setOptions({
  breaks: true,
  gfm: true
});

// Weather functionality
async function getWeather() {
    const city = document.getElementById('city-input').value;
    if (!city) {
        document.getElementById('weather-data').innerHTML = 'Please enter a city name';
        return;
    }
    try {
        // Get coordinates first
        const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`);
        const geoData = await geoResponse.json();
        if (!geoData.results || geoData.results.length === 0) {
            throw new Error('City not found');
        }
        const {latitude, longitude} = geoData.results[0];
        
        // Get weather data
        const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);
        const weatherData = await weatherResponse.json();
        
        // Current weather
        const current = weatherData.current;
        const currentTempC = current.temperature_2m;
        const currentTempF = (currentTempC * 9/5) + 32;
        const windSpeed = current.wind_speed_10m;
        const windDirection = current.wind_direction_10m;
        
        // Weekly forecast
        let forecastHTML = '';
        for (let i = 0; i < 7; i++) {
            const date = new Date(weatherData.daily.time[i]);
            const dayName = date.toLocaleDateString('en-US', {weekday: 'short'});
            const dateStr = date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
            const maxTemp = weatherData.daily.temperature_2m_max[i];
            const minTemp = weatherData.daily.temperature_2m_min[i];
            forecastHTML += `<div style="color: #000000">${dayName} (${dateStr}): ${maxTemp}°C/${(maxTemp * 9/5 + 32).toFixed(1)}°F (${minTemp}°C/${(minTemp * 9/5 + 32).toFixed(1)}°F)</div>`;
        }
        
        document.getElementById('weather-data').innerHTML = 
            `<div style="margin-bottom: 10px;">
                <strong>Current Weather in ${city} (${new Date().toLocaleDateString('en-US', {weekday: 'long', month: 'short', day: 'numeric'})}):</strong><br>
                ${currentTempC.toFixed(1)}°C / ${currentTempF.toFixed(1)}°F (${getSarcasticDescription(currentTempC, current.weather_code)})<br>
                Wind: ${windSpeed} km/h from ${windDirection}° (${getWindDescription(windSpeed)})<br>
                Humidity: ${current.relative_humidity_2m}% (${getHumidityDescription(current.relative_humidity_2m)})
            </div>
            <div>
                <strong>7-Day Forecast:</strong><br>
                ${forecastHTML}
            </div>`;
    } catch (error) {
        document.getElementById('weather-data').innerHTML = 
            `Failed to get weather: ${error.message}`;
    }
}

// Notes functionality
function togglePreview() {
    const preview = document.getElementById('note-preview');
    const textarea = document.getElementById('note-input');
    const toggleBtn = document.getElementById('preview-toggle');
    
    if (preview.style.display === 'none') {
        try {
            preview.innerHTML = marked.parse(textarea.value);
            preview.style.display = 'block';
            textarea.style.display = 'none';
            toggleBtn.textContent = 'Edit';
        } catch (e) {
            alert('Markdown parsing error: ' + e.message);
        }
    } else {
        preview.style.display = 'none';
        textarea.style.display = 'block';
        toggleBtn.textContent = 'Preview';
    }
}

function insertMarkdown(syntax) {
    const textarea = document.getElementById('note-input');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);
    
    textarea.value = beforeText + syntax + selectedText + afterText;
    textarea.focus();
    textarea.setSelectionRange(start + syntax.length, start + syntax.length + selectedText.length);
}

function clearAllNotes() {
    localStorage.removeItem('ducks-sake-notes');
    document.getElementById('saved-notes').innerHTML = '';
    document.getElementById('note-input').value = '';
    // Force reset preview state
    const preview = document.getElementById('note-preview');
    const textarea = document.getElementById('note-input');
    const toggleBtn = document.getElementById('preview-toggle');
    preview.style.display = 'none';
    textarea.style.display = 'block';
    toggleBtn.textContent = 'Preview';
    // Refresh Markdown parser state
    marked.setOptions({
        breaks: true,
        gfm: true
    });
}

function removeNote(index) {
    let notes = JSON.parse(localStorage.getItem('ducks-sake-notes') || '[]');
    notes.splice(index, 1);
    localStorage.setItem('ducks-sake-notes', JSON.stringify(notes));
    
    let notesHTML = '';
    notes.forEach((n, i) => {
        const rawNote = n;
const parsedNote = (() => { try { return marked.parse(rawNote) } catch(e) { return rawNote } })();
            notesHTML += `<div style="margin-bottom: 15px; border-bottom: 2px dashed #0000ff; padding-bottom: 10px;">
                <div>${parsedNote}</div>
                <button onclick="exportNote(${i})">Export Note ${i+1}</button>
                <button onclick="removeNote(${i})">Remove Note</button>
            </div>`;
    });
    document.getElementById('saved-notes').innerHTML = notesHTML;
}

// Weather descriptions
function getSarcasticDescription(tempC, weatherCode) {
    if (tempC < 0) return 'For ducks sake, are you trying to freeze your ducks off?';
    if (tempC < 10) return 'Duck sweater weather - ducking cold out there!';
    if (tempC < 20) return 'Perfect for a duck picnic, what the duck are you waiting for?';
    if (tempC < 30) return 'Ducks might need sunscreen - ducking hot!';
    return 'Ducks are melting like ice cream - for ducks sake!';
}

function getWindDescription(speed) {
    if (speed < 5) return 'Barely enough to ruffle feathers - ducking calm!';
    if (speed < 15) return 'Ducks might need to lean into it - what the duck?';
    if (speed < 30) return 'Duck flying lessons included - for ducks sake!';
    return 'Duck tornado warning - ducking windy!';
}

function getHumidityDescription(humidity) {
    if (humidity < 30) return 'Ducks getting thirsty - ducking dry!';
    if (humidity < 60) return 'Comfortable for ducks - what the duck?';
    return 'Ducks might grow gills soon - for ducks sake!';
}

function saveNote() {
    const note = document.getElementById('note-input').value;
    if (!note.trim()) return;
    let notes = JSON.parse(localStorage.getItem('ducks-sake-notes') || '[]');
    notes.push(note);
    localStorage.setItem('ducks-sake-notes', JSON.stringify(notes));
    
    let notesHTML = '';
    notes.forEach((n, i) => {
        const rawNote = n;
const parsedNote = (() => { try { return marked.parse(rawNote) } catch(e) { return rawNote } })();
            notesHTML += `<div style="margin-bottom: 15px; border-bottom: 2px dashed #0000ff; padding-bottom: 10px;">
                <div>${parsedNote}</div>
                <button onclick="exportNote(${i})">Export Note ${i+1}</button>
                <button onclick="removeNote(${i})">Remove Note</button>
            </div>`;
    });
    document.getElementById('saved-notes').innerHTML = notesHTML;
}

function exportNote(index = null) {
    const notes = JSON.parse(localStorage.getItem('ducks-sake-notes') || '[]');
    let noteContent;
    if (index !== null) {
        noteContent = marked.parse(notes[index]); // Parse single note
    } else {
        // Parse all notes and join them with a separator
        noteContent = notes.map(note => marked.parse(note)).join('<hr style="border-top: 3px dashed #bbb;">'); 
    }
    const blob = new Blob([noteContent], {type: 'text/html'}); // Change type to text/html
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    a.download = index !== null 
        ? `your_emotional_dump_(${year}_version_final_${month}${day}_${hours}${minutes}).html` // Change extension to .html
        : `all_your_problems_(${year}_edition_final_final).html`; // Change extension to .html
    a.click();
    URL.revokeObjectURL(url);
}

// Duck Mode functionality
function toggleDuckMode() {
    document.body.classList.toggle('duck-dark-mode');
    const widgets = document.querySelectorAll('.widget');
    const buttons = document.querySelectorAll('button');
    const footer = document.querySelector('footer');
    
    if (document.body.classList.contains('duck-dark-mode')) {
        // Dark mode styles
        document.body.style.backgroundColor = '#222222';
        document.body.style.color = '#ffffff';
        widgets.forEach(widget => {
            widget.style.backgroundColor = '#333333';
            widget.style.borderColor = '#ff9900';
        });
        buttons.forEach(btn => {
            btn.style.backgroundColor = '#ff9900';
            btn.style.borderColor = '#ffffff';
            btn.style.color = '#000000';
        });
        footer.style.backgroundColor = '#333333';
        footer.style.borderColor = '#ff9900';
        // Update news links color for dark mode
        document.querySelectorAll('#news-data a').forEach(link => {
            link.style.color = document.body.classList.contains('duck-dark-mode') ? '#ff9900' : '#0000ff';
            link.style.textDecoration = 'underline wavy';
        });
        document.querySelectorAll('footer a').forEach(link => {
            link.style.color = '#ff9900';
        });
        document.querySelectorAll('#news-data div[style*="border-bottom"]').forEach(div => {
            div.style.borderBottom = '1px dashed #ff9900';
        });
        // Update note preview border color for dark mode
        document.getElementById('note-preview').style.borderColor = '#ff9900';
    } else {
        // Light mode styles
        document.body.style.backgroundColor = '#ff00ff';
        document.body.style.color = '#00ff00';
        widgets.forEach(widget => {
            widget.style.backgroundColor = '#ffff00';
            widget.style.borderColor = '#0000ff';
        });
        buttons.forEach(btn => {
            btn.style.backgroundColor = '#00ffff';
            btn.style.borderColor = '#ff0000';
            btn.style.color = '#000000';
        });
        footer.style.backgroundColor = '#ffff00';
        footer.style.borderColor = '#ff00ff';
    }
}

// News functionality with caching and fallbacks
const NEWS_CACHE_TIME = 3600000; // 1 hour
const RSS_FEEDS = {
    general: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
    business: 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml',
    entertainment: 'https://rss.nytimes.com/services/xml/rss/nyt/Arts.xml',
    health: 'https://rss.nytimes.com/services/xml/rss/nyt/Health.xml',
    science: 'https://rss.nytimes.com/services/xml/rss/nyt/Science.xml',
    sports: 'https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml',
    technology: 'http://feeds.bbci.co.uk/news/technology/rss.xml'
};

async function fetchNews(category = 'general') {
    try {
        const cacheKey = `ducks-news-${category}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < NEWS_CACHE_TIME) {
                displayNews(data);
                return;
            }
        }

        // Try NYTimes API first
        const apiResponse = await fetch(
            `https://api.nytimes.com/svc/topstories/v2/${category}.json?api-key=${window.NEWS_API_KEY}`
        );
        
        if (!apiResponse.ok) throw new Error('API failed');
        const apiData = await apiResponse.json();
        const cleanData = apiData.results.slice(0, 7).map(item => ({
            title: item.title,
            url: item.url,
            abstract: item.abstract,
            date: item.published_date
        }));
        
        localStorage.setItem(cacheKey, JSON.stringify({
            data: cleanData,
            timestamp: Date.now()
        }));
        displayNews(cleanData);
    } catch (apiError) {
        console.log('API failed, trying RSS fallback');
        try {
            const rssResponse = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${RSS_FEEDS[category]}`);
            const rssData = await rssResponse.json();
            displayNews(rssData.items.slice(0, 5));
        } catch (rssError) {
            displayNewsError(`Duck news failure: ${rssError.message}`);
        }
    }
}

function displayNews(items) {
    const newsHTML = items.map((item, index) => `
        <div class="news-item" style="transform: rotate(${index % 2 ? '-' : ''}1deg);">
            <a href="${item.url}" class="news-title" target="_blank">
                ${item.title || 'Untitled News'}
            </a>
            ${item.abstract ? `<div class="news-description">${item.abstract}</div>` : ''}
            <div class="news-meta">
                ${item.date ? new Date(item.date).toLocaleDateString() : ''}
            </div>
        </div>
    `).join('');
    
    document.getElementById('news-data').innerHTML = newsHTML;
}

function displayNewsError(message) {
    document.getElementById('news-data').innerHTML = `
        <div class="error-message">
            🦆 QUACK! ${message}<br>
            Try refreshing or check your internet connection!
        </div>
    `;
}

let currentCategory = 'general';

function handleCategoryClick(category, event) {
    document.querySelectorAll('.news-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    currentCategory = category;
    fetchNews();
}

// News functionality
async function fetchNews() {
    try {
        document.getElementById('news-data').innerHTML = '<div class="loading-message">🦆 Ducking through news...</div>';
        const response = await fetch(`https://newsapi.org/v2/top-headlines?country=us&category=${currentCategory}&pageSize=5&apiKey=${window.NEWS_API_KEY}`);
        const data = await response.json();
        
        let newsHTML = '<div class="news-list-header">Latest Quacks in ' + currentCategory.toUpperCase() + '</div>';
        newsHTML += '<ul class="news-list">';
        data.articles.slice(0, 5).forEach(article => {
            newsHTML += `<li style="margin-bottom: 15px; border-bottom: 1px dashed #ff9900; padding-bottom: 10px;">
                <a href="${article.url}" target="_blank" style="color: #0000ff; text-decoration: underline wavy;">
                    ${article.title}
                </a>
                <p>${article.description || ''}</p>
            </li>`;
        });
        newsHTML += '</ul>';
        document.getElementById('news-data').innerHTML = newsHTML;
    } catch (error) {
        document.getElementById('news-data').innerHTML = 
            `<div class="error-message">Quack! News retrieval failed: ${error.message}</div>`;
    }
}

// Auto-load news on page load
window.addEventListener('load', () => {
    document.querySelector('.news-btn').classList.add('active');
    fetchNews();
    setInterval(fetchNews, 300000); // 5min refresh
});

// Duck Mode toggle
function toggleDuckMode() {
    document.body.classList.toggle('duck-dark-mode');
    const widgets = document.querySelectorAll('.widget');
    const buttons = document.querySelectorAll('button');
    const footer = document.querySelector('footer');
    
    if (document.body.classList.contains('duck-dark-mode')) {
        // Dark mode styles
        document.body.style.backgroundColor = '#222222';
        document.body.style.color = '#ffffff';
        widgets.forEach(widget => {
            widget.style.backgroundColor = '#333333';
            widget.style.borderColor = '#ff9900';
        });
        buttons.forEach(btn => {
            btn.style.backgroundColor = '#ff9900';
            btn.style.borderColor = '#ffffff';
            btn.style.color = '#000000';
        });
        footer.style.backgroundColor = '#333333';
        footer.style.borderColor = '#ff9900';
        // Update news links color for dark mode
        document.querySelectorAll('#news-data a').forEach(link => {
            link.style.color = document.body.classList.contains('duck-dark-mode') ? '#ff9900' : '#0000ff';
            link.style.textDecoration = 'underline wavy';
        });
        document.querySelectorAll('footer a').forEach(link => {
            link.style.color = '#ff9900';
        });
        document.querySelectorAll('#news-data div[style*="border-bottom"]').forEach(div => {
            div.style.borderBottom = '1px dashed #ff9900';
        });
        // Update note preview border color for dark mode
        document.getElementById('note-preview').style.borderColor = '#ff9900';
    } else {
        // Light mode styles
        document.body.style.backgroundColor = '#ff00ff';
        document.body.style.color = '#00ff00';
        widgets.forEach(widget => {
            widget.style.backgroundColor = '#ffff00';
            widget.style.borderColor = '#0000ff';
        });
        buttons.forEach(btn => {
            btn.style.backgroundColor = '#00ffff';
            btn.style.borderColor = '#ff0000';
            btn.style.color = '#000000';
        });
        footer.style.backgroundColor = '#ffff00';
        footer.style.borderColor = '#ff00ff';
    }
}

// Load saved note on page load
window.onload = function() {
    const savedNotes = JSON.parse(localStorage.getItem('ducks-sake-notes') || '[]').filter(n => n.trim());
    if (savedNotes.length > 0) {
        let notesHTML = '';
        savedNotes.forEach((n, i) => {
            const rawNote = n;
const parsedNote = (() => { try { return marked.parse(rawNote) } catch(e) { return rawNote } })();
                notesHTML += '<div style="margin-bottom: 15px; border-bottom: 2px dashed #0000ff; padding-bottom: 10px;">'
                    + '<div>' + parsedNote + '</div>'
                    + `<button onclick="exportNote(${i})">Export Note ${i+1}</button>`
                    + `<button onclick="removeNote(${i})">Remove Note</button>`
                    + '</div>';
        });
        document.getElementById('saved-notes').innerHTML = notesHTML;
    }
}