import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Folder for all CSVs
const OUTPUT_DIR = path.join(__dirname, "inciweb_data");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

// 🛠 Helper: parse "X days/hours/minutes ago" → Date
function getUpdatedDate(updatedText) {
  const now = new Date();
  if (updatedText.includes("second")) return now;

  const match = updatedText.match(/(\d+)\s+(minute|hour|day|week)s?\s+ago/);
  if (!match) return null;

  const value = parseInt(match[1], 10);
  const unit = match[2];
  const d = new Date(now);

  if (unit === "minute") d.setMinutes(now.getMinutes() - value);
  else if (unit === "hour") d.setHours(now.getHours() - value);
  else if (unit === "day") d.setDate(now.getDate() - value);
  else if (unit === "week") d.setDate(now.getDate() - value * 7);

  return d;
}

// 🛠 Helper: check if updated date is within 21 days
function isWithin21Days(updatedText) {
  const updatedDate = getUpdatedDate(updatedText);
  if (!updatedDate) return false;
  const now = new Date();
  const diffDays = (now - updatedDate) / (1000 * 60 * 60 * 24);
  return diffDays <= 21;
}

// 🛠 Helper: sanitize filename
function safeFilename(name) {
  return name.replace(/[^a-z0-9_\-]+/gi, "_");
}

// 🛠 Helper: read last row from CSV (if exists)
function getLastRow(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const lines = fs.readFileSync(filePath, "utf8").trim().split("\n");
  if (lines.length <= 1) return null; // only header exists
  const lastLine = lines[lines.length - 1];
  const parts = lastLine.split(",");
  return {
    ScrapeDate: parts[0]?.replace(/(^"|"$)/g, ""),
    Incident: parts[1]?.replace(/(^"|"$)/g, ""),
    Type: parts[2],
    State: parts[3],
    Size: parts[4]?.replace(/(^"|"$)/g, ""),
    Updated: parts[5]?.replace(/(^"|"$)/g, ""),
    CurrentAsOf: parts[6]?.replace(/(^"|"$)/g, ""),
    IncidentTimeZone: parts[7]?.replace(/(^"|"$)/g, ""),
    IncidentType: parts[8]?.replace(/(^"|"$)/g, ""),
    Cause: parts[9]?.replace(/(^"|"$)/g, ""),
    DateOfOrigin: parts[10]?.replace(/(^"|"$)/g, ""),
    Location: parts[11]?.replace(/(^"|"$)/g, ""),
    IncidentCommander: parts[12]?.replace(/(^"|"$)/g, ""),
    Coordinates: parts[13]?.replace(/(^"|"$)/g, ""),
    TotalPersonnel: parts[14]?.replace(/(^"|"$)/g, ""),
  };
}

// 🛠 Helper: compare if new data differs from last row
function hasChanged(lastRow, newRow) {
  if (!lastRow) return true; // no previous data, so new
  const keysToCompare = [
    "Size",
    "Updated",
    "State",
    "CurrentAsOf",
    "IncidentTimeZone",
    "IncidentType",
    "Cause",
    "DateOfOrigin",
    "Location",
    "IncidentCommander",
    "Coordinates",
    "TotalPersonnel",
  ];
  return keysToCompare.some((k) => (lastRow[k] || "") !== (newRow[k] || ""));
}

