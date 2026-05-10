// Initialize the map
let map;
let allCountries = [];
let currentLayer = null;
let currentHighlighted = null;
let countryNameToCode = {};

// Base API path
const API_BASE = '/api';

// Event listeners
document.getElementById('searchInput').addEventListener('keypress', function(e) 
{
    if (e.key === 'Enter') 
    {
        searchCountry();
    }
});

// Load country name to code mapping
async function loadCountryCodes() 
{
    try 
    {
        const response = await fetch('data/country_codes.json');
        countryNameToCode = await response.json();
    } 
    catch (error) 
    {
        console.error('Failed to load country codes:', error);
    }
}

// Initialize map
function initMap() 
{
    map = L.map('map').setView([20, 0], 2);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', 
    {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
        minZoom: 2
    }).addTo(map);
    
    fetchWorldMapData();
}

// Fetch world map data
async function fetchWorldMapData() 
{
    try 
    {
        const response = await fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson');
        const worldData = await response.json();
        
        currentLayer = L.geoJSON(worldData, 
        {
            style: 
            {
                color: '#333',
                weight: 1,
                fillColor: '#c3e0f0',
                fillOpacity: 0.7
            },
            onEachFeature: onEachFeature
        }).addTo(map);
        
        console.log('Map loaded successfully!');
    } 
    catch (error) 
    {
        console.error('Error loading map data:', error);
        document.getElementById('map').innerHTML = '<div style="padding: 20px; text-align: center; color: red">Error loading map. Please check your internet connection.</div>';
    }
}

// Handle click on a country
function onEachFeature(feature, layer) 
{
    let countryName = feature.properties?.ADMIN || feature.properties?.name || feature.properties?.NAME;
    
    if (countryName) 
    {
        layer.bindTooltip(countryName, { sticky: true });
        
        layer.on({
            click: async (e) => 
            {
                if (currentHighlighted) 
                {
                    currentHighlighted.setStyle({
                        fillColor: '#c3e0f0',
                        fillOpacity: 0.7,
                        weight: 1,
                        color: '#333'
                    });
                }
                
                e.target.setStyle({
                    fillColor: '#ff6b6b',
                    fillOpacity: 0.8,
                    weight: 2,
                    color: '#ff0000'
                });
                
                currentHighlighted = e.target;
                const countryCode = getCountryCode(countryName);
                await getCountryInfo(countryCode, countryName);
                document.getElementById('infoPanel').style.display = 'block';
            },
            
            mouseover: (e) => 
            {
                e.target.setStyle({
                    fillColor: '#90caf9',
                    fillOpacity: 0.8
                });
            },
            
            mouseout: (e) => 
            {
                if (e.target !== currentHighlighted) 
                {
                    e.target.setStyle({
                        fillColor: '#c3e0f0',
                        fillOpacity: 0.7
                    });
                }
            }
        });
    }
}

// Get country code from name
function getCountryCode(countryName) 
{
    if (countryNameToCode[countryName]) 
    {
        return countryNameToCode[countryName];
    }
    
    for (let [name, code] of Object.entries(countryNameToCode)) 
    {
        if (countryName.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(countryName.toLowerCase())) 
        {
            return code;
        }
    }
    
    return countryName.toUpperCase().substring(0, 3);
}

// Fetch country information from PHP backend
async function getCountryInfo(countryCode, countryName) 
{
    console.log("Country Name from map:", countryName);
    console.log("Converted Country Code:", countryCode);
    
    const infoDiv = document.getElementById('countryInfo');
    infoDiv.innerHTML = '<div class="loading">Loading country information</div>';
    
    try 
    {
        const url = `${API_BASE}/get_country_info.php?code=${countryCode}`;
        console.log("Fetching URL:", url);
        
        const response = await fetch(url);
        console.log("Response status:", response.status);
        
        if (response.ok) 
        {
            const country = await response.json();
            console.log("Country data received:", country);
            displayCountryInfo(country);
        } 
        else 
        {
            console.log("Country not found in database, showing basic info");
            showBasicInfo(countryName);
        }
    } 
    catch (error) 
    {
        console.error('Error fetching country data:', error);
        showBasicInfo(countryName);
    }
}

