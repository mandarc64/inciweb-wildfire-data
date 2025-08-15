# 🔥 FireTracker Pro - Wildfire Intelligence Dashboard

This repository hosts an **automated scraper** that collects **wildfire incident data** from [InciWeb](https://inciweb.wildfire.gov/) with **daily updates at 8:00 AM PST**.
It includes a **live dashboard** for monitoring wildfire incidents with flight tracking and analytics.

---

## ✅ Features

- **Daily updates at 8:00 AM PST**
- Tracks **only wildfire incidents updated within the last 21 days**
- **Flight operations tracking** - correlates aerial firefighting missions with incident data
- **Interactive charts**: Fire Growth, Containment Progress, Flight Activity Timeline
- **Dynamic statistics** showing fire size, growth rate, containment status, and flight operations
- **Export capabilities** - Download data as Excel, CSV, or PDF
- **Mobile-friendly interface**

---

## 🌐 Live Dashboard

👉 **[View Live Dashboard](https://mandarc64.github.io/inciweb-wildfire-data/)**

- **Dropdown to select any wildfire incident**
- **Real-time statistics cards** with key metrics
- **Interactive data table** with expandable flight details
- **Three charts** showing fire progression and flight activity

---

## 📂 Data Structure

### Wildfire Incident Data
```
inciweb_data/
├── Incident_Name_1.csv
├── Incident_Name_2.csv
└── ...
```

### Flight Operations Data
```
flight_fire_data/
├── flights_2025-08-01.csv
├── flights_2025-08-02.csv
└── ...
```

### Data Schema
**Wildfire Incidents:**
```csv
ScrapeDate,Incident,Type,State,Size,Updated,ContainmentPercent,
CurrentAsOf,IncidentTimeZone,IncidentType,Cause,DateOfOrigin,
Location,IncidentCommander,Coordinates,Latitude,Longitude,
TotalPersonnel
```

**Flight Operations:**
```csv
FlightDate,TailNumber,Origin,Destination,DistanceKM,FireIncident
```

---

## 🛠 How It Works

1. **Node.js Puppeteer scraper** collects wildfire data daily
2. Filters **only wildfires updated within the last 21 days**
3. Checks if any data has changed and adds new rows when needed
4. **Correlates flight operations** with wildfire incidents
5. Updated data is **pushed to this repository automatically**
6. **GitHub Pages** serves the live interactive dashboard

---

## 🧑‍💻 Local Development

```bash
git clone https://github.com/mandarc64/inciweb-wildfire-data.git
cd inciweb-wildfire-data

# Install dependencies
npm install

# Run the scraper
node inciweb.mjs
```

The updated CSV files will be stored in `inciweb_data/`.

---

## 🚀 Automation

This repo uses **GitHub Actions** to:
- Run the scraper **daily at 8:00 AM PST**
- Commit & push updated CSV files
- Serve the dashboard via **GitHub Pages**

## 📜 License

This project uses **public data from InciWeb** and is provided for research and academic purposes.

---

## 🤝 Contributions & Questions

Feel free to open an **issue** or **pull request** if you'd like to contribute.
For questions, contact **Mandar**.

---

🔥 *Real-time wildfire intelligence at your fingertips!* 🔥