// 🛠 Scrape incident detail page for extra info (improved Coordinates parsing)
async function scrapeIncidentDetails(page, url) {
  console.log(`   ↳ Fetching details from ${url}`);
  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    // Wait for the detail section
    await page.waitForSelector("div.usa-accordion__content", {
      timeout: 30000,
    });

    const details = await page.evaluate(() => {
      const textMap = {};
      let debugCoordHtml = "";
      let debugCoordText = "";
      let debugCoordNodes = [];

      const tables = document.querySelectorAll("table.usa-table");
      tables.forEach((table) => {
        const rows = table.querySelectorAll("tbody tr");
        rows.forEach((row) => {
          const key = row.querySelector("th")?.innerText.trim();
          const td = row.querySelector("td");

          if (!key || !td) return;

          // Special debug for Coordinates row
          if (key.includes("Coordinate")) {
            debugCoordHtml = td.innerHTML;
            debugCoordText = td.innerText;
            debugCoordNodes = Array.from(td.childNodes).map((n, i) => ({
              index: i,
              type: n.nodeType,
              text: n.textContent.trim(),
            }));
          }

          let val = td.innerText.trim();

          if (key === "Coordinates") {
            // Collect all childNode text manually to avoid missing longitude parts
            const combined = Array.from(td.childNodes)
              .map((n) => n.textContent.trim())
              .filter(Boolean)
              .join(" ");

            // Now extract Latitude and Longitude separately
            const latMatch = combined.match(/([\d°'\s]+Latitude)/i);
            const lonMatch = combined.match(/(-?[\d°'\s]+Longitude)/i);

            if (latMatch) {
              let lat = latMatch[1];
              lat = lat.replace(/\s+/g, " ").trim(); // normalize spaces
              textMap["Latitude"] = lat;
            }
            if (lonMatch) {
              let lon = lonMatch[1];
              lon = lon.replace(/\s+/g, " ").trim(); // normalize spaces
              textMap["Longitude"] = lon;
            }

            // Also keep combined cleaned version
            textMap["Coordinates"] = [
              textMap["Latitude"] || "",
              textMap["Longitude"] || "",
            ]
              .filter(Boolean)
              .join(", ");
          } else {
            textMap[key.replace(/:$/, "")] = val;
          }
        });
      });

      return {
        debug: {
          rawCoordHtml: debugCoordHtml,
          rawCoordText: debugCoordText,
          rawCoordNodes: debugCoordNodes,
          keysFound: Object.keys(textMap),
        },
        extracted: {
          CurrentAsOf: textMap["Current as of"] || "",
          IncidentTimeZone: textMap["Incident Time Zone"] || "",
          IncidentType: textMap["Incident Type"] || "",
          Cause: textMap["Cause"] || "",
          DateOfOrigin: textMap["Date of Origin"] || "",
          Location: textMap["Location"] || "",
          IncidentCommander: textMap["Incident Commander"] || "",
          Coordinates: textMap["Coordinates"] || "",
          Latitude: textMap["Latitude"] || "",
          Longitude: textMap["Longitude"] || "",
          TotalPersonnel:
            textMap["Total Personnel"] || textMap["Total Personnel:"] || "",
          Size: textMap["Size"] || "",
        },
      };
    });

    // Print debug for Coordinates extraction
    console.log("   [DEBUG] Keys found:", details.debug.keysFound);
    console.log(
      "   [DEBUG] Coordinates innerHTML:",
      details.debug.rawCoordHtml
    );
    console.log(
      "   [DEBUG] Coordinates innerText:",
      details.debug.rawCoordText
    );
    console.log(
      "   [DEBUG] Coordinates childNodes:",
      details.debug.rawCoordNodes
    );
    console.log("   [DEBUG] Extracted details:", details.extracted);

    return details.extracted;
  } catch (err) {
    console.warn(`⚠️ Failed to fetch details for ${url}: ${err.message}`);
    return {
      CurrentAsOf: "",
      IncidentTimeZone: "",
      IncidentType: "",
      Cause: "",
      DateOfOrigin: "",
      Location: "",
      IncidentCommander: "",
      Coordinates: "",
      Latitude: "",
      Longitude: "",
      TotalPersonnel: "",
    };
  }
}

// 🛠 Main function
async function scrapeInciwebWildfires() {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-software-rasterizer",
    ],
  });

  const page = await browser.newPage();
  const url = "https://inciweb.wildfire.gov/accessible-view";

  console.log("🌐 Loading InciWeb Accessible View...");
  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

  // Wait for the table
  await page.waitForSelector("table.usa-table.cols-5.sticky-enabled tbody");

  const allData = await page.$$eval(
    "table.usa-table.cols-5.sticky-enabled tbody tr",
    (rows) =>
      rows.map((row) => {
        const cols = row.querySelectorAll("td");
        const link = cols[0]?.querySelector("a")?.href || "";
        if (!cols.length) return null;
        return {
          incident: cols[0].innerText.trim(),
          type: cols[1].innerText.trim(),
          state: cols[2].innerText.trim(),
          size: cols[3].innerText.trim(),
          updated: cols[4].innerText.trim(),
          url: link,
        };
      })
  );

  // Filter only Wildfires
  let wildfires = allData.filter((row) => row?.type === "Wildfire");

  // Filter only within last 21 days
  wildfires = wildfires.filter((wf) => isWithin21Days(wf.updated));

  console.log(`🔥 Found ${wildfires.length} active wildfires (last 21 days)`);

  const scrapeDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  for (const wf of wildfires) {
    const incidentFile = safeFilename(wf.incident) + ".csv";
    const filePath = path.join(OUTPUT_DIR, incidentFile);

    // Scrape detail page
    const detailData = await scrapeIncidentDetails(page, wf.url);

    // Merge all data
    const newRow = {
      ScrapeDate: scrapeDate,
      Incident: wf.incident,
      Type: wf.type,
      State: wf.state,
      Size: wf.size,
      Updated: wf.updated,
      ...detailData,
    };

    // Check if file exists and compare last row
    const lastRow = getLastRow(filePath);

    if (!hasChanged(lastRow, newRow)) {
      console.log(`⏩ No change for ${wf.incident}, skipping`);
      continue;
    }

    // If file doesn't exist → create with header
    if (!fs.existsSync(filePath)) {
      const header =
        [
          "ScrapeDate",
          "Incident",
          "Type",
          "State",
          "Size",
          "Updated",
          "CurrentAsOf",
          "IncidentTimeZone",
          "IncidentType",
          "Cause",
          "DateOfOrigin",
          "Location",
          "IncidentCommander",
          "Coordinates",
          "Latitude",
          "Longitude",
          "TotalPersonnel",
        ].join(",") + "\n";
      fs.writeFileSync(filePath, header, "utf8");
    }

    // Append new row
    const rowLine =
      [
        newRow.ScrapeDate,
        `"${newRow.Incident}"`,
        newRow.Type,
        newRow.State,
        `"${newRow.Size}"`,
        `"${newRow.Updated}"`,
        `"${newRow.CurrentAsOf}"`,
        `"${newRow.IncidentTimeZone}"`,
        `"${newRow.IncidentType}"`,
        `"${newRow.Cause}"`,
        `"${newRow.DateOfOrigin}"`,
        `"${newRow.Location}"`,
        `"${newRow.IncidentCommander}"`,
        `"${newRow.Coordinates}"`,
        `"${newRow.Latitude}"`,
        `"${newRow.Longitude}"`,
        `"${newRow.TotalPersonnel}"`,
      ].join(",") + "\n";

    fs.appendFileSync(filePath, rowLine, "utf8");
    console.log(`✅ Updated: ${wf.incident}`);
  }

  await browser.close();
  console.log("✅ Done! Per-incident CSVs saved in inciweb_data/");
}

scrapeInciwebWildfires().catch(console.error);
