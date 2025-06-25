const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const multer = require("multer");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const app = express();
const port = 3001;

// Настройка CORS
app.use(cors());
app.use(express.json());

// Создаем папку для загрузок если её нет
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Настройка multer для загрузки файлов
const upload = multer({
  dest: uploadsDir,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Только Excel файлы разрешены!"), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Подключение к PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "bi_database",
  user: process.env.DB_USER || "bi_user",
  password: process.env.DB_PASSWORD || "bi_password",
});

// Проверка подключения к базе данных
pool.connect((err, client, release) => {
  if (err) {
    console.error("Ошибка подключения к базе данных:", err);
  } else {
    console.log("Успешное подключение к PostgreSQL");
    release();
  }
});

// API эндпоинты

// Доходы по категориям
app.get("/api/revenue-by-category", async (req, res) => {
  try {
    const { dateFrom, dateTo, categoryId, regionId } = req.query;

    let query = `
      SELECT 
        c.name as category,
        COUNT(s.id) as total_sales,
        SUM(s.quantity) as total_quantity,
        SUM(s.total_amount) as total_revenue,
        AVG(s.total_amount) as avg_sale_amount
      FROM sales s
      JOIN products p ON s.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      JOIN regions r ON s.region_id = r.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (dateFrom) {
      query += ` AND s.sale_date >= $${paramIndex}`;
      params.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      query += ` AND s.sale_date <= $${paramIndex}`;
      params.push(dateTo);
      paramIndex++;
    }

    if (categoryId) {
      query += ` AND c.id = $${paramIndex}`;
      params.push(categoryId);
      paramIndex++;
    }

    if (regionId) {
      query += ` AND r.id = $${paramIndex}`;
      params.push(regionId);
      paramIndex++;
    }

    query += `
      GROUP BY c.id, c.name
      ORDER BY total_revenue DESC
    `;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Ошибка получения данных по категориям:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Продажи по регионам
app.get("/api/sales-by-region", async (req, res) => {
  try {
    const { dateFrom, dateTo, categoryId, regionId } = req.query;

    let query = `
      SELECT 
        r.name as region,
        COUNT(s.id) as total_sales,
        SUM(s.quantity) as total_quantity,
        SUM(s.total_amount) as total_revenue,
        AVG(s.total_amount) as avg_sale_amount
      FROM sales s
      JOIN products p ON s.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      JOIN regions r ON s.region_id = r.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (dateFrom) {
      query += ` AND s.sale_date >= $${paramIndex}`;
      params.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      query += ` AND s.sale_date <= $${paramIndex}`;
      params.push(dateTo);
      paramIndex++;
    }

    if (categoryId) {
      query += ` AND c.id = $${paramIndex}`;
      params.push(categoryId);
      paramIndex++;
    }

    if (regionId) {
      query += ` AND r.id = $${paramIndex}`;
      params.push(regionId);
      paramIndex++;
    }

    query += `
      GROUP BY r.id, r.name
      ORDER BY total_revenue DESC
    `;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Ошибка получения данных по регионам:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Эффективность площадок
app.get("/api/platform-performance", async (req, res) => {
  try {
    const { dateFrom, dateTo, categoryId, regionId } = req.query;

    let query = `
      SELECT 
        pl.name as platform,
        pl.commission_rate,
        COUNT(s.id) as total_sales,
        SUM(s.total_amount) as gross_revenue,
        SUM(s.total_amount * pl.commission_rate / 100) as total_commission,
        SUM(s.total_amount - (s.total_amount * pl.commission_rate / 100)) as net_revenue
      FROM sales s
      JOIN products p ON s.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      JOIN regions r ON s.region_id = r.id
      JOIN platforms pl ON s.platform_id = pl.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (dateFrom) {
      query += ` AND s.sale_date >= $${paramIndex}`;
      params.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      query += ` AND s.sale_date <= $${paramIndex}`;
      params.push(dateTo);
      paramIndex++;
    }

    if (categoryId) {
      query += ` AND c.id = $${paramIndex}`;
      params.push(categoryId);
      paramIndex++;
    }

    if (regionId) {
      query += ` AND r.id = $${paramIndex}`;
      params.push(regionId);
      paramIndex++;
    }

    query += `
      GROUP BY pl.id, pl.name, pl.commission_rate
      ORDER BY gross_revenue DESC
    `;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Ошибка получения данных по площадкам:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Месячные тренды
app.get("/api/monthly-trends", async (req, res) => {
  try {
    const { dateFrom, dateTo, categoryId, regionId } = req.query;

    let query = `
      SELECT 
        DATE_TRUNC('month', sale_date) as month,
        COUNT(*) as total_sales,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as avg_sale_amount
      FROM sales s
      JOIN products p ON s.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      JOIN regions r ON s.region_id = r.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (dateFrom) {
      query += ` AND s.sale_date >= $${paramIndex}`;
      params.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      query += ` AND s.sale_date <= $${paramIndex}`;
      params.push(dateTo);
      paramIndex++;
    }

    if (categoryId) {
      query += ` AND c.id = $${paramIndex}`;
      params.push(categoryId);
      paramIndex++;
    }

    if (regionId) {
      query += ` AND r.id = $${paramIndex}`;
      params.push(regionId);
      paramIndex++;
    }

    query += `
      GROUP BY DATE_TRUNC('month', sale_date)
      ORDER BY month
    `;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Ошибка получения месячных трендов:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Общая статистика
app.get("/api/stats", async (req, res) => {
  try {
    const { dateFrom, dateTo, categoryId, regionId } = req.query;

    let salesQuery = `
      SELECT COUNT(*) as count, SUM(total_amount) as total 
      FROM sales s
      JOIN products p ON s.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      JOIN regions r ON s.region_id = r.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (dateFrom) {
      salesQuery += ` AND s.sale_date >= $${paramIndex}`;
      params.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      salesQuery += ` AND s.sale_date <= $${paramIndex}`;
      params.push(dateTo);
      paramIndex++;
    }

    if (categoryId) {
      salesQuery += ` AND c.id = $${paramIndex}`;
      params.push(categoryId);
      paramIndex++;
    }

    if (regionId) {
      salesQuery += ` AND r.id = $${paramIndex}`;
      params.push(regionId);
      paramIndex++;
    }

    const totalSales = await pool.query(salesQuery, params);

    // Создаем запрос для подсчета уникальных товаров с продажами
    let productsQuery = `
      SELECT COUNT(DISTINCT p.id) as count 
      FROM products p 
      JOIN sales s ON p.id = s.product_id
      JOIN categories c ON p.category_id = c.id
      JOIN regions r ON s.region_id = r.id
      WHERE 1=1
    `;

    // Создаем запрос для подсчета уникальных регионов с продажами
    let regionsQuery = `
      SELECT COUNT(DISTINCT r.id) as count 
      FROM regions r 
      JOIN sales s ON r.id = s.region_id
      JOIN products p ON s.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;

    // Добавляем те же условия фильтрации
    let paramIndex2 = 1;
    const params2 = [];

    if (dateFrom) {
      productsQuery += ` AND s.sale_date >= $${paramIndex2}`;
      regionsQuery += ` AND s.sale_date >= $${paramIndex2}`;
      params2.push(dateFrom);
      paramIndex2++;
    }

    if (dateTo) {
      productsQuery += ` AND s.sale_date <= $${paramIndex2}`;
      regionsQuery += ` AND s.sale_date <= $${paramIndex2}`;
      params2.push(dateTo);
      paramIndex2++;
    }

    if (categoryId) {
      productsQuery += ` AND c.id = $${paramIndex2}`;
      regionsQuery += ` AND c.id = $${paramIndex2}`;
      params2.push(categoryId);
      paramIndex2++;
    }

    if (regionId) {
      productsQuery += ` AND r.id = $${paramIndex2}`;
      regionsQuery += ` AND r.id = $${paramIndex2}`;
      params2.push(regionId);
      paramIndex2++;
    }

    const totalProducts = await pool.query(productsQuery, params2);
    const totalRegions = await pool.query(regionsQuery, params2);
    const totalPlatforms = await pool.query(
      "SELECT COUNT(*) as count FROM platforms"
    );

    res.json({
      total_sales: parseInt(totalSales.rows[0].count),
      total_revenue: parseFloat(totalSales.rows[0].total) || 0,
      total_products: parseInt(totalProducts.rows[0].count),
      total_regions: parseInt(totalRegions.rows[0].count),
      total_platforms: parseInt(totalPlatforms.rows[0].count),
    });
  } catch (err) {
    console.error("Ошибка получения общей статистики:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Топ товары
app.get("/api/top-products", async (req, res) => {
  try {
    const { dateFrom, dateTo, categoryId, regionId } = req.query;

    let query = `
      SELECT 
        p.name,
        c.name as category,
        COUNT(s.id) as sales_count,
        SUM(s.total_amount) as total_revenue,
        AVG(s.unit_price) as avg_price
      FROM sales s
      JOIN products p ON s.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      JOIN regions r ON s.region_id = r.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (dateFrom) {
      query += ` AND s.sale_date >= $${paramIndex}`;
      params.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      query += ` AND s.sale_date <= $${paramIndex}`;
      params.push(dateTo);
      paramIndex++;
    }

    if (categoryId) {
      query += ` AND c.id = $${paramIndex}`;
      params.push(categoryId);
      paramIndex++;
    }

    if (regionId) {
      query += ` AND r.id = $${paramIndex}`;
      params.push(regionId);
      paramIndex++;
    }

    query += `
      GROUP BY p.id, p.name, c.name
      ORDER BY total_revenue DESC
      LIMIT 10
    `;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Ошибка получения топ товаров:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Загрузка Excel файла
app.post("/api/upload-excel", upload.single("excelFile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Файл не загружен" });
    }

    console.log("Загружен файл:", req.file.originalname);

    // Читаем Excel файл
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log("Найдено записей:", data.length);

    // Валидация и обработка данных
    let processedCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        // Гибкое сопоставление колонок - поддерживаем разные варианты названий
        const product_name =
          row.product_name || row["Товар"] || row.name || row.product;
        const category_name =
          row.category_name || row["Категория"] || row.category;
        const region_name = row.region_name || row["Регион"] || row.region;
        const platform_name =
          row.platform_name || row["Площадка"] || row.platform;
        const quantity = row.quantity || row["Количество"] || row.qty;
        const unit_price =
          row.unit_price ||
          row["Цена за единицу"] ||
          row.price ||
          row.unit_cost;
        const sale_date = row.sale_date || row["Дата продажи"] || row.date;

        if (
          !product_name ||
          !category_name ||
          !region_name ||
          !platform_name ||
          !quantity ||
          !unit_price
        ) {
          throw new Error(`Строка ${i + 2}: Отсутствуют обязательные поля`);
        }

        // Получаем или создаем категорию
        let categoryResult = await pool.query(
          "SELECT id FROM categories WHERE name = $1",
          [category_name]
        );

        if (categoryResult.rows.length === 0) {
          categoryResult = await pool.query(
            "INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING id",
            [
              category_name,
              `Автоматически добавленная категория: ${category_name}`,
            ]
          );
        }
        const categoryId = categoryResult.rows[0].id;

        // Получаем или создаем регион
        let regionResult = await pool.query(
          "SELECT id FROM regions WHERE name = $1",
          [region_name]
        );

        if (regionResult.rows.length === 0) {
          regionResult = await pool.query(
            "INSERT INTO regions (name) VALUES ($1) RETURNING id",
            [region_name]
          );
        }
        const regionId = regionResult.rows[0].id;

        // Получаем или создаем площадку
        let platformResult = await pool.query(
          "SELECT id FROM platforms WHERE name = $1",
          [platform_name]
        );

        if (platformResult.rows.length === 0) {
          platformResult = await pool.query(
            "INSERT INTO platforms (name, commission_rate) VALUES ($1, $2) RETURNING id",
            [platform_name, 0.1] // 10% комиссия по умолчанию
          );
        }
        const platformId = platformResult.rows[0].id;

        // Получаем или создаем товар
        let productResult = await pool.query(
          "SELECT id FROM products WHERE name = $1 AND category_id = $2",
          [product_name, categoryId]
        );

        if (productResult.rows.length === 0) {
          productResult = await pool.query(
            "INSERT INTO products (name, category_id, price) VALUES ($1, $2, $3) RETURNING id",
            [product_name, categoryId, parseFloat(unit_price)]
          );
        }
        const productId = productResult.rows[0].id;

        // Добавляем продажу
        let saleDate = new Date();
        if (sale_date) {
          try {
            // Пытаемся парсить дату
            const parsedDate = new Date(sale_date);
            if (!isNaN(parsedDate.getTime())) {
              saleDate = parsedDate;
            }
          } catch (e) {
            console.log(
              `Не удалось парсить дату "${sale_date}", используем текущую дату`
            );
          }
        }

        const totalAmount = parseFloat(quantity) * parseFloat(unit_price);

        await pool.query(
          `INSERT INTO sales (product_id, region_id, platform_id, sale_date, quantity, unit_price, total_amount)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            productId,
            regionId,
            platformId,
            saleDate,
            quantity,
            unit_price,
            totalAmount,
          ]
        );

        processedCount++;
      } catch (error) {
        errorCount++;
        errors.push(`Строка ${i + 2}: ${error.message}`);
        console.error(`Ошибка обработки строки ${i + 2}:`, error.message);
      }
    }

    // Удаляем временный файл
    fs.unlinkSync(req.file.path);

    // Обновляем представления (если они существуют)
    try {
      await pool.query("REFRESH MATERIALIZED VIEW revenue_by_category");
    } catch (e) {
      console.log("Представление revenue_by_category не найдено, пропускаем");
    }

    try {
      await pool.query("REFRESH MATERIALIZED VIEW sales_by_region");
    } catch (e) {
      console.log("Представление sales_by_region не найдено, пропускаем");
    }

    try {
      await pool.query("REFRESH MATERIALIZED VIEW platform_performance");
    } catch (e) {
      console.log("Представление platform_performance не найдено, пропускаем");
    }

    try {
      await pool.query("REFRESH MATERIALIZED VIEW monthly_trends");
    } catch (e) {
      console.log("Представление monthly_trends не найдено, пропускаем");
    }

    res.json({
      success: true,
      message: "Файл успешно обработан",
      processed: processedCount,
      errors: errorCount,
      errorDetails: errors.slice(0, 10), // Показываем только первые 10 ошибок
    });
  } catch (error) {
    console.error("Ошибка обработки Excel файла:", error);

    // Удаляем временный файл в случае ошибки
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: "Ошибка обработки файла",
      details: error.message,
    });
  }
});

// Экспорт данных в Excel
app.get("/api/export-excel", async (req, res) => {
  try {
    console.log("Запрос на экспорт данных в Excel");

    // Получаем все данные о продажах
    const salesResult = await pool.query(`
      SELECT 
        p.name as product_name,
        c.name as category_name,
        r.name as region_name,
        pl.name as platform_name,
        s.quantity,
        s.unit_price,
        s.total_amount,
        s.sale_date
      FROM sales s
      JOIN products p ON s.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      JOIN regions r ON s.region_id = r.id
      JOIN platforms pl ON s.platform_id = pl.id
      ORDER BY s.sale_date DESC
    `);

    const salesData = salesResult.rows.map((row) => ({
      Товар: row.product_name,
      Категория: row.category_name,
      Регион: row.region_name,
      Площадка: row.platform_name,
      Количество: row.quantity,
      "Цена за единицу": parseFloat(row.unit_price),
      "Общая сумма": parseFloat(row.total_amount),
      "Дата продажи": new Date(row.sale_date).toLocaleDateString("ru-RU"),
    }));

    // Получаем статистику по категориям
    const categoryResult = await pool.query(
      "SELECT * FROM revenue_by_category ORDER BY total_revenue DESC"
    );
    const categoryData = categoryResult.rows.map((row) => ({
      Категория: row.category,
      "Количество продаж": row.total_sales,
      "Общий доход": parseFloat(row.total_revenue),
      "Средняя цена": parseFloat(row.avg_price),
    }));

    // Получаем статистику по регионам
    const regionResult = await pool.query(
      "SELECT * FROM sales_by_region ORDER BY total_revenue DESC"
    );
    const regionData = regionResult.rows.map((row) => ({
      Регион: row.region,
      "Количество продаж": row.total_sales,
      "Общий доход": parseFloat(row.total_revenue),
      "Средняя цена": parseFloat(row.avg_price),
    }));

    // Получаем топ товары
    const topProductsResult = await pool.query(`
      SELECT 
        p.name,
        c.name as category,
        COUNT(s.id) as sales_count,
        SUM(s.total_amount) as total_revenue,
        AVG(s.unit_price) as avg_price
      FROM sales s
      JOIN products p ON s.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      GROUP BY p.id, p.name, c.name
      ORDER BY total_revenue DESC
      LIMIT 20
    `);

    const topProductsData = topProductsResult.rows.map((row) => ({
      Товар: row.name,
      Категория: row.category,
      "Количество продаж": row.sales_count,
      "Общий доход": parseFloat(row.total_revenue),
      "Средняя цена": parseFloat(row.avg_price),
    }));

    // Создаем Excel файл
    const workbook = XLSX.utils.book_new();

    // Лист с продажами
    const salesWorksheet = XLSX.utils.json_to_sheet(salesData);
    XLSX.utils.book_append_sheet(workbook, salesWorksheet, "Продажи");

    // Лист с категориями
    const categoryWorksheet = XLSX.utils.json_to_sheet(categoryData);
    XLSX.utils.book_append_sheet(workbook, categoryWorksheet, "По категориям");

    // Лист с регионами
    const regionWorksheet = XLSX.utils.json_to_sheet(regionData);
    XLSX.utils.book_append_sheet(workbook, regionWorksheet, "По регионам");

    // Лист с топ товарами
    const topProductsWorksheet = XLSX.utils.json_to_sheet(topProductsData);
    XLSX.utils.book_append_sheet(workbook, topProductsWorksheet, "Топ товары");

    // Генерируем буфер Excel файла
    const excelBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // Устанавливаем заголовки для скачивания
    const fileName = `BI_Analytics_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Length", excelBuffer.length);

    console.log(`Экспорт завершен: ${salesData.length} продаж, ${fileName}`);

    // Отправляем файл
    res.send(excelBuffer);
  } catch (error) {
    console.error("Ошибка экспорта в Excel:", error);
    res.status(500).json({
      error: "Ошибка экспорта данных",
      details: error.message,
    });
  }
});

// Очистка всех данных
app.delete("/api/clear-data", async (req, res) => {
  try {
    console.log("Запрос на очистку всех данных");

    // Удаляем данные в правильном порядке (из-за внешних ключей)
    await pool.query("DELETE FROM sales");
    await pool.query("DELETE FROM products");
    await pool.query("DELETE FROM categories");
    await pool.query("DELETE FROM regions");
    await pool.query("DELETE FROM platforms");

    // Сбрасываем счетчики автоинкремента
    await pool.query("ALTER SEQUENCE sales_id_seq RESTART WITH 1");
    await pool.query("ALTER SEQUENCE products_id_seq RESTART WITH 1");
    await pool.query("ALTER SEQUENCE categories_id_seq RESTART WITH 1");
    await pool.query("ALTER SEQUENCE regions_id_seq RESTART WITH 1");
    await pool.query("ALTER SEQUENCE platforms_id_seq RESTART WITH 1");

    // Обновляем представления (если они существуют)
    try {
      await pool.query("REFRESH MATERIALIZED VIEW revenue_by_category");
    } catch (e) {
      console.log("Представление revenue_by_category не найдено, пропускаем");
    }

    try {
      await pool.query("REFRESH MATERIALIZED VIEW sales_by_region");
    } catch (e) {
      console.log("Представление sales_by_region не найдено, пропускаем");
    }

    try {
      await pool.query("REFRESH MATERIALIZED VIEW platform_performance");
    } catch (e) {
      console.log("Представление platform_performance не найдено, пропускаем");
    }

    try {
      await pool.query("REFRESH MATERIALIZED VIEW monthly_trends");
    } catch (e) {
      console.log("Представление monthly_trends не найдено, пропускаем");
    }

    console.log("Все данные успешно очищены");

    res.json({
      success: true,
      message: "Все данные успешно очищены",
    });
  } catch (error) {
    console.error("Ошибка очистки данных:", error);
    res.status(500).json({
      error: "Ошибка очистки данных",
      details: error.message,
    });
  }
});

// Получение списка категорий (только те, по которым есть продажи)
app.get("/api/categories", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT c.id, c.name 
      FROM categories c
      JOIN products p ON c.id = p.category_id
      JOIN sales s ON p.id = s.product_id
      ORDER BY c.name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Ошибка получения категорий:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Получение списка регионов (только те, по которым есть продажи)
app.get("/api/regions", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT r.id, r.name 
      FROM regions r
      JOIN sales s ON r.id = s.region_id
      ORDER BY r.name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Ошибка получения регионов:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Проверка здоровья API
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "BI API работает" });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`BI API сервер запущен на порту ${port}`);
});
