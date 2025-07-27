# 🔥 InciWeb Wildfire Incident Dashboard

This repository hosts an **automated scraper** that collects **wildfire incident data** from [InciWeb](https://inciweb.wildfire.gov/) and updates it **daily at 8:00 AM PST**.

It also includes a **live dashboard** (via GitHub Pages) that allows you to view, filter, and explore wildfire data easily.

---

## ✅ Features

- **Daily updates at 8:00 AM PST**
- Tracks **only wildfire incidents updated within the last 21 days**
- Each wildfire has its own CSV file
- **Automatically adds a new row whenever data changes**, preserving historical updates
- Captures data from:
  - _Table 1 – Fire overview_
  - _Table 2 – Daily status updates_
- Includes:
  - `Current as of`
  - `Incident Time Zone`
  - `Incident Type`
  - `Cause`
  - `Date of Origin`
  - `Location`
  - `Incident Commander`
  - `Latitude/Longitude`
  - `Acres`
  - `Containment`
  - `Personnel`
- Planned: **Aircraft usage (VLATs/LATs)** tracking

---

## 🌐 Live Dashboard

You can view the live dashboard here:

👉 **[Wildfire Incident Dashboard](https://mandarc64.github.io/inciweb-wildfire-data/)**

- **Dropdown to select any wildfire incident**
- **Expandable table view** – click on a row (like the date) to see all details
- Mobile-friendly & modern interface

---

## 📂 Data Structure

All data is stored in the folder:

```
inciweb_data/
```

Each CSV file corresponds to **one wildfire incident**.

- **File Naming:**
  ```
  <Incident_Name>.csv
  ```
- **Format:**
  ```
  ScrapeDate,Incident,Type,State,Size,Updated,
  CurrentAsOf,IncidentTimeZone,IncidentType,Cause,
  DateOfOrigin,Location,IncidentCommander,
  Coordinates,Latitude,Longitude,TotalPersonnel
  ```

Whenever a wildfire incident is updated, a **new row is added** to the same CSV.

---

## 🛠 How It Works

1. A **Node.js Puppeteer scraper** collects wildfire data daily.
2. It filters **only wildfires updated within the last 21 days**.
3. It checks if any data has changed:
   - If **no change**, nothing is added.
   - If **new info**, a **new row is appended** to the CSV.
4. The updated CSVs are **pushed to this repository automatically**.
5. GitHub Pages serves a **live interactive dashboard**.

---

## 🧑‍💻 Local Development

If you want to run the scraper manually:

```bash
git clone https://github.com/mandarc64/inciweb-wildfire-data.git
cd inciweb-wildfire-data

# Install dependencies
npm install

# Run the scraper
node iniweb.mjs
```

The updated CSV files will be stored in `inciweb_data/`.

---

## 🚀 Automation (GitHub Actions)

This repo uses **GitHub Actions** to:

- Run the scraper **daily at 8:00 AM PST**
- Commit & push updated CSV files
- Serve the dashboard via **GitHub Pages**

---

## 📊 Example Dashboard View

![Dashboard Screenshot](screenshot.png)  
_(Clicking on a date reveals extra columns)_

---

## 🔮 Planned Improvements

- ✅ **Aircraft usage tracking (VLATs/LATs)**
- ✅ Enhanced filtering & analytics in the dashboard
- ✅ Option to export selected wildfire data

---

## 📜 License

This project uses **public data from InciWeb** and is provided for research and academic purposes.

---

### 🤝 Contributions & Questions

Feel free to open an **issue** or **pull request** if you’d like to contribute.

For questions, contact **Mandar**.

---

🔥 _Stay updated with live wildfire data!_ 🔥