// Display detailed country information
function displayCountryInfo(country) 
{
    const infoDiv = document.getElementById('countryInfo');
    
    const formattedPopulation = country.population ? parseInt(country.population).toLocaleString() : 'N/A';
    const formattedArea = country.area_km2 ? parseFloat(country.area_km2).toLocaleString() : 'N/A';
    
    infoDiv.innerHTML = `
        <div class="country-detail">
            <h3>${country.common_name || country.official_name}</h3>
            <div class="official-name">${country.official_name || ''}</div>
            
            <div class="info-grid">
                <div class="info-item">
                    <label>🏛️ Capital City</label>
                    <div class="value">${country.capital_city || 'N/A'}</div>
                </div>
                <div class="info-item">
                    <label>👥 Population</label>
                    <div class="value">${formattedPopulation}</div>
                </div>
                <div class="info-item">
                    <label>📐 Area (km²)</label>
                    <div class="value">${formattedArea}</div>
                </div>
                <div class="info-item">
                    <label>💵 Currency</label>
                    <div class="value">${country.currency_name ? `${country.currency_name} (${country.currency_code})` : 'N/A'}</div>
                </div>
                <div class="info-item">
                    <label>🌍 Continent</label>
                    <div class="value">${country.continent || 'N/A'}</div>
                </div>
                <div class="info-item">
                    <label>🗣️ Languages</label>
                    <div class="value">${country.languages || 'N/A'}</div>
                </div>
            </div>
            
            <div class="description">
                <strong>ℹ️ About:</strong><br>
                ${country.description || 'No description available.'}
            </div>
            
            <!-- Travel Status Buttons -->
            <div id="countryStatusButtons"></div>
            
            <!-- Stats Dashboard Button -->
            <div id="statsDashboardButton" style="margin-top: 15px; text-align: center;"></div>
            
            <!-- History Button -->
            <div style="margin-top: 20px; text-align: center;">
                <button onclick="getCountryHistory('${country.country_code}', '${country.common_name || country.official_name}')" 
                        style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                               color: white; 
                               border: none; 
                               padding: 12px 24px; 
                               border-radius: 8px; 
                               cursor: pointer; 
                               font-size: 16px;
                               font-weight: bold;
                               transition: transform 0.2s;
                               width: 100%;">
                    📜 View Full History
                </button>
            </div>
        </div>
    `;
    
    // Load the status buttons for this country
    loadCountryStatusButtons(country.country_code);
    // Load the stats button
    loadStatsButton();
}

// Display basic info when database entry not found
function showBasicInfo(countryName) 
{
    const infoDiv = document.getElementById('countryInfo');
    infoDiv.innerHTML = `
        <div class="country-detail">
            <h3>${countryName}</h3>
            <div class="description">
                <strong>Note:</strong> Information for ${countryName} is not yet available.
            </div>
        </div>
    `;
}

// ============================================
// DEEPSEEK-ONLY HISTORY FUNCTIONS
// ============================================

// Main function to get or generate country history
async function getCountryHistory(countryCode, countryName) 
{
    // Show loading modal immediately
    showHistoryLoadingModal(countryName);
    
    try 
    {
        // Check if history exists in database
        const checkResponse = await fetch(`${API_BASE}/check_history.php?code=${countryCode}`);
        const checkResult = await checkResponse.json();

        if (checkResult.success && checkResult.has_history) 
        {
            // History exists in database - display it
            updateHistoryModal(checkResult.history_html, countryName);
        } 
        else 
        {
            // No history found - generate with DeepSeek streaming
            await generateHistoryWithDeepSeek(countryCode, countryName);
        }
    } 
    catch (error) 
    {
        console.error('Error checking history:', error);
        // Try to generate anyway
        await generateHistoryWithDeepSeek(countryCode, countryName);
    }
}

