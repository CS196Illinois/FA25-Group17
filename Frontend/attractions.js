// Global state
let attractions = [];
const API_BASE_URL = 'http://127.0.0.1:5000';
const USER_ID = 'default_user'; // In production, use actual user authentication

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  // Show welcome message
  addMessageToChat(`Hello! I'm your travel assistant. Ask me about attractions, museums, night markets, or any activities you'd like to explore!`, 'bot');
});

// Handle enter key press in input
function handleKeyPress(event) {
  if (event.key === 'Enter') {
    sendMessage();
  }
}

// Send user message
async function sendMessage() {
  const input = document.getElementById('userInput');
  const message = input.value.trim();

  if (!message) return;

  // Display user message
  addMessageToChat(message, 'user');

  // Clear input
  input.value = '';

  // Show loading message
  addMessageToChat('Let me find some great attractions for you...', 'bot');

  // Call backend API to get attractions
  try {
    const response = await fetch(`${API_BASE_URL}/chat/attractions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
      })
    });

    const data = await response.json();

    if (data.success && data.attractions.length > 0) {
      attractions = data.attractions;

      const chatMessages = document.getElementById('chatMessages');
      chatMessages.removeChild(chatMessages.lastChild);

      addMessageToChat(`I found ${data.count} amazing attractions for you!`, 'bot');

      displayAttractions(attractions);
    } else {
      const chatMessages = document.getElementById('chatMessages');
      chatMessages.removeChild(chatMessages.lastChild);

      addMessageToChat('Sorry, I couldn\'t find any attractions matching your request. Try asking differently!', 'bot');
    }

  } catch (error) {
    console.error('Error fetching attractions:', error);

    const chatMessages = document.getElementById('chatMessages');
    chatMessages.removeChild(chatMessages.lastChild);

    addMessageToChat('Sorry, I\'m having trouble connecting to the server. Please make sure the backend is running at http://127.0.0.1:5000', 'bot');
  }
}

function addMessageToChat(text, sender) {
  const chatMessages = document.getElementById('chatMessages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}-message`;

  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';

  const p = document.createElement('p');
  p.textContent = text;

  contentDiv.appendChild(p);
  messageDiv.appendChild(contentDiv);
  chatMessages.appendChild(messageDiv);

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// This function is no longer needed as we're using the backend API
// Kept for reference if needed for offline mode later

// Display attractions as cards
function displayAttractions(attractionsList) {
  const container = document.getElementById('attractionsContainer');
  container.innerHTML = ''; // Clear existing cards

  attractionsList.forEach((attraction, index) => {
    const card = createAttractionCard(attraction, index);
    container.appendChild(card);
  });
}

// Create individual attraction card
function createAttractionCard(attraction, index) {
  const card = document.createElement('div');
  card.className = 'attraction-card';
  card.style.animationDelay = `${index * 0.1}s`;

  const isFree = attraction.ticket_price.toLowerCase().includes('free');

  card.innerHTML = `
    <div class="attraction-card-header">
      <h3>${attraction.name}</h3>
    </div>
    <div class="attraction-card-body">
      <p class="attraction-description">${attraction.description}</p>

      <div class="attraction-details">
        <div class="detail-item">
          <span class="detail-icon">📍</span>
          <span class="detail-text">${attraction.address}</span>
        </div>
        <div class="detail-item">
          <span class="detail-icon">🕒</span>
          <span class="detail-text">${attraction['opening-hours']}</span>
        </div>
      </div>

      <div class="attraction-price ${isFree ? 'free' : ''}">
        💰 ${attraction.ticket_price}
      </div>
    </div>
    <div class="attraction-footer">
      <a href="${attraction.website_url}" target="_blank" class="visit-website">Visit Website</a>
      <button class="add-to-itinerary" onclick="addToItinerary('${attraction.name.replace(/'/g, "\\'")}')">
        Add to Trip
      </button>
    </div>
  `;

  return card;
}

// Add attraction to itinerary
async function addToItinerary(attractionName) {
  // Find the full attraction object
  const attraction = attractions.find(a => a.name === attractionName);

  if (!attraction) {
    alert('Attraction not found!');
    return;
  }

  try {
    // Send to backend
    const response = await fetch(`${API_BASE_URL}/itinerary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: USER_ID,
        attraction: attraction
      })
    });

    const data = await response.json();

    if (data.success) {
      addMessageToChat(`Added "${attractionName}" to your itinerary!`, 'bot');
      alert(`✓ Added "${attractionName}" to your itinerary!\n\nYou now have ${data.count} attractions saved.`);
    } else {
      if (response.status === 409) {
        alert(`"${attractionName}" is already in your itinerary.`);
      } else {
        alert(`Failed to add: ${data.message || data.error}`);
      }
    }

  } catch (error) {
    console.error('Error adding to itinerary:', error);
    alert('Failed to add to itinerary. Please make sure the backend is running.');
  }
}
