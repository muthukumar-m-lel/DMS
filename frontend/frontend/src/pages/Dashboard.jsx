import React, { useState, useEffect } from "react";
import MapView from "../components/Mapveiw";
import WeatherWidget from "../components/WeatherWidget";
import RiskAlert from "../components/RiskAlert";
import NewsFeed from "../components/NewsFeed";
import axios from "axios";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import io from "socket.io-client";
import HazardForecast from "../components/hazard";

const Dashboard = () => {
  const [location, setLocation] = useState({ lat: 13.0827, lng: 80.2707 }); // ✅ Changed lon → lng
  const [weather, setWeather] = useState({});
  const [risk, setRisk] = useState("Low");
  const [news, setNews] = useState([]);
  const [disasters, setDisasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [alert, setAlert] = useState(null);

  const [expandedSection, setExpandedSection] = useState(null); // ✅ To control expansion

  const calculateRisk = (weatherData) => {
    let score = 0;
    if (weatherData.temp > 35) score += 30;
    if (weatherData.humidity > 80) score += 20;
    if (["Storm", "Cyclone", "Flood", "Rain"].includes(weatherData.condition))
      score += 40;

    if (score >= 70) return "High";
    if (score >= 40) return "Medium";
    return "Low";
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      // ✅ Fetch weather
      const weatherRes = await axios.get(
        `http://localhost:5000/api/weather?lat=${location.lat}&lon=${location.lng}`
      );
      setWeather(weatherRes.data);

      // ✅ Risk Calculation
      try {
        const riskRes = await axios.get(
          `http://localhost:5000/api/risk?temp=${weatherRes.data.temp}&humidity=${weatherRes.data.humidity}&condition=${weatherRes.data.condition}`
        );
        setRisk(riskRes.data.riskScore);
      } catch {
        setRisk(calculateRisk(weatherRes.data));
      }

      // ✅ Fetch disasters
      const disasterRes = await axios.get(
        `https://api.reliefweb.int/v1/disasters?appname=your-app&profile=full&limit=10`
      );

      const liveDisasters = disasterRes.data.data.map((item) => ({
        id: item.id,
        title: item.fields.name,
        date: item.fields.date.created,
        description: item.fields.description || "No description available",
        country: item.fields.country?.map((c) => c.name).join(", ") || "Global",
        lat: item.fields.geo?.lat || null,
        lng: item.fields.geo?.lon || null,
      }));

      setNews(liveDisasters);
      setDisasters(liveDisasters.filter((d) => d.lat && d.lng));
      setLastUpdated(new Date().toLocaleTimeString());
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [location]);

  useEffect(() => {
    const socket = io("http://localhost:5000");
    socket.on("alert", (data) => {
      const id = Date.now();
      setNotifications((prev) => [...prev, { ...data, id }]);
      if (data.type === "critical") {
        setAlert(data);
        const audio = new Audio("/alert.mp3");
        audio.play();
      }
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 50000);
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 text-gray-900 p-6 pt-32">
      {/* ✅ Header */}
      <motion.div
        className="fixed top-0 left-0 w-full z-50 flex flex-col md:flex-row justify-between items-center bg-white shadow-lg p-6"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-blue-900 bg-clip-text text-transparent">
          Disaster Management Dashboard
        </h1>
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <p className="text-sm text-gray-700">
            Last Updated:{" "}
            <span className="font-semibold">{lastUpdated || "Loading..."}</span>
          </p>
          <button
            onClick={fetchData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Refresh
          </button>
          <Link to='/check-wether'>
          <button
            onClick={fetchData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Check weather
          </button>
          </Link>
          <Link
            to="/"
            className="bg-gray-800 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-900 transition"
          >
            Home
          </Link>
        </div>
      </motion.div>

      {/* ✅ Notifications */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-4">
        {notifications.map((note) => (
          <div
            key={note.id}
            className={`p-4 rounded-xl shadow-xl text-white font-semibold flex justify-between items-center ${
              note.type === "critical" ? "bg-red-600" : "bg-blue-600"
            }`}
          >
            <span>{note.message}</span>
            <button
              onClick={() =>
                setNotifications((prev) => prev.filter((n) => n.id !== note.id))
              }
              className="ml-4 text-lg font-bold"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
  {/* Left - Map and Alerts */}
  <div className="lg:col-span-2 flex flex-col gap-8">
    <RiskAlert risk={risk} />
    <motion.div
      className="bg-white rounded-2xl shadow-xl p-6 h-[600px]"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      <h2 className="text-2xl font-semibold mb-4">Disaster Map</h2>
      <MapView location={location} setLocation={setLocation} disasters={disasters} />
    </motion.div>
  </div>

  {/* ✅ Right Sidebar */}
  <div className="flex flex-col gap-6">
    {/* Weather Info */}
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <h2 className="text-xl font-bold mb-6">Weather Info</h2>
      <WeatherWidget weather={weather} />
    </div>

    {/* Disaster Management Tips */}
    <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
      <h3 className="text-lg font-bold text-blue-800 mb-4">
        Disaster Management Tips
      </h3>
      <ul className="list-disc pl-5 text-gray-700 space-y-2">
        <li>Keep an emergency kit ready with essentials.</li>
        <li>Stay updated through official alerts and local authorities.</li>
        <li>Know the nearest shelters and safe zones in your area.</li>
        <li>Have an evacuation plan for family and pets.</li>
        <li>Store important documents in a waterproof container.</li>
      </ul>
    </div>
  </div>
</div>


      {/* ✅ Full Width Expandable Sections */}
      <div className="mt-8 space-y-6">
        {/* Previous Disaster News */}
        <motion.div
          className="bg-white rounded-2xl shadow-xl p-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xl font-bold mb-4">Previous Disaster News</h2>
          <NewsFeed
            news={news}
            expanded={expandedSection === "news"}
            onToggle={() =>
              setExpandedSection(expandedSection === "news" ? null : "news")
            }
          />
        </motion.div>

        {/* Hazard Forecast */}
        <motion.div
          className="bg-white rounded-2xl shadow-xl p-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xl font-bold mb-4">Hazard Forecast</h2>
          <HazardForecast
            expanded={expandedSection === "hazard"}
            onToggle={() =>
              setExpandedSection(expandedSection === "hazard" ? null : "hazard")
            }
          />
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
