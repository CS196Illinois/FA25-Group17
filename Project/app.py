from flask import Flask, request, jsonify
from flask_cors import CORS
import json, requests, os
from dotenv import load_dotenv
from openai import OpenAI

app = Flask(__name__)
CORS(app)
load_dotenv()

FLIGHT_API_KEY = os.getenv("FLIGHT_API_KEY")
OPENAI_API_KEY = os.getenv("OPEN_AI_API_KEY")
itineraries = {}

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

        if "data" not in flights_json:
            print("DEBUG: API response missing 'data'", flights_json)
            return jsonify([])

        flights = flights_json["data"].get("itineraries", [])
        results = []
        for f in flights:
            results.append({
                "airline": f.get("legs", [{}])[0].get("carriers", [{}]).get("marketing", [{}])[0].get("name", "Unknown"),
                "origin": data["origin"],
                "destination": data["destination"],
                "departureTime": f.get("legs", [{}])[0].get("departure", ""),
                "arrivalTime": f.get("legs", [{}])[0].get("arrival", ""),
                "price": f.get("price", {}).get("formatted", "N/A")
            })

        #print(results.json())

        return jsonify(results)

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": str(e)}), 500
def queryInfo(location: str):
    url = "https://sky-scrapper.p.rapidapi.com/api/v1/flights/searchAirport"
    querystring = {"query": location, "locale": "en-US"}
    headers = {
        "x-rapidapi-key": os.getenv("FLIGHT_API_KEY"),
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
        "x-rapidapi-key": os.getenv("FLIGHT_API_KEY"),
        "x-rapidapi-host": "sky-scrapper.p.rapidapi.com"
    }
    return requests.get(url, headers=headers, params=querystring)

@app.route('/chat/attractions', methods=['POST'])
def get_attractions():
    try:
        data = request.json
        message = data.get("message", "")
        attractions = chat_with_bot(message)

        return jsonify({
            "success": True,
            "attractions": attractions,
            "count": len(attractions)
        })

    except Exception as e:
        print("ERROR in /chat/attractions:", e)
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
def chat_with_bot(message):

    format_template = {
        'name': '',
        'description': '',
        'address': '',
        'opening-hours': '',
        'ticket_price': '',
        'website_url': '',
    }

    client = OpenAI(api_key=OPENAI_API_KEY)

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system","content": f"You are a travel agent bot that helps users find activities and attractions in their destination city. Keep in mind the kind of activities that the user prefers in their message if available. Please respond ONLY with a valid JSON array of objects matching this format: {format_template}. Give at least 10 locations. Make sure the response is valid JSON that can be parsed."},
            {"role": "user","content": message}
        ]
    )

    bot_response = response.choices[0].message.content

    try:
        if bot_response.startswith("```"):
            bot_response = bot_response.split("```json")[-1].split("```")[0].strip()

        attractions = json.loads(bot_response)

        # Ensure it's a list
        if not isinstance(attractions, list):
            attractions = [attractions]

        return attractions

    except json.JSONDecodeError as e:
        print("JSON Parse Error:", e)
        print("Response was:", bot_response)
        return []

@app.route('/itinerary', methods=['GET'])
def get_itinerary():
    try:
        user_id = request.args.get("user_id", "default_user")

        if user_id not in itineraries:
            return jsonify({
                "success": True,
                "itinerary": [],
                "count": 0
            })

        return jsonify({
            "success": True,
            "itinerary": itineraries[user_id],
            "count": len(itineraries[user_id])
        })

    except Exception as e:
        print("ERROR in /itinerary GET:", e)
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/itinerary', methods=['POST'])
def add_to_itinerary():
    try:
        data = request.json
        user_id = data.get("user_id", "default_user")
        attraction = data.get("attraction")

        if not attraction:
            return jsonify({
                "success": False,
                "error": "No attraction provided"
            }), 400

        if user_id not in itineraries:
            itineraries[user_id] = []

        existing_names = [item['name'] for item in itineraries[user_id]]
        if attraction['name'] in existing_names:
            return jsonify({
                "success": False,
                "message": "Attraction already in itinerary"
            }), 409

        itineraries[user_id].append(attraction)

        return jsonify({
            "success": True,
            "message": "Added to itinerary",
            "count": len(itineraries[user_id])
        })

    except Exception as e:
        print("ERROR in /itinerary POST:", e)
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/itinerary', methods=['DELETE'])
def remove_from_itinerary():
    try:
        data = request.json
        user_id = data.get("user_id", "default_user")
        attraction_name = data.get("attraction_name")

        if not attraction_name:
            return jsonify({
                "success": False,
                "error": "No attraction name provided"
            }), 400

        if user_id not in itineraries:
            return jsonify({
                "success": False,
                "error": "No itinerary found"
            }), 404

        # Find and remove the attraction
        original_length = len(itineraries[user_id])
        itineraries[user_id] = [item for item in itineraries[user_id] if item['name'] != attraction_name]

        if len(itineraries[user_id]) == original_length:
            return jsonify({
                "success": False,
                "error": "Attraction not found in itinerary"
            }), 404

        return jsonify({
            "success": True,
            "message": "Removed from itinerary",
            "count": len(itineraries[user_id])
        })

    except Exception as e:
        print("ERROR in /itinerary DELETE:", e)
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == "__main__":
    app.run(debug=True)