// Show history modal (update this function)
function showHistoryModal(htmlContent, countryName) 
{
    const modal = document.getElementById('historyModal');
    const content = document.getElementById('historyContent');

    content.innerHTML = `
        <h2>📜 History of ${countryName}</h2>
        ${htmlContent}
    `;
    
    // Scroll to top when opening new content
    const modalBody = modal.querySelector('.modal-body');
    if (modalBody) 
    {
        modalBody.scrollTop = 0;
    }

    modal.classList.add('show');
}

// Show loading modal for history (update this function)
function showHistoryLoadingModal(countryName) 
{
    const modal = document.getElementById('historyModal');
    const content = document.getElementById('historyContent');
    
    content.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <div class="spinner" style="
                border: 4px solid rgba(102, 126, 234, 0.3);
                border-top: 4px solid #667eea;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px;
            "></div>
            <h2 style="color: #667eea;">Generating History for ${countryName}</h2>
            <p style="color: #666;">AI is crafting a comprehensive history...</p>
            <p style="color: #999; font-size: 0.9em;">This may take 30-60 seconds</p>
        </div>
        <style>
            @keyframes spin 
            {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    
    // Scroll to top when opening
    const modalBody = modal.querySelector('.modal-body');
    if (modalBody) 
    {
        modalBody.scrollTop = 0;
    }
    
    modal.classList.add('show');
}

// Update modal with history content (update this function)
function updateHistoryModal(htmlContent, countryName) 
{
    const content = document.getElementById('historyContent');
    
    // Clean the HTML before displaying
    const cleanedHTML = cleanStreamedHTML(htmlContent);
    
    content.innerHTML = `
        <h2>📜 History of ${countryName}</h2>
        <div style="
            background: white;
            padding: 20px;
            border-radius: 8px;
            line-height: 1.8;
            color: #333;
        ">
            ${cleanedHTML}
        </div>
    `;
}

// Stream history generation from DeepSeek (update the streaming setup)
async function generateHistoryWithDeepSeek(countryCode, countryName) 
{
    const content = document.getElementById('historyContent');
    
    // Set up the container with a div for rendered HTML
    content.innerHTML = `
        <h2>📜 History of ${countryName}</h2>
        <div id="streamingHistory" style="
            background: white;
            padding: 20px;
            border-radius: 8px;
            min-height: 200px;
            line-height: 1.8;
            color: #333;
        ">
            <div id="streamingLoader" style="text-align: center; padding: 40px;">
                <div class="spinner" style="
                    border: 4px solid rgba(102, 126, 234, 0.3);
                    border-top: 4px solid #667eea;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                "></div>
                <p style="color: #667eea;">AI is writing the history...</p>
            </div>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    
    try 
    {
        const response = await fetch(`${API_BASE}/deepseek_stream_history.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                country_name: countryName,
                country_code: countryCode
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullHistoryHTML = '';
        let firstChunkReceived = false;

        while (true) 
        {
            const {done, value} = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) 
            {
                if (line.startsWith('data: ')) 
                {
                    const data = line.substring(6);
                    
                    if (data === '[DONE]') 
                    {
                        console.log('History streaming complete!');
                        
                        // Clean up the final HTML
                        fullHistoryHTML = cleanStreamedHTML(fullHistoryHTML);
                        
                        // Render the final clean HTML
                        const streamingDiv = document.getElementById('streamingHistory');
                        if (streamingDiv) {
                            streamingDiv.innerHTML = fullHistoryHTML;
                            streamingDiv.style.padding = '0';
                            streamingDiv.style.background = 'transparent';
                        }
                        
                        // Save to database
                        await saveHistoryToDatabase(countryCode, fullHistoryHTML);
                        return;
                    }
                    
                    try 
                    {
                        const parsed = JSON.parse(data);
                        
                        if (parsed.content) 
                        {
                            // Build up the raw HTML
                            fullHistoryHTML += parsed.content;
                            
                            // Remove loader on first content
                            if (!firstChunkReceived) {
                                const loader = document.getElementById('streamingLoader');
                                if (loader) {
                                    loader.remove();
                                }
                                firstChunkReceived = true;
                            }
                            
                            // Try to render the partial HTML
                            const streamingDiv = document.getElementById('streamingHistory');
                            if (streamingDiv) {
                                // Create a temporary iframe-like rendering
                                const tempDiv = document.createElement('div');
                                tempDiv.innerHTML = cleanStreamedHTML(fullHistoryHTML);
                                streamingDiv.innerHTML = '';
                                streamingDiv.appendChild(tempDiv);
                                
                                // Auto-scroll the modal body to see new content
                                const modalBody = document.querySelector('.modal-body');
                                if (modalBody) {
                                    modalBody.scrollTop = modalBody.scrollHeight;
                                }
                            }
                        }
                        
                        if (parsed.error) 
                        {
                            console.error('Streaming error:', parsed.error);
                            const streamingDiv = document.getElementById('streamingHistory');
                            if (streamingDiv) {
                                streamingDiv.innerHTML = `
                                    <div style="color: red; text-align: center; padding: 20px;">
                                        <strong>Error generating history:</strong><br>
                                        ${parsed.error}<br><br>
                                        <button onclick="getCountryHistory('${countryCode}', '${countryName}')" 
                                                style="background: #667eea; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                                            Retry
                                        </button>
                                    </div>
                                `;
                            }
                        }
                    } 
                    catch (e) 
                    {
                        // Skip non-JSON lines
                        continue;
                    }
                }
            }
        }
    } 
    catch (error) 
    {
        console.error('DeepSeek streaming error:', error);
        const streamingDiv = document.getElementById('streamingHistory');
        if (streamingDiv) 
        {
            streamingDiv.innerHTML = `
                <div style="color: red; text-align: center; padding: 20px;">
                    <strong>Connection Error:</strong><br>
                    Failed to connect to AI service. Please check your internet connection.<br><br>
                    <button onclick="getCountryHistory('${countryCode}', '${countryName}')" 
                            style="background: #667eea; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                        Retry
                    </button>
                </div>
            `;
        }
    }
}

