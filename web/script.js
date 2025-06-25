// Конфигурация API
const API_BASE_URL = "http://localhost:3001/api";

// Глобальные переменные для графиков
let categoryChart, regionChart, platformChart, trendsChart;

// Цветовая палитра
const colors = [
  "#667eea",
  "#764ba2",
  "#f093fb",
  "#f5576c",
  "#4facfe",
  "#43e97b",
  "#fa709a",
  "#fee140",
  "#a8edea",
  "#ffecd2",
];

// Глобальные переменные для фильтров
let currentFilters = {
  dateFrom: null,
  dateTo: null,
  categoryId: null,
  regionId: null,
};

// Инициализация при загрузке страницы
document.addEventListener("DOMContentLoaded", function () {
  updateLastUpdated();
  loadAllData();
  initializeFilters();

  // Обновление данных каждые 30 секунд
  setInterval(loadAllData, 30000);
});

// Обновление времени последнего обновления
function updateLastUpdated() {
  const now = new Date();
  const timeString = now.toLocaleString("ru-RU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  document.getElementById("lastUpdated").textContent = timeString;
}

// Загрузка всех данных
async function loadAllData() {
  updateStatus("loading", "Загрузка данных...");

  try {
    await Promise.all([
      loadStats(),
      loadCategoryData(),
      loadRegionData(),
      loadPlatformData(),
      loadTrendsData(),
      loadTopProducts(),
    ]);

    updateStatus("connected", "Подключено");
    updateLastUpdated();
  } catch (error) {
    console.error("Ошибка загрузки данных:", error);
    updateStatus("error", "Ошибка подключения");
  }
}

// Обновление статуса подключения
function updateStatus(status, message) {
  const indicator = document.getElementById("statusIndicator");
  const dot = indicator.querySelector(".status-dot");
  const text = indicator.querySelector(".status-text");

  dot.className = `status-dot ${status}`;
  text.textContent = message;
}

// Загрузка общей статистики
async function loadStats() {
  try {
    const url = buildApiUrl(`${API_BASE_URL}/stats`);
    const response = await fetch(url);
    const data = await response.json();

    document.getElementById("totalRevenue").textContent = formatCurrency(
      data.total_revenue
    );
    document.getElementById("totalSales").textContent = formatNumber(
      data.total_sales
    );
    document.getElementById("totalProducts").textContent = formatNumber(
      data.total_products
    );
    document.getElementById("totalRegions").textContent = formatNumber(
      data.total_regions
    );
  } catch (error) {
    console.error("Ошибка загрузки статистики:", error);
  }
}

// Загрузка данных по категориям
async function loadCategoryData() {
  try {
    const url = buildApiUrl(`${API_BASE_URL}/revenue-by-category`);
    const response = await fetch(url);
    const data = await response.json();

    const ctx = document.getElementById("categoryChart").getContext("2d");

    if (categoryChart) {
      categoryChart.destroy();
    }

    categoryChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: data.map((item) => item.category),
        datasets: [
          {
            data: data.map((item) => parseFloat(item.total_revenue)),
            backgroundColor: colors.slice(0, data.length),
            borderWidth: 2,
            borderColor: "#fff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              padding: 20,
              usePointStyle: true,
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const value = formatCurrency(context.raw);
                const percentage = (
                  (context.raw /
                    data.reduce(
                      (sum, item) => sum + parseFloat(item.total_revenue),
                      0
                    )) *
                  100
                ).toFixed(1);
                return `${context.label}: ${value} (${percentage}%)`;
              },
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Ошибка загрузки данных по категориям:", error);
  }
}

// Загрузка данных по регионам
async function loadRegionData() {
  try {
    const url = buildApiUrl(`${API_BASE_URL}/sales-by-region`);
    const response = await fetch(url);
    const data = await response.json();

    const ctx = document.getElementById("regionChart").getContext("2d");

    if (regionChart) {
      regionChart.destroy();
    }

    regionChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: data.map((item) => item.region),
        datasets: [
          {
            label: "Доход (руб.)",
            data: data.map((item) => parseFloat(item.total_revenue)),
            backgroundColor: colors[0],
            borderColor: colors[1],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return `Доход: ${formatCurrency(context.raw)}`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return formatCurrency(value);
              },
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Ошибка загрузки данных по регионам:", error);
  }
}

// Загрузка данных по площадкам
async function loadPlatformData() {
  try {
    const url = buildApiUrl(`${API_BASE_URL}/platform-performance`);
    const response = await fetch(url);
    const data = await response.json();

    const ctx = document.getElementById("platformChart").getContext("2d");

    if (platformChart) {
      platformChart.destroy();
    }

    platformChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: data.map((item) => item.platform),
        datasets: [
          {
            label: "Валовый доход",
            data: data.map((item) => parseFloat(item.gross_revenue)),
            backgroundColor: colors[2],
            borderColor: colors[3],
            borderWidth: 1,
          },
          {
            label: "Чистый доход",
            data: data.map((item) => parseFloat(item.net_revenue)),
            backgroundColor: colors[4],
            borderColor: colors[5],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return `${context.dataset.label}: ${formatCurrency(
                  context.raw
                )}`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return formatCurrency(value);
              },
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Ошибка загрузки данных по площадкам:", error);
  }
}

// Загрузка трендов
async function loadTrendsData() {
  try {
    const url = buildApiUrl(`${API_BASE_URL}/monthly-trends`);
    const response = await fetch(url);
    const data = await response.json();

    const ctx = document.getElementById("trendsChart").getContext("2d");

    if (trendsChart) {
      trendsChart.destroy();
    }

    trendsChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.map((item) => formatMonth(item.month)),
        datasets: [
          {
            label: "Доход по месяцам",
            data: data.map((item) => parseFloat(item.total_revenue)),
            borderColor: colors[6],
            backgroundColor: colors[6] + "20",
            borderWidth: 3,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return `Доход: ${formatCurrency(context.raw)}`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return formatCurrency(value);
              },
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Ошибка загрузки трендов:", error);
  }
}

// Загрузка топ товаров
async function loadTopProducts() {
  try {
    const url = buildApiUrl(`${API_BASE_URL}/top-products`);
    const response = await fetch(url);
    const data = await response.json();

    const tbody = document.querySelector("#topProductsTable tbody");
    tbody.innerHTML = "";

    data.forEach((product, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><strong>${product.name}</strong></td>
        <td>${product.category}</td>
        <td>${formatNumber(product.sales_count)}</td>
        <td>${formatCurrency(product.total_revenue)}</td>
        <td>${formatCurrency(product.avg_price)}</td>
      `;
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error("Ошибка загрузки топ товаров:", error);
  }
}

// Утилиты форматирования
function formatCurrency(value) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

function formatMonth(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "short",
  });
}

// Обработка ошибок сети
window.addEventListener("online", function () {
  updateStatus("connected", "Подключено");
  loadAllData();
});

window.addEventListener("offline", function () {
  updateStatus("error", "Нет подключения");
});

// Функционал загрузки файлов
document.addEventListener("DOMContentLoaded", function () {
  const uploadArea = document.getElementById("uploadArea");
  const fileInput = document.getElementById("fileInput");
  const uploadBtn = document.getElementById("uploadBtn");
  const uploadProgress = document.getElementById("uploadProgress");
  const progressFill = document.getElementById("progressFill");
  const progressText = document.getElementById("progressText");
  const uploadResult = document.getElementById("uploadResult");
  const resultContent = document.getElementById("resultContent");

  // Обработчики событий
  uploadBtn.addEventListener("click", () => fileInput.click());
  uploadArea.addEventListener("click", () => fileInput.click());

  // Drag & Drop
  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.classList.add("dragover");
  });

  uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("dragover");
  });

  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.classList.remove("dragover");

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  });

  async function handleFileUpload(file) {
    // Проверка типа файла
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      showResult("error", "Пожалуйста, выберите Excel файл (.xlsx или .xls)");
      return;
    }

    // Проверка размера файла (10MB)
    if (file.size > 10 * 1024 * 1024) {
      showResult("error", "Файл слишком большой. Максимальный размер: 10MB");
      return;
    }

    // Показываем прогресс
    uploadProgress.style.display = "block";
    uploadResult.style.display = "none";
    progressFill.style.width = "0%";
    progressText.textContent = "Загрузка файла...";

    try {
      const formData = new FormData();
      formData.append("excelFile", file);

      const xhr = new XMLHttpRequest();

      // Отслеживание прогресса
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          progressFill.style.width = percentComplete + "%";
          progressText.textContent = `Загрузка: ${Math.round(
            percentComplete
          )}%`;
        }
      });

      xhr.addEventListener("load", () => {
        uploadProgress.style.display = "none";

        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          if (response.success) {
            showResult(
              "success",
              `
              <h4>Файл успешно обработан!</h4>
              <p><strong>Обработано записей:</strong> ${response.processed}</p>
              ${
                response.errors > 0
                  ? `<p><strong>Ошибок:</strong> ${response.errors}</p>`
                  : ""
              }
              ${
                response.errorDetails && response.errorDetails.length > 0
                  ? `<details>
                  <summary>Детали ошибок (первые 10)</summary>
                  <ul>
                    ${response.errorDetails
                      .map((error) => `<li>${error}</li>`)
                      .join("")}
                  </ul>
                </details>`
                  : ""
              }
              <p style="margin-top: 15px; color: #666;">Данные автоматически обновятся через несколько секунд.</p>
            `
            );

            // Обновляем данные через 3 секунды
            setTimeout(() => {
              loadAllData();
            }, 3000);
          } else {
            showResult(
              "error",
              `Ошибка: ${response.message || "Неизвестная ошибка"}`
            );
          }
        } else {
          const errorResponse = JSON.parse(xhr.responseText);
          showResult(
            "error",
            `Ошибка сервера: ${errorResponse.error || "Неизвестная ошибка"}`
          );
        }
      });

      xhr.addEventListener("error", () => {
        uploadProgress.style.display = "none";
        showResult("error", "Ошибка сети. Проверьте подключение к интернету.");
      });

      xhr.open("POST", `${API_BASE_URL}/upload-excel`);
      xhr.send(formData);
    } catch (error) {
      uploadProgress.style.display = "none";
      showResult("error", `Ошибка: ${error.message}`);
    }
  }

  function showResult(type, content) {
    uploadResult.style.display = "block";
    uploadResult.className = `upload-result ${type}`;
    resultContent.innerHTML = content;

    // Сброс input
    fileInput.value = "";
  }
});

// Функционал скачивания Excel файла
document.addEventListener("DOMContentLoaded", function () {
  const downloadBtn = document.getElementById("downloadBtn");

  if (downloadBtn) {
    downloadBtn.addEventListener("click", async function () {
      try {
        // Показываем состояние загрузки
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = "Подготовка файла...";

        // Запрашиваем файл с сервера
        const response = await fetch(`${API_BASE_URL}/export-excel`);

        if (!response.ok) {
          throw new Error(`Ошибка сервера: ${response.status}`);
        }

        // Получаем blob данные
        const blob = await response.blob();

        // Создаем ссылку для скачивания
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;

        // Получаем имя файла из заголовков ответа
        const contentDisposition = response.headers.get("Content-Disposition");
        let fileName = "BI_Analytics.xlsx";

        if (contentDisposition) {
          const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
          if (fileNameMatch) {
            fileName = fileNameMatch[1];
          }
        }

        link.download = fileName;
        document.body.appendChild(link);
        link.click();

        // Очищаем ресурсы
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);

        // Показываем успешное завершение
        downloadBtn.innerHTML = "Скачано!";
        setTimeout(() => {
          downloadBtn.innerHTML = "Скачать данные";
          downloadBtn.disabled = false;
        }, 2000);
      } catch (error) {
        console.error("Ошибка скачивания файла:", error);

        // Показываем ошибку
        downloadBtn.innerHTML = "Ошибка";
        setTimeout(() => {
          downloadBtn.innerHTML = "Скачать данные";
          downloadBtn.disabled = false;
        }, 3000);

        // Можно показать уведомление пользователю
        alert(`Ошибка скачивания файла: ${error.message}`);
      }
    });
  }
});

// Функционал очистки данных
document.addEventListener("DOMContentLoaded", function () {
  const clearBtn = document.getElementById("clearBtn");

  if (clearBtn) {
    clearBtn.addEventListener("click", async function () {
      // Подтверждение действия
      const confirmed = confirm(
        "Вы уверены, что хотите удалить ВСЕ данные?\n\n" +
          "Это действие нельзя отменить!\n" +
          "Будут удалены:\n" +
          "• Все продажи\n" +
          "• Все товары\n" +
          "• Все категории\n" +
          "• Все регионы\n" +
          "• Все площадки"
      );

      if (!confirmed) {
        return;
      }

      // Двойное подтверждение для критического действия
      const doubleConfirmed = confirm(
        "ПОСЛЕДНЕЕ ПРЕДУПРЕЖДЕНИЕ!\n\n" +
          "Все данные будут безвозвратно удалены.\n" +
          "Продолжить?"
      );

      if (!doubleConfirmed) {
        return;
      }

      try {
        // Показываем состояние загрузки
        clearBtn.disabled = true;
        clearBtn.innerHTML = "Очистка данных...";

        // Отправляем запрос на очистку
        const response = await fetch(`${API_BASE_URL}/clear-data`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error(`Ошибка сервера: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          // Показываем успешное завершение
          clearBtn.innerHTML = "Данные очищены!";

          // Обновляем все данные на странице
          setTimeout(() => {
            loadAllData();
            clearBtn.innerHTML = "Очистить все данные";
            clearBtn.disabled = false;
          }, 2000);

          alert("Все данные успешно удалены!");
        } else {
          throw new Error(result.message || "Неизвестная ошибка");
        }
      } catch (error) {
        console.error("Ошибка очистки данных:", error);

        // Показываем ошибку
        clearBtn.innerHTML = "Ошибка";
        setTimeout(() => {
          clearBtn.innerHTML = "Очистить все данные";
          clearBtn.disabled = false;
        }, 3000);

        alert(`Ошибка очистки данных: ${error.message}`);
      }
    });
  }
});

// Инициализация фильтров
async function initializeFilters() {
  try {
    // Загружаем категории
    const categoriesResponse = await fetch(`${API_BASE_URL}/categories`);
    const categories = await categoriesResponse.json();

    const categorySelect = document.getElementById("categoryFilter");
    categorySelect.innerHTML = '<option value="">Все категории</option>';
    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category.id;
      option.textContent = category.name;
      categorySelect.appendChild(option);
    });

    // Загружаем регионы
    const regionsResponse = await fetch(`${API_BASE_URL}/regions`);
    const regions = await regionsResponse.json();

    const regionSelect = document.getElementById("regionFilter");
    regionSelect.innerHTML = '<option value="">Все регионы</option>';
    regions.forEach((region) => {
      const option = document.createElement("option");
      option.value = region.id;
      option.textContent = region.name;
      regionSelect.appendChild(option);
    });

    // Добавляем обработчики событий для кнопок фильтров
    const applyBtn = document.getElementById("applyFilters");
    const resetBtn = document.getElementById("resetFilters");

    if (applyBtn) {
      applyBtn.addEventListener("click", applyFilters);
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", resetFilters);
    }
  } catch (error) {
    console.error("Ошибка инициализации фильтров:", error);
  }
}

