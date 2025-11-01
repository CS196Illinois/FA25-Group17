from flask import Flask, request, jsonify
from flask_cors import CORS
import json, requests, os
from dotenv import load_dotenv

app = Flask(__name__)
CORS(app)
load_dotenv()

API_KEY = os.getenv("API_KEY")

@app.route('/search', methods=['POST'])
def search_flights():
    try:
        data = request.json
        origin_info = queryInfo(data["origin"])
        dest_info = queryInfo(data["destination"])

        if not origin_info or not dest_info:
            return jsonify([])

        querystring = {
            "originSkyId": origin_info["skyId"],
            "destinationSkyId": dest_info["skyId"],
            "originEntityId": origin_info["entityId"],
            "destinationEntityId": dest_info["entityId"],
            "date": data["date"],
            "returnDate": data.get("returnDate", ""),
            "cabinClass": "economy",
            "adults": data["adults"],
            "sortBy": "best",
            "currency": "USD",
            "market": "en-US",
            "countryCode": "US"
        }

        flights_json = flightQuery(querystring).json()

        # ✅ Check if the API returned valid data
        if "data" not in flights_json:
            print("DEBUG: API response missing 'data'", flights_json)
            return jsonify([])

        flights = flights_json["data"].get("results", [])
        results = []
        for f in flights:
            results.append({
                "airline": f.get("legs", [{}])[0].get("carriers", [{}])[0].get("name", "Unknown"),
                "origin": data["origin"],
                "destination": data["destination"],
                "departureTime": f.get("legs", [{}])[0].get("departure", ""),
                "arrivalTime": f.get("legs", [{}])[0].get("arrival", ""),
                "price": f.get("price", {}).get("formatted", "N/A")
            })

        return jsonify(results)

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": str(e)}), 500


def queryInfo(location: str):
    url = "https://sky-scrapper.p.rapidapi.com/api/v1/flights/searchAirport"
    querystring = {"query": location, "locale": "en-US"}
    headers = {
        "x-rapidapi-key": API_KEY,
        "x-rapidapi-host": "sky-scrapper.p.rapidapi.com"
    }
    response = requests.get(url, headers=headers, params=querystring).json()

    try:
        useful = response["data"][0]["navigation"]["relevantFlightParams"]
        return {
            "skyId": useful["skyId"],
            "entityId": useful["entityId"],
            "localizedName": useful["localizedName"]
        }
    except Exception as e:
        print("queryInfo error for", location, ":", e)
        return None


def flightQuery(querystring: dict):
    url = "https://sky-scrapper.p.rapidapi.com/api/v1/flights/searchFlights"
    headers = {
        "x-rapidapi-key": API_KEY,
        "x-rapidapi-host": "sky-scrapper.p.rapidapi.com"
    }
    return requests.get(url, headers=headers, params=querystring)


if __name__ == "__main__":
    app.run(debug=True)

