// ==========================================================================
// ГЛОБАЛЬНІ КОНСТАНТИ ТА СЕЛЕКТОРИ
// ==========================================================================
const API_URL = "/api/dashboard";

// Елементи керування лоадером та екраном
const pageLoaderEl = document.getElementById("pageLoader");
const dashboardBoxEl = document.getElementById("dashboardBox");
const syncTimeEl = document.getElementById("syncTime");

// Елементи картки Акумулятора
const batSocEl = document.getElementById("batSoc");
const batStatusEl = document.getElementById("batStatus");
const batPowerEl = document.getElementById("batPower");
const batVoltageEl = document.getElementById("batVoltage");

// Елементи картки Міської мережі
const gridLightBadgeEl = document.getElementById("gridLightBadge");
const gridStatusEl = document.getElementById("gridStatus");
const gridPowerEl = document.getElementById("gridPower");

// Елементи картки Навантаження
const loadPowerEl = document.getElementById("loadPower");

// Елементи картки Сонця
const solarPowerEl = document.getElementById("solarPower");
const solarTodayEl = document.getElementById("solarToday");
const solarTotalEl = document.getElementById("solarTotal");

// ==========================================================================
// ДОПОМІЖНІ ФУНКЦІЇ
// ==========================================================================

/**
 * Плавне приховування лоадера та відображення інженерної сітки
 */
function hideLoader() {
  if (pageLoaderEl && dashboardBoxEl) {
    if (!pageLoaderEl.classList.contains("page-loader--hidden")) {
      pageLoaderEl.classList.add("page-loader--hidden");
      dashboardBoxEl.classList.remove("dashboard--hidden");
    }
  }
}

/**
 * Переклад системних статусів інвертора на зрозумілу мову
 * @param {string} status - Оригінальний статус від Deye (CHARGE, DISCHARGE, etc.)
 */
function translateStatus(status) {
  const statuses = {
    CHARGE: "🔋 Зарядка",
    DISCHARGE: "🪫 Розрядка",
    STANDBY: "💤 Очікування",
    OFFLINE: "🔌 Вимкнено",
  };
  return statuses[status] || status;
}

// ==========================================================================
// ОСНОВНА ЛОГІКА ОНОВЛЕННЯ UI
// ==========================================================================

/**
 * Розподіл отриманих даних по відповідних картках
 * @param {Object} data - Очищений об'єкт даних від нашого API
 */
function updateDashboardUI(data) {
  // 0. Час останньої синхронізації з хмарою
  syncTimeEl.innerText = data.updatedAt;

  // 1. Блок Акумулятора
  batSocEl.innerText = data.battery.soc;
  batStatusEl.innerText = translateStatus(data.battery.status);
  batPowerEl.innerText = `${data.battery.powerKw} кВт`;
  batVoltageEl.innerText = `${data.battery.voltage} В`;

  // 2. Блок Міської мережі (Динамічний Бадж)
  if (data.grid.hasLight) {
    gridLightBadgeEl.className = "badge badge--success";
    gridLightBadgeEl.innerText = "Мережа є";
  } else {
    gridLightBadgeEl.className = "badge badge--danger";
    gridLightBadgeEl.innerText = "🚨 Знеструмлено";
  }

  const gridMode =
    data.grid.status === "PURCHASE" ? "Споживання з міста" : "Експорт в мережу";
  gridStatusEl.innerText = data.grid.powerKw > 0 ? gridMode : "Спокою немає";
  gridPowerEl.innerText = `${data.grid.powerKw} кВт`;

  // 3. Блок Навантаження будинку
  loadPowerEl.innerText = data.load.powerKw;

  // 4. Блок Сонячної генерації
  solarPowerEl.innerText = data.solar.powerKw;
  solarTodayEl.innerText = `${data.solar.todayGenerated} кВт·год`;
  solarTotalEl.innerText = `${data.solar.totalGenerated} кВт·год`;
}

/**
 * Запит до локального Express-сервера за свіжими даними дашборду
 */
async function fetchDashboardData() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`Помилка сервера HTTP: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.success) {
      updateDashboardUI(data);
      hideLoader(); // Дані є — прибираємо завісу лоадера
    } else {
      throw new Error(data.message || "Невідома помилка архітектури API");
    }
  } catch (error) {
    console.error("Помилка фронтенду під час збору метрик:", error);

    // Навіть у разі критичної помилки ховаємо лоадер, щоб користувач не застряг на екрані завантаження
    hideLoader();

    // Відображаємо алярм у часі оновлення
    syncTimeEl.innerHTML = `<span style="color: #e74c3c; font-weight: bold;">Помилка зв'язку з API!</span>`;
  }
}

// ==========================================================================
// ІНІЦІАЛІЗАЦІЯ МОНІТОРИНГУ
// ==========================================================================

// Опитування інвертора кожні 60 секунд (для інженерної панелі краще оновлювати частіше)
setInterval(fetchDashboardData, 60000);

// Перший миттєвий запуск при завантаженні сторінки
fetchDashboardData();