// Close modal (update this function)
function closeHistoryModal() 
{
    const modal = document.getElementById('historyModal');
    modal.classList.remove('show');
    
    // Optional: Clear content when closing to free memory
    setTimeout(() => {
        if (!modal.classList.contains('show')) {
            document.getElementById('historyContent').innerHTML = '';
        }
    }, 300);

    console.log("Modal closed");
}

// Close modal with Escape key (add this new function)
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('historyModal');
        if (modal.classList.contains('show')) {
            closeHistoryModal();
        }
    }
});

// Close modal when clicking outside (add this new function)
document.addEventListener('click', function(e) {
    const modal = document.getElementById('historyModal');
    if (e.target === modal) {
        closeHistoryModal();
    }
});

// Helper function to clean streaming HTML artifacts
function cleanStreamedHTML(html) 
{
    // Remove any accidental markdown code blocks
    html = html.replace(/^```html\s*/i, '');
    html = html.replace(/\s*```$/i, '');
    
    // If the HTML is missing opening tags, wrap it properly
    if (!html.includes('<!DOCTYPE html>') && !html.includes('<html')) 
    {
        // It's likely partial HTML - we want to keep it as-is for streaming
        return html;
    }
    
    // Extract just the body content if it's a complete HTML document
    // This prevents nested <html> tags when inserting into the modal
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) 
    {
        // Also grab the style from head if present
        const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
        let cleanedHTML = '';
        
        if (styleMatch) 
        {
            cleanedHTML += `<style>${styleMatch[1]}</style>`;
        }
        
        cleanedHTML += bodyMatch[1];
        return cleanedHTML;
    }
    
    return html;
}

