import React, { useEffect, useState, useCallback } from "react";
import { FaSearch } from "react-icons/fa";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useSearchParams } from "next/navigation";
import RootLayout from "../layout";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API;

const useGoogleMapsApi = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !window.google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setIsLoaded(true);
      document.head.appendChild(script);
    } else {
      setIsLoaded(true);
    }
  }, []);

  return isLoaded;
};

function Hotels() {
  const isGoogleMapsLoaded = useGoogleMapsApi();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [places, setPlaces] = useState([]);
  const [searchType, setSearchType] = useState("restaurant");
  const [inputValue, setInputValue] = useState("");
  const [map, setMap] = useState(null);

  const searchParams = useSearchParams();
  const queryParam = searchParams.get("query");

  const typeref = {
    categories: {
      Automotive: ["car_dealer", "car_rental", "car_repair", "car_wash"],
      Business: ["farm"],
      Culture: ["art_gallery", "museum", "performing_arts_theater"],
      Education: ["library", "preschool", "primary_school", "university"],
      Entertainment: ["amusement_park", "cinema", "zoo", "night_club"],
      Food: ["restaurant", "cafe", "bakery", "bar", "ice_cream_shop"],
      Health: ["hospital", "pharmacy", "dentist", "doctor"],
      Lodging: ["hotel", "motel", "hostel", "campground"],
      Recreation: ["park", "gym", "hiking_area", "sports_complex"],
      Services: ["hair_salon", "laundry", "tailor", "travel_agency"],
      Shopping: ["clothing_store", "book_store", "grocery_store", "market"],
      Transportation: ["airport", "train_station", "bus_station"],
    },
  };

  const initMap = useCallback(() => {
    if (!isGoogleMapsLoaded || !currentLocation) return;

    const { Map, AdvancedMarkerElement } = google.maps;

    const center = new google.maps.LatLng(
      currentLocation.lat,
      currentLocation.lng
    );
    console.log(center);
    const mapInstance = new Map(document.getElementById("map"), {
      center: center,
      zoom: 11,
      mapId: "DEMO_MAP_ID",
    });

    setMap(mapInstance);

    nearbySearch(mapInstance, searchType);
  }, [isGoogleMapsLoaded, currentLocation, searchType]);

  const nearbySearch = async (mapInstance, type) => {
    const { LatLngBounds } = google.maps;

    const center = new google.maps.LatLng(
      currentLocation.lat,
      currentLocation.lng
    );
    console.log(center);
    const request = {
      fields: ["name", "geometry", "vicinity", "photos"],
      location: center,
      radius: 50000,
      type: [type],
    };

    const service = new google.maps.places.PlacesService(mapInstance);

    service.nearbySearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        setPlaces(results);

        const bounds = new LatLngBounds();
        results.forEach((place) => {
          new google.maps.Marker({
            map: mapInstance,
            position: place.geometry.location,
            title: place.name,
          });
          bounds.extend(place.geometry.location);
        });
        mapInstance.fitBounds(bounds);
      } else {
        console.error("Error fetching places:", status);
      }
    });
  };

  const processSearchType = async (query) => {
    const genAI = new GoogleGenerativeAI(
      process.env.NEXT_PUBLIC_GEMINI_API_KEY
    );
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const typerefString = JSON.stringify(typeref);

    const prompt = `Here are the categories and keys, with reference to the input received give back the closest key to the input. Just return the key and nothing else. For example, if I input "books", return "book_store" which is a key.:\n${typerefString}\nAnd the input text is "${query}".`;

    try {
      const result = await model.generateContent(prompt);
      const geminiResponseText = await result.response.text();
      const closestKey = geminiResponseText.trim();
      console.log(closestKey);
      setSearchType(closestKey);
    } catch (error) {
      console.error("Error processing Gemini AI response:", error);
    }
  };

  useEffect(() => {
    if (queryParam) {
      setInputValue(queryParam);
      processSearchType(queryParam);
    }
  }, [queryParam]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error("Error getting location:", error);
        },
        { enableHighAccuracy: true }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }, []);

  useEffect(() => {
    initMap();
  }, [initMap]);

  const handleSearch = async (event) => {
    event.preventDefault();
    processSearchType(inputValue);
  };

  return (
    <RootLayout>
      <div className="p-4">
        <form
          onSubmit={handleSearch}
          className="text-black flex items-center mb-4"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search for places..."
            className="border border-gray-300 rounded-md p-2 mr-2 flex-grow"
          />
          <button type="submit" className="p-2 bg-blue-500 text-white rounded">
            <FaSearch />
          </button>
        </form>

        <div id="map" style={{ height: "500px", width: "100%" }}></div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
          {places.length > 0 ? (
            places.map((place) => (
              <div
                key={place.place_id}
                className="border rounded-md p-4 bg-white shadow-md"
              >
                <h2 className="text-lg font-semibold">{place.name}</h2>
                <p className="text-gray-600">{place.vicinity}</p>
                {place.photos && (
                  <img
                    src={place.photos[0].getUrl({ maxWidth: 400 })}
                    alt={place.name}
                    className="mt-2 w-full h-40 object-cover rounded"
                  />
                )}
              </div>
            ))
          ) : (
            <p className="mt-4">No places found.</p>
          )}
        </div>
      </div>
    </RootLayout>
  );
}

export default Hotels;
