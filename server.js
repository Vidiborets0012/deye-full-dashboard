const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const DEYE_API_URL = `https://www.deyecloud.com/maintain-s/operating/system/${process.env.DEYE_STATION_ID}`;

// Ендпоінт для дослідження структури даних хмари Deye
app.get("/api/raw-data", async (req, res) => {
  try {
    const response = await axios.get(DEYE_API_URL, {
      headers: {
        Authorization: `Bearer ${process.env.DEYE_AUTH_TOKEN.replace("Bearer ", "")}`,
        Accept: "application/json, text/plain, */*",
      },
    });

    // Віддаємо абсолютно ВСІ дані без фільтрації для вивчення полів
    res.json({
      success: true,
      rawData: response.data,
    });
  } catch (error) {
    console.error("Помилка запиту до Deye Cloud:", error.message);
    res.status(500).json({
      success: false,
      message: "Не вдалося отримати дані з хмари",
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Дослідницький сервер запущено на http://localhost:${PORT}`);
  console.log(`🔍 Сирі дані будуть тут: http://localhost:${PORT}/api/raw-data`);
});