// Save generated history to database
async function saveHistoryToDatabase(countryCode, historyHTML) 
{
    try 
    {
        const response = await fetch(`${API_BASE}/save_deepseek_history.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                country_code: countryCode,
                history_html: historyHTML
            })
        });
        
        const result = await response.json();
        
        if (result.success) 
        {
            console.log('History saved to database successfully');
        } 
        else 
        {
            console.error('Failed to save history:', result.error);
        }
        
        return result;
    } 
    catch (error) 
    {
        console.error('Error saving history:', error);
        return { success: false, error: error.message };
    }
}

// Search for a country using the search button
async function searchCountry() 
{
    const searchTerm = document.getElementById('searchInput').value.trim();
    if (!searchTerm) return;
    
    try 
    {
        const response = await fetch(`${API_BASE}/search.php?q=${encodeURIComponent(searchTerm)}`);
        const results = await response.json();
        
        if (results.length > 0) 
        {
            if (results.length === 1) 
            {
                findAndClickCountry(results[0].common_name);
            } 
            else 
            {
                showSearchResults(results);
            }
        } 
        else 
        {
            findAndClickCountry(searchTerm);
        }
    } 
    catch (error) 
    {
        console.error('Search error:', error);
        findAndClickCountry(searchTerm);
    }
}

// Find and click a country on the map
function findAndClickCountry(countryName) 
{
    let found = false;
    
    if (currentLayer && currentLayer.eachLayer) 
    {
        currentLayer.eachLayer((layer) => 
        {
            const featureName = layer.feature?.properties?.ADMIN || 
                               layer.feature?.properties?.name || 
                               layer.feature?.properties?.NAME;
            
            if (featureName && featureName.toLowerCase() === countryName.toLowerCase()) 
            {
                layer.fireEvent('click');
                found = true;
                map.fitBounds(layer.getBounds());
            }
        });
    }
    
    if (!found) 
    {
        alert(`Country "${countryName}" not found on the map.`);
    }
}

// Show search results
function showSearchResults(results) 
{
    const infoDiv = document.getElementById('countryInfo');
    let resultsHtml = '<div class="search-results"><h3>📋 Search Results:</h3><ul>';
    
    results.forEach(country => 
    {
        resultsHtml += `<li onclick="findAndClickCountry('${country.common_name}')">
            <strong>${country.common_name}</strong> - ${country.capital_city || 'Capital N/A'}
        </li>`;
    });
    
    resultsHtml += '</ul></div>';
    infoDiv.innerHTML = resultsHtml;
    document.getElementById('infoPanel').style.display = 'block';
}

// Close panel
function closePanel() 
{
    const panel = document.getElementById('infoPanel');
    panel.style.display = 'none';
    
    if (currentHighlighted) {
        currentHighlighted.setStyle({
            fillColor: '#c3e0f0',
            fillOpacity: 0.7,
            weight: 1,
            color: '#333'
        });
        currentHighlighted = null;
    }
}

// ============================================
// AUTHENTICATION
// ============================================

let currentUser = null;

// Check session on page load
async function checkSession() 
{
    try 
    {
        const response = await fetch(`${API_BASE}/auth/check_session.php`);
        const result = await response.json();
        
        if (result.logged_in) 
        {
            currentUser = result.user;
            updateUIForLoggedInUser();
        } 
        else 
        {
            updateUIForLoggedOutUser();
        }
    } 
    catch (error) 
    {
        console.error('Session check failed:', error);
        updateUIForLoggedOutUser();
    }
}

// Update UI based on auth state
function updateUIForLoggedOutUser() 
{
    const authBtn = document.getElementById('authButton');
    if (authBtn) 
    {
        authBtn.textContent = '🔑 Login / Register';
        authBtn.onclick = openAuthModal;
    }
    
    // Show benefits text
    const benefitsText = document.getElementById('authBenefits');
    if (benefitsText) 
    {
        benefitsText.style.display = 'block';
    }
}

function updateUIForLoggedInUser() 
{
    const authBtn = document.getElementById('authButton');
    if (authBtn) 
    {
        authBtn.textContent = `👤 ${currentUser.username}`;
        authBtn.onclick = showUserMenu;
    }
    
    // Hide benefits text since they're already signed up
    const benefitsText = document.getElementById('authBenefits');
    if (benefitsText) 
    {
        benefitsText.style.display = 'none';
    }
}

// Open auth modal
function openAuthModal() 
{
    document.getElementById('authModal').classList.add('show');
    switchAuthForm('login');
    clearAuthMessage();
}

// Close auth modal
function closeAuthModal() 
{
    document.getElementById('authModal').classList.remove('show');
}

// Switch between login and register forms
function switchAuthForm(form) 
{
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authTitle = document.getElementById('authTitle');
    
    if (form === 'register') 
    {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        authTitle.textContent = 'Join Maptory';
    } 
    else 
    {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        authTitle.textContent = 'Welcome to Maptory';
    }
    
    clearAuthMessage();
}

// Handle login
async function handleLogin(event) 
{
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try 
    {
        const response = await fetch(`${API_BASE}/auth/login.php`, 
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const result = await response.json();
        
        if (result.success) 
        {
            currentUser = result.user;
            closeAuthModal();
            updateUIForLoggedInUser();
            
            // Refresh the info panel if a country is currently displayed
            refreshInfoPanelAfterAuth();
        } 
        else 
        {
            showAuthMessage(result.error, 'error');
        }
    } 
    catch (error) 
    {
        showAuthMessage('Login failed. Please try again.', 'error');
    }
}

// Handle register
async function handleRegister(event) 
{
    event.preventDefault();
    
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    
    try 
    {
        const response = await fetch(`${API_BASE}/auth/register.php`, 
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        
        const result = await response.json();
        
        if (result.success) 
        {
            currentUser = result.user;
            closeAuthModal();
            updateUIForLoggedInUser();
            
            // Refresh the info panel if a country is currently displayed
            refreshInfoPanelAfterAuth();
        } 
        else 
        {
            showAuthMessage(result.error, 'error');
        }
    } 
    catch (error) 
    {
        showAuthMessage('Registration failed. Please try again.', 'error');
    }
}

// Refresh the info panel after login/register to update status buttons
function refreshInfoPanelAfterAuth() 
{
    // Check if there's a country currently displayed
    const countryDetail = document.querySelector('.country-detail');
    if (!countryDetail) return;
    
    // Grab the country code from the existing panel
    const historyButton = countryDetail.querySelector('button[onclick*="getCountryHistory"]');
    if (!historyButton) return;
    
    const onclickAttr = historyButton.getAttribute('onclick');
    const match = onclickAttr.match(/getCountryHistory\('([^']+)'/);
    if (match) 
    {
        const countryCode = match[1];
        // Reload the status buttons and stats button with new auth state
        loadCountryStatusButtons(countryCode);
        loadStatsButton();
    }
}

// Handle logout
async function handleLogout() 
{
    try 
    {
        await fetch(`${API_BASE}/auth/logout.php`);
        currentUser = null;
        updateUIForLoggedOutUser();
        clearInfoPanel();
        resetMapHighlights();
    } 
    catch (error) 
    {
        console.error('Logout failed:', error);
    }
}

// Show message in auth modal
function showAuthMessage(message, type) 
{
    const msgDiv = document.getElementById('authMessage');
    msgDiv.textContent = message;
    msgDiv.style.display = 'block';
    msgDiv.style.backgroundColor = type === 'error' ? '#ffe0e0' : '#e0ffe0';
    msgDiv.style.color = type === 'error' ? '#cc0000' : '#006600';
    msgDiv.style.border = `1px solid ${type === 'error' ? '#ffcccc' : '#ccffcc'}`;
}

function clearAuthMessage() 
{
    document.getElementById('authMessage').style.display = 'none';
}

// Show user menu (for logged in users)
function showUserMenu() 
{
    if (confirm(`${currentUser.username}, would you like to logout?`)) 
    {
        handleLogout();
    }
}

// Initialize the map when page loads
window.addEventListener('load', () => 
{
    initMap();
    loadCountryCodes();
    checkSession();
    updateShareLinks();
});

// ============================================
// USER COUNTRY STATUS (VISITED / WANT TO VISIT)
// ============================================

// Fetch and display status buttons for a country
async function loadCountryStatusButtons(countryCode) {
    const statusContainer = document.getElementById('countryStatusButtons');
    if (!statusContainer) return;
    
    if (!currentUser) {
        statusContainer.innerHTML = `
            <p style="color: #888; font-size: 0.9em; text-align: center; margin-top: 15px;">
                <a href="#" onclick="openAuthModal(); return false;" style="color: #667eea;">Login</a> 
                to track countries you've visited or want to visit.
            </p>
        `;
        return;
    }
    
    try {
        // Include user_id as fallback
        const url = `${API_BASE}/user_countries/get_status.php?code=${countryCode}&user_id=${currentUser.id}`;
        
        const response = await fetch(url, {
            credentials: 'include' // Send cookies
        });
        
        const result = await response.json();
        
        if (result.success) {
            const isVisited = result.statuses.includes('visited');
            const isWantToVisit = result.statuses.includes('want_to_visit');
            
            statusContainer.innerHTML = `
                <div style="margin-top: 15px; display: flex; gap: 10px;">
                    <button onclick="toggleCountryStatus('${countryCode}', 'visited', ${isVisited})" 
                            class="status-btn ${isVisited ? 'status-active-visited' : ''}">
                        ✅ ${isVisited ? 'Visited' : 'Mark Visited'}
                    </button>
                    <button onclick="toggleCountryStatus('${countryCode}', 'want_to_visit', ${isWantToVisit})" 
                            class="status-btn ${isWantToVisit ? 'status-active-want' : ''}">
                        🎯 ${isWantToVisit ? 'On List' : 'Want to Visit'}
                    </button>
                </div>
            `;
        } else {
            console.log('API returned error:', result.error);
        }
    } catch (error) {
        console.error('Failed to load country status:', error);
    }
}

// Toggle a country status (add or remove)
async function toggleCountryStatus(countryCode, status, currentlyActive) {
    if (!currentUser) {
        openAuthModal();
        return;
    }
    
    const action = currentlyActive ? 'remove' : 'add';
    
    try {
        const response = await fetch(`${API_BASE}/user_countries/set_status.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ 
                user_id: currentUser.id,  // Include user_id as fallback
                country_code: countryCode, 
                status: status, 
                action: action 
            })
        });
        
        const result = await response.json();
        console.log('Toggle result:', result);
        
        if (result.success) {
            // Refresh the buttons
            loadCountryStatusButtons(countryCode);
        }
    } catch (error) {
        console.error('Failed to update country status:', error);
    }
}

