function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        origin: params.get("origin"),
        destination: params.get("destination"),
        date: params.get("date"),
        returnDate: params.get("returnDate") || "",
        adults: params.get("adults") || 1
    };
}

function handleFormSubmit(event) {
    event.preventDefault();

    const origin = document.getElementById("origin").value;
    const destination = document.getElementById("destination").value;
    const date = document.getElementById("date").value;
    const returnDate = document.getElementById("returnDate").value;
    const adults = document.getElementById("adults").value;

    searchFlights({ origin, destination, date, returnDate, adults });
}

async function searchFlights(data) {
    document.getElementById("loading").style.display = "block";
    document.getElementById("results").innerHTML = "";

    try {
        const response = await fetch("http://127.0.0.1:5000/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const flights = await response.json();
        document.getElementById("loading").style.display = "none";

        displayFlights(flights);
    } catch (error) {
        document.getElementById("loading").style.display = "none";
        document.getElementById("results").innerHTML = `<p>Error loading flights.</p>`;
    }
}

async function loadFlights() {
    const data = getQueryParams();

    // Only load flights if we have query params
    if (data.origin && data.destination && data.date) {
        searchFlights(data);
    }
}

function displayFlights(flights) {
    const resultsDiv = document.getElementById("results");

    if (!flights || flights.length === 0) {
        resultsDiv.innerHTML = `<p>No flights found. Try different search criteria.</p>`;
        return;
    }

    resultsDiv.innerHTML = flights.map(flight => `
        <div class="flight-card">
            <h3>${flight.airline}</h3>
            <p>${flight.origin} → ${flight.destination}</p>
            <p>${flight.departureTime} - ${flight.arrivalTime}</p>
            <p><b>${flight.price}</b></p>
            <button>Book Now</button>
        </div>
    `).join('');
}

window.onload = loadFlights;
