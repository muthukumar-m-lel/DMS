import express from "express";
import axios from "axios";

const router = express.Router();

// Mock disaster data
const mockDisasters = [
  { name: "Flood in Kerala", country: "India", date: "2023-07-15", lat: 10.8505, lon: 76.2711 },
  { name: "Cyclone Mocha", country: "Bangladesh", date: "2023-05-10", lat: 23.685, lon: 90.3563 },
  { name: "Earthquake", country: "Nepal", date: "2022-11-21", lat: 28.3949, lon: 84.124 }
];

router.get("/", async (req, res) => {
  const apiKey = process.env.RELIEFWEB_KEY; // Optional
  if (!apiKey) {
    return res.json(mockDisasters);
  }

  try {
    const response = await axios.get("https://api.reliefweb.int/v1/disasters", {
      params: { appname: "hackathon-app", limit: 5 }
    });

    const disasters = response.data.data.map((item) => ({
      name: item.fields.name,
      country: item.fields.country[0]?.name || "Unknown",
      date: item.fields.date?.created || "N/A",
      lat: 20.5937, // ReliefWeb doesn't give exact lat/lon
      lon: 78.9629
    }));

    res.json(disasters);
  } catch (error) {
    console.error(error);
    res.json(mockDisasters);
  }
});

export default router;
