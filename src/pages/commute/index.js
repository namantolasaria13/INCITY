import React, { useState, useEffect } from "react";
import axios from "axios";
import { Map } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import ReactMarkdown from "react-markdown";
import RootLayout from "../layout";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

function Commute() {
  const [chat, setChat] = useState([
    { type: "bot", text: "Please enter your destination:" },
  ]);
  const [input, setInput] = useState("");
  const [destination, setDestination] = useState("");
  const [currentLocation, setCurrentLocation] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [transportMode, setTransportMode] = useState(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (currentLocation && destination && transportMode === "Public") {
      fetchPublicTransportData();
    }
  }, [currentLocation, destination, transportMode]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => setCurrentLocation(coords),
        () => updateChat("Unable to retrieve your location")
      );
    } else {
      updateChat("Geolocation is not supported by this browser.");
    }
  };

  const updateChat = (text, type = "bot", buttons = null) => {
    setChat((prevChat) => [...prevChat, { type, text, buttons }]);
  };

  const handleInputChange = (e) => setInput(e.target.value);

  const handleSend = async () => {
    if (!destination) {
      try {
        const { data } = await axios.get(
          "https://maps.googleapis.com/maps/api/geocode/json",
          {
            params: {
              address: input,
              key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API,
            },
          }
        );

        const location = data.results[0].geometry.location;
        setDestination(input);
        setDestinationCoords(location);

        updateChat(input, "user");
        updateChat("Choose your mode of transport:", "bot", ["Public"]);
      } catch (error) {
        updateChat("Error fetching destination coordinates");
      }
    } else {
      updateChat(input, "user");
    }
    setInput("");
  };

  const handleButtonClick = (mode) => {
    if (mode === "Public" && currentLocation && destinationCoords) {
      setTransportMode("Public");
    } else {
      updateChat(
        "Please get your current location and set a valid destination first."
      );
    }
  };

  const fetchPublicTransportData = async () => {
    try {
      const { data } = await axios.post(
        "https://routes.googleapis.com/directions/v2:computeRoutes",
        {
          origin: {
            location: {
              latLng: {
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
              },
            },
          },
          destination: {
            location: {
              latLng: {
                latitude: destinationCoords.lat,
                longitude: destinationCoords.lng,
              },
            },
          },
          travelMode: "TRANSIT",
          computeAlternativeRoutes: true,
          transitPreferences: {
            routingPreference: "LESS_WALKING",
            allowedTravelModes: ["TRAIN", "BUS"],
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": process.env.NEXT_PUBLIC_GOOGLE_MAPS_API,
            "X-Goog-FieldMask": "routes.legs.steps.transitDetails",
          },
        }
      );

      const formattedData = data.routes[0].legs[0].steps
        .filter((step) => step.transitDetails)
        .map((step) => ({
          line: step.transitDetails.transitLine.nameShort,
          headsign: step.transitDetails.headsign,
          arrivalTime: step.transitDetails.stopDetails.arrivalTime,
          departureTime: step.transitDetails.stopDetails.departureTime,
        }));

      const genAI = new GoogleGenerativeAI(
        process.env.NEXT_PUBLIC_GEMINI_API_KEY
      );
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Here are your transit details in JSON format:\n${JSON.stringify(
        formattedData,
        null,
        2
      )}\nPlease convert this JSON into human-readable text instructions.`;
      const result = await model.generateContent(prompt);
      const geminiResponseText = result.response.text();

      updateChat(geminiResponseText);
      // updateChat(
      //   <>
      //     Google Maps Directions Link:{" "}
      //     <a
      //       href={`https://www.google.com/maps/dir/?api=1&origin=${currentLocation.latitude},${currentLocation.longitude}&destination=${destinationCoords.lat},${destinationCoords.lng}`}
      //       target="_blank"
      //       rel="noopener noreferrer"
      //     >
      //       View Directions
      //     </a>
      //   </>
      // );
    } catch (error) {
      updateChat("Error fetching transit data");
    }
  };

  const router = useRouter();
  const handleDirection = async () => {
    router.push(
      `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.latitude},${currentLocation.longitude}&destination=${destinationCoords.lat},${destinationCoords.lng}`
    );
  };

  const handleRestartChat = () => {
    setChat([{ type: "bot", text: "Please enter your destination:" }]);
    setInput("");
    setDestination("");
    setCurrentLocation(null);
    setDestinationCoords(null);
    setTransportMode(null);
  };

  return (
    <RootLayout>
      <div className="flex flex-col h-screen text-black">
        <div className="flex-1 overflow-y-scroll bg-gray-100 p-4 border border-gray-300">
          {chat.map((message, index) => (
            <div
              key={index}
              className={`my-2 ${
                message.type === "bot" ? "text-left" : "text-right"
              }`}
            >
              <div
                className={`inline-block p-3 rounded-lg ${
                  message.type === "bot" ? "bg-green-100" : "bg-blue-100"
                }`}
              >
                <ReactMarkdown>{message.text.toString()}</ReactMarkdown>
                {message.buttons &&
                  message.buttons.map((button, idx) => (
                    <Button
                      key={idx}
                      onClick={() => handleButtonClick(button)}
                      className="bg-blue-500 text-white py-1 px-3 rounded-lg mx-1 hover:bg-blue-600"
                    >
                      {button}
                    </Button>
                  ))}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 flex flex-col bg-gray-200 border-t border-gray-300">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-lg"
          />
          <div className="flex items-center justify-center gap-2">
            <Button
              onClick={handleSend}
              className="bg-blue-500 text-white py-2 px-4 rounded-lg"
            >
              Send
            </Button>
            <Button
              onClick={handleRestartChat}
              className="bg-gray-500 text-white py-2 px-4 rounded-lg"
            >
              Start New Chat
            </Button>
            <Button
              onClick={handleDirection}
              className="bg-gray-500 text-white py-2 px-4 rounded-lg"
            >
              <Map />
            </Button>
          </div>
        </div>
      </div>
    </RootLayout>
  );
}

export default Commute;
