const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Роздача статичних файлів (наш майбутній фронтенд)
app.use(express.static("public"));

const DEYE_API_URL = `https://www.deyecloud.com/maintain-s/operating/system/${process.env.DEYE_STATION_ID}`;

/**
 * Оновлений структурований ендпоінт для дашборду
 */
app.get("/api/dashboard", async (req, res) => {
  try {
    const response = await axios.get(DEYE_API_URL, {
      headers: {
        Authorization: `Bearer ${process.env.DEYE_AUTH_TOKEN.replace("Bearer ", "")}`,
        Accept: "application/json, text/plain, */*",
      },
    });

    const raw = response.data;

    // Якщо хмара повернула помилку або пусті дані
    if (!raw || raw.success === false) {
      return res.status(400).json({
        success: false,
        message: raw.message || "Хмара Deye повернула некоректну відповідь",
      });
    }

    // Формуємо красиву, структуровану структуру для нашого CSS Grid фронтенду
    const cleanData = {
      success: true,
      updatedAt: new Date(raw.lastUpdateTime * 1000).toLocaleString("uk-UA"), // Переводим UNIX-таймстамп в читаєму дату

      // 1. Блок акумулятора (Високовольтна збірка)
      battery: {
        soc: raw.batterySoc || 0, // Відсоток заряду (%)
        status: raw.batteryStatus || "UNKNOWN", // CHARGE / DISCHARGE / STANDBY
        powerKw: parseFloat(((raw.batteryPower || 0) / 1000).toFixed(2)), // Потужність в кВт (наприклад 20.00)
        voltage: raw.batteryBv || 0, // Напруга на збірці (В)
      },

      // 2. Блок міської мережі (Grid)
      grid: {
        hasLight: raw.gridRelayStatus === "on", // Чи є світло в місті (true/false)
        status: raw.wireStatus || "STANDBY", // PURCHASE (купуємо) / SELL (віддаємо)
        powerKw: parseFloat(((raw.wirePower || 0) / 1000).toFixed(2)), // Скільки кВт берем з міста
      },

      // 3. Блок споживання будинку (Load)
      load: {
        powerKw: parseFloat(((raw.usePower || 0) / 1000).toFixed(2)), // Поточне навантаження будинку в кВт
      },

      // 4. Блок сонячної генерації (PV - PhotoVoltaic)
      solar: {
        powerKw: parseFloat(((raw.generationPower || 0) / 1000).toFixed(3)), // Потужність панелей в кВт
        todayGenerated: raw.generationValue || 0, // Скільки згенеровано за сьогодні (кВт·год)
        totalGenerated: raw.generationTotal || 0, // Загальна генерація за весь час (кВт·год)
      },
    };

    res.json(cleanData);
  } catch (error) {
    console.error("Помилка обробки даних Deye:", error.message);
    res.status(500).json({
      success: false,
      message: "Помилка зв'язку з сервером моніторингу",
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Інженерний сервер запущено на http://localhost:${PORT}`);
  console.log(
    `📊 Очищені дані для фронтенду: http://localhost:${PORT}/api/dashboard`,
  );
});