// ============================================
// USER STATS DASHBOARD
// ============================================

// Open stats modal
async function openStatsModal() 
{
    if (!currentUser) 
    {
        openAuthModal();
        return;
    }
    
    const modal = document.getElementById('statsModal');
    const content = document.getElementById('statsContent');
    
    content.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <div class="spinner" style="
                border: 4px solid rgba(102, 126, 234, 0.3);
                border-top: 4px solid #667eea;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px;
            "></div>
            <p style="color: #667eea;">Loading your travel stats...</p>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    
    modal.classList.add('show');
    
    try 
    {
        const response = await fetch(`${API_BASE}/user_countries/get_stats.php?user_id=${currentUser.id}`, 
        {
            credentials: 'include'
        });
        const result = await response.json();
        
        if (result.success) 
        {
            displayStats(result.stats);
        }
    } 
    catch (error) 
    {
        content.innerHTML = '<p style="color: red; text-align: center;">Failed to load stats.</p>';
    }
}

// Display stats in modal
function displayStats(stats) 
{
    const content = document.getElementById('statsContent');
    
    let visitedHTML = '';
    let wantToVisitHTML = '';
    
    if (stats.visited.length > 0) 
    {
        visitedHTML = `
            <h3>✅ Visited (${stats.visited_count})</h3>
            <div class="stats-grid">
                ${stats.visited.map(c => `
                    <div class="stats-country-card" onclick="findAndClickCountry('${c.country_name}')">
                        <span class="stats-country-name">${c.country_name}</span>
                    </div>
                `).join('')}
            </div>
        `;
    } 
    else 
    {
        visitedHTML = '<p style="color: #888; text-align: center;">No countries marked as visited yet.</p>';
    }
    
    if (stats.want_to_visit.length > 0) 
    {
        wantToVisitHTML = `
            <h3>🎯 Want to Visit (${stats.want_to_visit_count})</h3>
            <div class="stats-grid">
                ${stats.want_to_visit.map(c => `
                    <div class="stats-country-card" onclick="findAndClickCountry('${c.country_name}')">
                        <span class="stats-country-name">${c.country_name}</span>
                    </div>
                `).join('')}
            </div>
        `;
    } 
    else 
    {
        wantToVisitHTML = '<p style="color: #888; text-align: center;">No countries on your wishlist yet.</p>';
    }
    
    content.innerHTML = `
        <div class="stats-summary">
            <div class="stats-box visited-box">
                <span class="stats-number">${stats.visited_count}</span>
                <span class="stats-label">Visited</span>
            </div>
            <div class="stats-box wish-box">
                <span class="stats-number">${stats.want_to_visit_count}</span>
                <span class="stats-label">Want to Visit</span>
            </div>
            <div class="stats-box total-box">
                <span class="stats-number">${stats.total_count}</span>
                <span class="stats-label">Total</span>
            </div>
        </div>
        
        <div style="margin-top: 30px;">
            ${visitedHTML}
        </div>
        
        <div style="margin-top: 30px;">
            ${wantToVisitHTML}
        </div>
        
        <p style="text-align: center; color: #888; font-size: 0.85em; margin-top: 30px;">
            Click on any country to see it on the map
        </p>
    `;
}

