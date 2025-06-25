# BI Система с PostgreSQL и веб-дашбордом

Современная система аналитики продаж с веб-интерфейсом, фильтрами и универсальным дизайном в Docker.

## Архитектура

```
PostgreSQL (5432) ← Node.js API (3001) ← Веб-дашборд (3000)
```

## Быстрый старт

### Запуск системы

```bash
docker-compose up -d
```

### Доступ к системам

- **Веб-дашборд**: http://localhost:3000
- **API**: http://localhost:3001/api
- **PostgreSQL**: localhost:5432
  - База: `bi_database`
  - Логин: `bi_user` / `bi_password`

## Основные возможности

### Веб-дашборд

- **Универсальный дизайн**: Черно-белая-серая цветовая схема
- **Интерактивные графики**: Chart.js с адаптивным дизайном
- **Умные фильтры**: По датам, категориям и регионам (только с реальными данными)
- **Аналитика в реальном времени**:
  - Доходы по категориям
  - Продажи по регионам
  - Эффективность площадок
  - Временные тренды
  - Топ товары
- **Автообновление**: Каждые 30 секунд
- **Функция очистки**: Полная очистка данных с подтверждением

### Импорт/Экспорт Excel файлов

#### Импорт

1. Откройте дашборд
2. Перетащите Excel файл в зону загрузки
3. Данные автоматически добавятся в базу

**Поддерживаемые форматы Excel:**

| Поле          | Альтернативные названия           | Обязательное |
| ------------- | --------------------------------- | ------------ |
| product_name  | Товар, name, product              | ✅           |
| category_name | Категория, category               | ✅           |
| region_name   | Регион, region                    | ✅           |
| platform_name | Площадка, platform                | ✅           |
| quantity      | Количество, qty                   | ✅           |
| unit_price    | Цена за единицу, price, unit_cost | ✅           |
| sale_date     | Дата продажи, date                | ❌           |

#### Экспорт

- **Кнопка "Скачать Excel"**: Экспорт всех данных в многолистовой Excel файл
- **Листы**: Продажи, По категориям, По регионам, Топ товары

### Умные фильтры

- **Фильтр по датам**: От/До с календарем
- **Фильтр по категориям**: Только категории с продажами
- **Фильтр по регионам**: Только регионы с продажами
- **Применение фильтров**: Влияет на все графики и статистику
- **Сброс фильтров**: Возврат к полным данным

### API эндпоинты

#### Основные данные

```bash
GET /api/stats                 # Общая статистика (с фильтрами)
GET /api/revenue-by-category   # Доходы по категориям (с фильтрами)
GET /api/sales-by-region       # Продажи по регионам (с фильтрами)
GET /api/platform-performance  # Эффективность площадок (с фильтрами)
GET /api/monthly-trends        # Месячные тренды (с фильтрами)
GET /api/top-products          # Топ товары (с фильтрами)
```

#### Справочники (умные - только с данными)

```bash
GET /api/categories            # Категории с продажами
GET /api/regions               # Регионы с продажами
```

#### Управление данными

```bash
POST /api/upload-excel         # Загрузка Excel файла
GET /api/export-excel          # Экспорт данных в Excel
DELETE /api/clear-data         # Полная очистка данных
GET /api/health                # Проверка состояния API
```

#### Параметры фильтров

Все эндпоинты поддерживают query параметры:

- `dateFrom` - дата начала (YYYY-MM-DD)
- `dateTo` - дата окончания (YYYY-MM-DD)
- `categoryId` - ID категории
- `regionId` - ID региона

**Пример:**

```bash
GET /api/stats?dateFrom=2024-01-01&dateTo=2024-12-31&categoryId=1
```

## Управление Docker

### Основные команды

```bash
# Запуск
docker-compose up -d

# Остановка
docker-compose down

# Остановка с удалением данных
docker-compose down -v

# Перезапуск с пересборкой
docker-compose up -d --build

# Перезапуск отдельного сервиса
docker-compose restart api-server

# Логи
docker-compose logs web-dashboard
docker-compose logs api-server
docker-compose logs postgres

# Подключение к БД
docker exec -it bi_postgres psql -U bi_user -d bi_database
```

