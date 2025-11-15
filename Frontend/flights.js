function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        origin: params.get("origin"),
        destination: params.get("destination"),
        date: params.get("date"),
        returnDate: params.get("returnDate") || "",
        adults: 1
    };
}

async function loadFlights() {
    const data = getQueryParams();
    document.getElementById("loading").style.display = "block";

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

window.onload = loadFlights;