// Применение фильтров
function applyFilters() {
  const dateFrom = document.getElementById("dateFrom").value;
  const dateTo = document.getElementById("dateTo").value;
  const categoryId = document.getElementById("categoryFilter").value;
  const regionId = document.getElementById("regionFilter").value;

  // Обновляем глобальные фильтры
  currentFilters = {
    dateFrom: dateFrom || null,
    dateTo: dateTo || null,
    categoryId: categoryId || null,
    regionId: regionId || null,
  };

  // Показываем уведомление о применении фильтров
  const filterInfo = [];
  if (dateFrom)
    filterInfo.push(`с ${new Date(dateFrom).toLocaleDateString("ru-RU")}`);
  if (dateTo)
    filterInfo.push(`по ${new Date(dateTo).toLocaleDateString("ru-RU")}`);
  if (categoryId) {
    const categorySelect = document.getElementById("categoryFilter");
    const categoryName =
      categorySelect.options[categorySelect.selectedIndex].text;
    filterInfo.push(`категория: ${categoryName}`);
  }
  if (regionId) {
    const regionSelect = document.getElementById("regionFilter");
    const regionName = regionSelect.options[regionSelect.selectedIndex].text;
    filterInfo.push(`регион: ${regionName}`);
  }

  if (filterInfo.length > 0) {
    alert(`Фильтры применены: ${filterInfo.join(", ")}`);
  } else {
    alert("Фильтры сброшены - показаны все данные");
  }

  // Перезагружаем данные с учетом фильтров
  loadAllData();
}

// Сброс фильтров
function resetFilters() {
  document.getElementById("dateFrom").value = "";
  document.getElementById("dateTo").value = "";
  document.getElementById("categoryFilter").value = "";
  document.getElementById("regionFilter").value = "";

  // Сбрасываем глобальные фильтры
  currentFilters = {
    dateFrom: null,
    dateTo: null,
    categoryId: null,
    regionId: null,
  };

  alert("Фильтры сброшены");

  // Перезагружаем данные
  loadAllData();
}

// Функция для построения URL с параметрами фильтров
function buildApiUrl(baseUrl) {
  const params = new URLSearchParams();

  if (currentFilters.dateFrom) {
    params.append("dateFrom", currentFilters.dateFrom);
  }
  if (currentFilters.dateTo) {
    params.append("dateTo", currentFilters.dateTo);
  }
  if (currentFilters.categoryId) {
    params.append("categoryId", currentFilters.categoryId);
  }
  if (currentFilters.regionId) {
    params.append("regionId", currentFilters.regionId);
  }

  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}
