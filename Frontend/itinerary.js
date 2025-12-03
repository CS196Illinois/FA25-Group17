// Global state
const API_BASE_URL = 'http://127.0.0.1:5000';
const USER_ID = 'default_user';
let itinerary = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadItinerary();
});

// Load itinerary from backend
async function loadItinerary() {
    try {
        const response = await fetch(`${API_BASE_URL}/itinerary?user_id=${USER_ID}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const data = await response.json();

        if (data.success) {
            itinerary = data.itinerary;
            displayItinerary(itinerary);
        } else {
            console.error('Failed to load itinerary:', data.error);
            displayEmptyState();
        }

    } catch (error) {
        console.error('Error loading itinerary:', error);
        displayEmptyState();
    }
}

// Display itinerary items
function displayItinerary(items) {
    const container = document.getElementById('itineraryContainer');

    if (!items || items.length === 0) {
        displayEmptyState();
        return;
    }

    container.innerHTML = `
        <div class="itinerary-header">
            <h2>My Travel Itinerary</h2>
            <p>${items.length} attraction${items.length === 1 ? '' : 's'} saved</p>
        </div>
        <div class="itinerary-list">
            ${items.map((item, index) => createItineraryItemHTML(item, index)).join('')}
        </div>
    `;
}

// Create HTML for a single itinerary item
function createItineraryItemHTML(item, index) {
    const isFree = item.ticket_price && item.ticket_price.toLowerCase().includes('free');

    return `
        <div class="itinerary-item-card" style="animation-delay: ${index * 0.1}s">
            <div class="itinerary-item-header">
                <h3>${item.name}</h3>
                <button class="remove-btn" onclick="removeFromItinerary('${item.name.replace(/'/g, "\\'")}')">
                    Remove
                </button>
            </div>
            <div class="itinerary-item-body">
                <p class="description">${item.description || 'No description available'}</p>

                <div class="details">
                    <div class="detail-row">
                        <span class="icon">📍</span>
                        <span>${item.address || 'Address not available'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="icon">🕒</span>
                        <span>${item['opening-hours'] || 'Hours not available'}</span>
                    </div>
                    <div class="detail-row ${isFree ? 'free' : ''}">
                        <span class="icon">💰</span>
                        <span>${item.ticket_price || 'Price not available'}</span>
                    </div>
                </div>

                ${item.website_url ? `
                    <div class="website">
                        <a href="${item.website_url}" target="_blank">Visit Website →</a>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Display empty state
function displayEmptyState() {
    const container = document.getElementById('itineraryContainer');
    container.innerHTML = `
        <div class="empty-state">
            <h2>Your Itinerary is Empty</h2>
            <p>Start planning your trip by adding attractions!</p>
            <a href="attractions.html" class="btn-primary">Find Attractions</a>
        </div>
    `;
}

// Remove item from itinerary
async function removeFromItinerary(attractionName) {
    if (!confirm(`Remove "${attractionName}" from your itinerary?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/itinerary`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: USER_ID,
                attraction_name: attractionName
            })
        });

        const data = await response.json();

        if (data.success) {
            // Reload itinerary
            await loadItinerary();
            alert(`✓ Removed "${attractionName}" from your itinerary`);
        } else {
            alert(`Failed to remove: ${data.error}`);
        }

    } catch (error) {
        console.error('Error removing from itinerary:', error);
        alert('Failed to remove from itinerary. Please make sure the backend is running.');
    }
}
