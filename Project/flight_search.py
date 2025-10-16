import json
import requests
import os
from dotenv import load_dotenv

def queryInfo(location: str):
	load_dotenv()
	url = "https://sky-scrapper.p.rapidapi.com/api/v1/flights/searchAirport"
	querystring = {"query": location, "locale": "en-US"}
	headers = {
		"x-rapidapi-key": os.getenv("API_KEY"),
		"x-rapidapi-host": "sky-scrapper.p.rapidapi.com"
	}
	response = requests.get(url, headers=headers, params=querystring).json()
	print(response)
	useful = response["data"][0]["navigation"]["relevantFlightParams"]
	return {"skyId": useful["skyId"], "entityId": useful["entityId"], "localizedName": useful["localizedName"]}



def flightQuery(querystring: dict):
	load_dotenv()
	url = "https://sky-scrapper.p.rapidapi.com/api/v1/flights/searchFlights"
	headers = {
		"x-rapidapi-key": os.getenv("API_KEY"),
		"x-rapidapi-host": "sky-scrapper.p.rapidapi.com"
	}
	response = requests.get(url, headers=headers, params=querystring)
	return response



if __name__ == "__main__":
	
	with open("Project\pagerequest.json", "r") as f:
		search_request = json.load(f)

	origin = queryInfo(search_request["origin"])
	destination = queryInfo(search_request["destination"])

	querystring = {
		"originSkyId": origin["skyId"],
		"destinationSkyId": destination["skyId"],
		"originEntityId": origin["entityId"],
		"destinationEntityId": destination["entityId"],
		"date": search_request["date"],
		"returnDate": search_request["returnDate"],
		"cabinClass": "economy",
		"adults":  search_request["adults"],
		"sortBy": "best",
		"currency": "USD",
		"market":"en-US",
		"countryCode":"US"
	}

	response = flightQuery(querystring)
	#print(response.json())
	
	json_str = json.dumps(response.json(), indent=4)
	with open("flight.json", "w") as f:
		f.write(json_str)