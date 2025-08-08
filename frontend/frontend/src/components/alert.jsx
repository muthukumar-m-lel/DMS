import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

// Leaflet Icon Fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
const navigate = useNavigate();
  // Fetch alerts from API
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch(
          "https://api.reliefweb.int/v1/disasters?appname=disaster-app&profile=full&preset=latest"
        );
        const data = await response.json();

        const parsedAlerts = data.data.slice(0, 10).map((item) => ({
          id: item.id,
          type: item.fields.type[0]?.name || "General",
          location: item.fields.country[0]?.name || "Unknown",
          severity: "Moderate", // ReliefWeb does not provide severity
          time: new Date(item.fields.date.created).toLocaleString(),
          coords: [20.5937, 78.9629], // Placeholder (could use geocoding API)
        }));

        setAlerts(parsedAlerts);
        setLoading(false);
        toast.success("Disaster alerts updated!", {
          position: "bottom-right",
        });
      } catch (error) {
        console.error(error);
        toast.error("Failed to load alerts");
      }
    };

    fetchAlerts();
  }, []);

  const filteredAlerts =
    filter === "All" ? alerts : alerts.filter((alert) => alert.type === filter);

  const disasterTypes = ["All", "Flood", "Earthquake", "Cyclone", "Wildfire"];
  const severityColors = {
    High: "bg-red-500",
    Extreme: "bg-purple-600",
    Moderate: "bg-yellow-500",
    Low: "bg-green-500",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-500 to-cyan-500 text-white px-6 py-10">
      <motion.h1
        className="text-4xl font-bold text-center mb-8"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Disaster Alerts
      </motion.h1>
      <button
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 bg-white/20 backdrop-blur-md border border-white/30 text-white px-4 py-2 rounded-md hover:bg-white/30 transition font-semibold shadow-md"
      >
        Back
      </button>
      {/* Filter Buttons */}
      <div className="flex justify-center gap-4 mb-8 flex-wrap">
        {disasterTypes.map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-5 py-2 rounded-lg font-semibold shadow-md transition ${
              filter === type
                ? "bg-white text-blue-700"
                : "bg-blue-800 hover:bg-blue-700"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Alerts Grid */}
      {loading ? (
        <p className="text-center text-lg">Loading alerts...</p>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.2 },
            },
          }}
        >
          {filteredAlerts.map((alert) => (
            <motion.div
              key={alert.id}
              className="bg-white text-blue-800 rounded-2xl shadow-lg p-6 hover:shadow-2xl transition"
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{alert.type}</h2>
                <span
                  className={`text-white text-xs font-bold px-3 py-1 rounded-full ${
                    severityColors[alert.severity]
                  }`}
                >
                  {alert.severity}
                </span>
              </div>
              <p className="text-gray-700 mb-2">📍 {alert.location}</p>
              <p className="text-gray-500 text-sm">⏱ {alert.time}</p>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Map Section */}
      <div className="w-full max-w-6xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
        <h2 className="text-blue-800 font-bold text-center py-4 text-2xl">
          Alert Locations
        </h2>
        <MapContainer
          center={[20.5937, 78.9629]} // Centered on India
          zoom={3}
          style={{ height: "400px", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {filteredAlerts.map((alert) => (
            <Marker key={alert.id} position={alert.coords}>
              <Popup>
                <strong>{alert.type}</strong>
                <br />
                {alert.location}
                <br />
                Severity: {alert.severity}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default Alerts;