// Load the stats dashboard button
function loadStatsButton() 
{
    const container = document.getElementById('statsDashboardButton');
    if (!container) return;
    
    if (!currentUser) 
    {
        container.innerHTML = `
            <button onclick="openAuthModal()" 
                    style="width: 100%; padding: 10px; background: #f5f5f5; border: 1px dashed #ccc; 
                           border-radius: 8px; cursor: pointer; font-size: 0.9em; color: #888;">
                📊 Login to see your travel stats
            </button>
        `;
        return;
    }
    
    container.innerHTML = `
        <button onclick="openStatsModal()" 
                style="width: 100%; padding: 10px; 
                       background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); 
                       border: 1px solid #dee2e6; border-radius: 8px; 
                       cursor: pointer; font-size: 0.9em; font-weight: 500;
                       color: #495057; transition: all 0.2s;">
            📊 Your Travel Stats
        </button>
    `;
}

// Close stats modal
function closeStatsModal() 
{
    document.getElementById('statsModal').classList.remove('show');
}

// Clear the info panel back to placeholder state
function clearInfoPanel() 
{
    const infoDiv = document.getElementById('countryInfo');
    infoDiv.innerHTML = '<p class="placeholder">Click on any country to see its details here!</p>';
    
    // Also reset the panel title
    const panelHeader = document.querySelector('.info-header h2');
    if (panelHeader) 
    {
        panelHeader.textContent = 'Country Information';
    }
}

// Reset any highlighted country on the map
function resetMapHighlights() 
{
    if (currentHighlighted) 
    {
        currentHighlighted.setStyle({
            fillColor: '#c3e0f0',
            fillOpacity: 0.7,
            weight: 1,
            color: '#333'
        });
        currentHighlighted = null;
    }
}

// ============================================
// SHARE FUNCTIONALITY
// ============================================

// Update share links with current URL
function updateShareLinks() 
{
    const currentUrl = encodeURIComponent(window.location.href);
    const title = encodeURIComponent('Maptory — Every country has a story');
    
    const fbLink = document.getElementById('shareFacebook');
    const xLink = document.getElementById('shareTwitter');
    const emailLink = document.getElementById('shareEmail');
    
    if (fbLink) fbLink.href = `https://www.facebook.com/sharer.php?u=${currentUrl}`;
    if (xLink) xLink.href = `https://x.com/intent/post?url=${currentUrl}&text=${title}`;
    if (emailLink) emailLink.href = `mailto:?subject=${title}&body=Check out Maptory: ${currentUrl}`;
}

// Copy link to clipboard
function copyMaptoryLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        alert('Link copied to clipboard!');
    }).catch(() => {
        prompt('Copy this link:', window.location.href);
    });
}