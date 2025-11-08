document.getElementById('flightForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        origin: document.getElementById('origin').value,
        destination: document.getElementById('destination').value,
        date: document.getElementById('date').value,
        returnDate: document.getElementById('returnDate').value || "",
        adults: document.getElementById('adults').value
    };

    document.getElementById('loading').style.display = 'block';

    try {
        const response = await fetch('http://127.0.0.1:5000/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
        });

        const flights = await response.json();
        console.log(flights);
        document.getElementById('loading').style.display = 'none';
        displayFlights(flights);
    } catch (error) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('results').innerHTML = `<p>Error: ${error.message}</p>`;
    }
    });

    function displayFlights(flights) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = ''; // clear old results
    if (!flights || flights.length === 0) {
        resultsDiv.innerHTML = '<p>No flights found.</p>';
        return;
    }

    flights.forEach(f => {
        const card = document.createElement('div');
        card.className = 'flight-card';
        card.innerHTML = `
        <h3>${f.airline || 'Unknown Airline'}</h3>
        <p>${f.origin} → ${f.destination}</p>
        <p>${f.departureTime} - ${f.arrivalTime}</p>
        <p><b>${f.price}</b></p>
        <button>Book Now</button>
        `;
        resultsDiv.appendChild(card);
    });
    }