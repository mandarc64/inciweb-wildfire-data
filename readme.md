# 🔥 FireTracker Pro - InciWeb Wildfire Intelligence Dashboard

This repository hosts an **automated scraper** that collects **wildfire incident data** from [InciWeb](https://inciweb.wildfire.gov/) with **daily updates at 8:00 AM PST**.
It includes a **comprehensive live dashboard** (via GitHub Pages) for monitoring wildfire incidents with real-time flight tracking and advanced analytics.

---

## ✨ Key Features

### 📊 **Live Intelligence Dashboard**
- **Real-time wildfire monitoring** with interactive charts and analytics
- **Flight operations tracking** - correlates aerial firefighting missions with incident data
- **Dynamic statistics cards** showing fire size, growth rate, containment progress, and flight operations
- **Three interactive charts**: Fire Growth Over Time, Containment Progress, Flight Activity Timeline
- **Responsive design** with modern glassmorphism UI
- **Export capabilities** - Download data as Excel, CSV, or PDF

### 🔄 **Automated Data Collection**
- **Daily updates at 8:00 AM PST**
- Tracks **only wildfire incidents updated within the last 21 days**
- **Historical data preservation** - new row added whenever data changes
- **Flight data integration** from multiple sources
- **Smart deduplication** to ensure data quality

### 📈 **Advanced Analytics**
- **Growth rate calculation** (acres burned per day)
- **Containment trend analysis** with directional indicators
- **Flight activity correlation** with incident timeline
- **Days active tracking** from origin date
- **Real-time data freshness** indicators

---

## 🌐 Live Dashboard

👉 **[Access FireTracker Pro Dashboard](https://mandarc64.github.io/inciweb-wildfire-data/)**

### Dashboard Features:
- **Incident selector** - Choose from active wildfire incidents
- **Real-time statistics** - Current fire size, growth rate, containment status
- **Interactive data table** with expandable flight details
- **Export tools** - Download incident data in multiple formats
- **Mobile-optimized** responsive design
- **Professional UI** with dark/light theme support

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

### Data Pipeline
1. **Scraper Collection**: Node.js Puppeteer scraper runs daily
2. **Data Filtering**: Only processes wildfires updated within 21 days
3. **Change Detection**: Compares new data with existing records
4. **Flight Correlation**: Matches flight operations with fire incidents
5. **Data Storage**: Updates CSV files with new information
6. **Dashboard Update**: Live dashboard reflects latest data automatically

### Intelligence Features
- **Window-based flight matching**: Correlates flights with specific incident periods
- **Temporal analysis**: Tracks fire progression and response efforts
- **Multi-source integration**: Combines incident and flight data seamlessly

---

## 🧑‍💻 Development

### Local Setup
```bash
git clone https://github.com/mandarc64/inciweb-wildfire-data.git
cd inciweb-wildfire-data

# Install dependencies
npm install

# Run the scraper
node inciweb.mjs

# Run flight data collector
node flight-scraper.mjs
```

### Development Features
- **Modular architecture** for easy maintenance
- **Error handling** and retry mechanisms
- **Data validation** and quality checks
- **Configurable parameters** for different data sources

---

## 🚀 Automation & Infrastructure

### GitHub Actions Workflows
- **Daily scraping** at 8:00 AM PST
- **Automated data processing** and validation
- **GitHub Pages deployment** for dashboard
- **Error monitoring** and notifications

### Performance Optimizations
- **Incremental data loading** for large datasets
- **Client-side caching** for improved responsiveness
- **Lazy loading** of charts and components
- **Efficient data deduplication** algorithms

---

## 📊 Dashboard Screenshots

![Dashboard Overview](screenshot-overview.png)
*Main dashboard with statistics cards and interactive charts*

![Incident Details](screenshot-table.png)
*Detailed incident table with flight operation tracking*

![Chart Analytics](screenshot-charts.png)
*Fire growth, containment progress, and flight activity visualization*

---

## 🔮 Roadmap & Planned Features

### ✅ **Completed**
- [x] Real-time flight operations tracking
- [x] Advanced dashboard with multiple chart types
- [x] Export functionality (Excel, CSV, PDF)
- [x] Responsive modern UI design
- [x] Automated data correlation

### 🚧 **In Progress**
- [ ] Weather data integration
- [ ] Predictive analytics for fire spread
- [ ] Alert system for critical incidents
- [ ] API endpoints for data access

### 📋 **Planned**
- [ ] Satellite imagery integration
- [ ] Resource allocation optimization
- [ ] Multi-agency data sources
- [ ] Mobile app companion
- [ ] Historical trend analysis (multi-year)

---

## 🔧 Technical Stack

**Backend:**
- Node.js with Puppeteer for web scraping
- GitHub Actions for automation
- CSV-based data storage for simplicity

**Frontend:**
- Vanilla JavaScript with modern ES6+
- Chart.js for data visualization
- DataTables for advanced table functionality
- Bootstrap 5 + custom CSS for responsive design

**Infrastructure:**
- GitHub Pages for hosting
- GitHub API for data management
- Automated CI/CD pipeline

---

## 📊 Data Sources

- **Primary**: [InciWeb Wildfire Portal](https://inciweb.wildfire.gov/)
- **Flight Data**: Multiple aviation tracking sources
- **Updates**: Real-time via automated scraping
- **Retention**: 21-day rolling window for active incidents

---

## 📜 License & Usage

This project uses **public data from InciWeb** and aviation sources. Provided for:
- Research and academic purposes
- Emergency management planning
- Public awareness and education
- Open source community development

**Data Attribution**: All wildfire data sourced from InciWeb

---

## 🤝 Contributing

### How to Contribute
1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Areas for Contribution
- Data source integrations
- Dashboard enhancements
- Performance optimizations
- Documentation improvements
- Bug fixes and testing

### Development Guidelines
- Follow existing code style and conventions
- Add tests for new features
- Update documentation as needed
- Ensure mobile responsiveness

---

## 📞 Contact & Support

**Project Maintainer**: Mandar  
**Issues**: [GitHub Issues](https://github.com/mandarc64/inciweb-wildfire-data/issues)  
**Discussions**: [GitHub Discussions](https://github.com/mandarc64/inciweb-wildfire-data/discussions)

For questions about data usage, feature requests, or collaboration opportunities, please open an issue or discussion.

---

🔥 *Real-time wildfire intelligence at your fingertips!* 🔥