### Резервное копирование

```bash
# Бэкап базы данных
docker exec bi_postgres pg_dump -U bi_user bi_database > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановление из бэкапа
docker exec -i bi_postgres psql -U bi_user bi_database < backup.sql

# Бэкап с сжатием
docker exec bi_postgres pg_dump -U bi_user -Fc bi_database > backup.dump
```

## Структура проекта

```
BI/
├── docker-compose.yml         # Конфигурация Docker
├── README.md                  # Документация
├── .gitignore                 # Исключения для Git
├── sample_data.csv            # Пример данных
├── postgres/
│   └── init.sql              # Инициализация БД (чистая структура)
├── api/
│   ├── server.js             # API сервер с фильтрами
│   ├── package.json          # Зависимости Node.js
│   └── package-lock.json     # Точные версии пакетов
└── web/
    ├── index.html            # Главная страница
    ├── styles.css            # Универсальные стили
    └── script.js             # Логика фронтенда с фильтрами
```

## Настройка и конфигурация

### Изменение портов

Если порты заняты, измените их в `docker-compose.yml`:

```yaml
services:
  web-dashboard:
    ports:
      - "8080:80" # Веб на порту 8080

  api-server:
    ports:
      - "8081:3001" # API на порту 8081

  postgres:
    ports:
      - "5433:5432" # PostgreSQL на порту 5433
```

### Переменные окружения

```yaml
environment:
  - DB_HOST=postgres
  - DB_PORT=5432
  - DB_NAME=bi_database
  - DB_USER=bi_user
  - DB_PASSWORD=bi_password
```

## Устранение неполадок

### Проверка состояния

```bash
# Статус контейнеров
docker-compose ps

# Проверка API
curl http://localhost:3001/api/health

# Проверка подключения к БД
docker exec bi_postgres pg_isready -U bi_user
```

### Частые проблемы

#### Порты заняты

```bash
# Найти процесс на порту
netstat -tulpn | grep :3000
# Или
lsof -i :3000

# Остановить процесс
kill -9 <PID>
```

#### Данные не отображаются

1. Проверьте статус контейнеров: `docker-compose ps`
2. Проверьте логи API: `docker-compose logs api-server`
3. Проверьте логи БД: `docker-compose logs postgres`
4. Откройте консоль браузера (F12) для JS ошибок

#### База данных не инициализируется

```bash
# Полная очистка и пересоздание
docker-compose down -v
docker-compose up -d
```

#### Проблемы с загрузкой Excel

- Проверьте формат файла (только .xlsx, .xls)
- Убедитесь, что есть все обязательные колонки
- Проверьте размер файла (лимит 10MB)

## Обновление системы

### Обновление кода

```bash
git pull origin main
docker-compose down
docker-compose up -d --build
```

### Миграция данных

При обновлении структуры БД:

1. Сделайте бэкап данных
2. Обновите код
3. Пересоздайте контейнеры
4. Восстановите данные при необходимости

## Производительность

### Оптимизация

- **Индексы БД**: Автоматически созданы для всех ключевых полей
- **Кэширование**: API использует эффективные SQL запросы
- **Пагинация**: Топ товары ограничены 10 записями
- **Сжатие**: Gzip для статических файлов

### Мониторинг

```bash
# Использование ресурсов
docker stats

# Размер базы данных
docker exec bi_postgres psql -U bi_user -d bi_database -c "SELECT pg_size_pretty(pg_database_size('bi_database'));"
```

## Разработка

### Локальная разработка

```bash
# API (требует Node.js)
cd api
npm install
npm start

# Веб (любой HTTP сервер)
cd web
python -m http.server 3000
# или
npx serve .
```

### Добавление новых функций

1. Обновите API в `api/server.js`
2. Добавьте фронтенд логику в `web/script.js`
3. Обновите стили в `web/styles.css`
4. Протестируйте с Docker

---
**Лицензия**: MIT
