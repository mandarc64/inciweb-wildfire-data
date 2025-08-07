import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import puppeteer from "puppeteer";
import chalk from "chalk";

// === CONFIG ===
const DATA_DIR = "./inciweb_data";
const RADIUS_KM = 30;
const TAIL_NUMBERS = [
  "N131CG",
  // "N132CG",
  // "N136CG",
  // "N137CG",
  // "N138CG",
  // "N140CG",
  // "N291EA",
  // "N292EA",
  // "N293EA",
  // "N294EA",
  // "N295EA",
  // "N296EA",
  // "N297EA",
  // "N325AC",
  // "N354AC",
  // "N355AC",
  // "N366AC",
  // "N374AC",
  // "N385AC",
  // "N386AC",
  // "N389AC",
  // "N416AC",
  // "N635AC",
  // "N839AC",
  // "N988AC",
  // "N998AC",
  // "N406BT",
  // "N415BT",
  // "N417BT",
  // "N418BT",
  // "N419BT",
  // "N470NA",
  // "N471NA",
  // "N472NA",
  // "N473NA",
  // "N474NA",
  // "N475NA",
  // "N476NA",
  // "N477NA",
  // "N478NA",
  // "N479NA",
  // "N522AX",
  // "N603AX",
  // "N612AX",
  // "N17085",
];

// === UTILITIES ===
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ✅ Utility to calculate days difference
function daysBetween(d1, d2) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((d1 - d2) / msPerDay);
}

function dmsToDecimal(dmsStr) {
  const match = dmsStr.match(/(\d+)[°]\s*(\d+)[']?\s*(\d+)?/);
  if (!match) return NaN;
  const deg = parseFloat(match[1]);
  const min = parseFloat(match[2] || 0);
  const sec = parseFloat(match[3] || 0);
  return deg + min / 60 + sec / 3600;
}

function parseCoordinates(coordStr) {
  const parts = coordStr.split(",");
  if (parts.length !== 2) return null;
  const lat = dmsToDecimal(parts[0].trim());
  const lon = -Math.abs(dmsToDecimal(parts[1].trim()));
  return { lat, lon };
}

function parseUpdatedAgo(updatedStr) {
  let ms = 0;
  const day = updatedStr.match(/(\d+)\s*day/);
  const hr = updatedStr.match(/(\d+)\s*hour/);
  const min = updatedStr.match(/(\d+)\s*min/);
  if (day) ms += parseInt(day[1]) * 86400000;
  if (hr) ms += parseInt(hr[1]) * 3600000;
  if (min) ms += parseInt(min[1]) * 60000;
  return ms;
}

function parseDateOfOrigin(rawStr, file) {
  try {
    const cleaned = rawStr.includes(" - ")
      ? rawStr.split(" - ")[0].trim() // "Tue, 07/23/2024"
      : rawStr.trim();

    // Extract just the date part: "07/23/2024"
    const match = cleaned.match(/\d{2}\/\d{2}\/\d{4}/);
    if (!match) {
      console.warn(
        chalk.red(
          `⚠️ Unable to extract MM/DD/YYYY from "${rawStr}" in file "${file}"`
        )
      );
      return null;
    }

    const [month, day, year] = match[0].split("/");
    const parsed = new Date(
      Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day))
    );

    if (isNaN(parsed)) {
      console.warn(
        chalk.red(
          `⚠️ Failed to parse extracted date: "${match[0]}" from "${rawStr}" in file "${file}"`
        )
      );
      return null;
    }

    return parsed;
  } catch (err) {
    console.error(
      chalk.red(
        `❌ Exception while parsing DateOfOrigin in file "${file}": "${rawStr}"`
      )
    );
    return null;
  }
}

// === LOAD FIRES ===
function loadFires() {
  const fires = [];
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".csv"));

  for (const file of files) {
    const fullPath = path.join(DATA_DIR, file);
    const content = fs.readFileSync(fullPath, "utf-8");

    let rows;
    try {
      rows = parse(content, {
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true,
        quote: '"',
      });
    } catch (err) {
      console.error(chalk.red(`❌ Error parsing CSV file: ${file}`));
      console.error(chalk.yellow(err.message));
      continue; // Skip this file and move on
    }

    for (const row of rows) {
      const {
        Incident,
        Coordinates,
        DateOfOrigin,
        Updated,
        ScrapeDate,
        ContainmentPercent,
      } = row;
      if (!Incident || !Coordinates || !DateOfOrigin || !Updated || !ScrapeDate)
        continue;

      const coords = parseCoordinates(Coordinates);
      if (!coords) continue;

      const start = parseDateOfOrigin(DateOfOrigin, file);
      if (!start) continue; // skip if invalid

      // ⛔️ Manually skip edge case fire
      if (Incident === "Elkhorn Fire - IDPAF") {
        console.log(
          chalk.yellow(`⚠️ Skipping Elkhorn Fire (hardcoded exception)`)
        );
        continue;
      }
      const scrape = new Date(ScrapeDate);
      const updatedAgo = parseUpdatedAgo(Updated);
      const end = new Date(scrape.getTime() - updatedAgo);

      // 🔁 Filter based on containment and staleness
      const containmentNum = parseFloat(
        ContainmentPercent?.replace("%", "") || "0"
      );
      const updatedDaysAgo = daysBetween(scrape, end);

      if (containmentNum > 80 || updatedDaysAgo > 7) {
        console.log(
          chalk.gray(
            `⏩ Skipping ${Incident} (Containment: ${containmentNum}%, Updated ${updatedDaysAgo}d ago)`
          )
        );
        continue;
      }

      // console.log(chalk.blueBright(`\n🔥 Fire: ${Incident}`));
      // console.log(
      //   chalk.gray(
      //     `🗓️  Active: ${start.toISOString().split("T")[0]} → ${
      //       end.toISOString().split("T")[0]
      //     }`
      //   )
      // );
      // console.log(
      //   chalk.gray(
      //     `📍 Target Coords: lat=${coords.lat.toFixed(
      //       6
      //     )}, lon=${coords.lon.toFixed(6)}`
      //   )
      // );

      fires.push({
        incident: Incident,
        lat: coords.lat,
        lon: coords.lon,
        start,
        end,
      });
    }
  }

  let earliestStart = null;
  let earliestFire = null;

  if (fires.length) {
    const sorted = fires.sort((a, b) => a.start - b.start);
    earliestStart = sorted[0].start;
    earliestFire = sorted[0].incident;
  }

  return { fires, earliestStart, earliestFire };
}

// === SCRAPE FLIGHTS & MATCH TO FIRES ===
async function scrapeAndMatchFlights() {
  const { fires, earliestStart, earliestFire } = loadFires();
  console.log(chalk.cyan(`🔥 Loaded ${fires.length} fires`));

  if (!earliestStart) {
    console.log(chalk.red("❌ No valid fires to process."));
    return;
  }

  const today = new Date();
  const FLIGHT_LOOKBACK_DAYS = daysBetween(today, earliestStart);
  console.log(
    chalk.yellow(
      `🔎 Using dynamic FLIGHT_LOOKBACK_DAYS = ${FLIGHT_LOOKBACK_DAYS}`
    )
  );

  console.log(
    chalk.yellow(
      `🔎 Using dynamic FLIGHT_LOOKBACK_DAYS = ${FLIGHT_LOOKBACK_DAYS} (from "${earliestFire}" on ${
        earliestStart.toISOString().split("T")[0]
      })`
    )
  );

  const browser = await puppeteer.connect({
    browserURL: "http://127.0.0.1:9222", // or whatever port you're using
  });
  const page = await browser.newPage();
  const results = [];

  for (const tail of TAIL_NUMBERS) {
    console.log(chalk.cyan(`✈️  Checking ${tail}...`));
    const historyUrl = `https://www.flightaware.com/live/flight/${tail}/history`;
    await page.goto(historyUrl, { waitUntil: "networkidle2" });

    const flights = await page.$$eval("table.prettyTable tbody tr", (rows) =>
      rows
        .map((tr) => {
          const tds = [...tr.querySelectorAll("td")];
          const dateText = tds[0]?.innerText.trim();
          const origin = tds[1]?.innerText.trim();
          const destination = tds[2]?.innerText.trim();
          const href = tr
            .querySelector("a[href*='/history/']")
            ?.getAttribute("href");
          return { date: dateText, origin, destination, href };
        })
        .filter((f) => f.href)
    );

    const parsedFlights = flights.map((f) => {
      const [day, monAbbr, year] = f.date.split("-");
      const monthMap = {
        Jan: "01",
        Feb: "02",
        Mar: "03",
        Apr: "04",
        May: "05",
        Jun: "06",
        Jul: "07",
        Aug: "08",
        Sep: "09",
        Oct: "10",
        Nov: "11",
        Dec: "12",
      };
      const isoDate = `${year}-${monthMap[monAbbr]}-${day.padStart(2, "0")}`;
      return { ...f, isoDate };
    });

    const filteredFlights = parsedFlights.filter((f) => {
      const flightDate = new Date(f.isoDate);
      const daysAgo = daysBetween(today, flightDate);
      return daysAgo <= FLIGHT_LOOKBACK_DAYS;
    });

    for (const flight of filteredFlights) {
      const flightDate = new Date(flight.isoDate);
      const trackUrl = `https://www.flightaware.com${flight.href}/tracklog`;

      console.log(chalk.blue(`  📡 Fetching: ${trackUrl}`));
      const tp = await browser.newPage();
      await tp.goto(trackUrl, { waitUntil: "networkidle2" });

      const coords = await tp.$$eval("table.prettyTable tbody tr", (rows) =>
        rows
          .map((tr) => {
            const cells = [...tr.querySelectorAll("td")].map((td) =>
              td.innerText.trim()
            );
            return {
              lat: parseFloat(cells[1]),
              lon: parseFloat(cells[2]),
            };
          })
          .filter((c) => !isNaN(c.lat) && !isNaN(c.lon))
      );

      await tp.close();

      for (const fire of fires) {
        if (flightDate < fire.start || flightDate > fire.end) continue;

        for (const pt of coords) {
          const dist = haversine(pt.lat, pt.lon, fire.lat, fire.lon);
          if (dist <= RADIUS_KM) {
            console.log(
              chalk.green(
                `    ✅ Match with ${fire.incident} — ${dist.toFixed(2)} km`
              )
            );
            results.push({
              tail,
              flightDate: flight.isoDate,
              fire: fire.incident,
              fireDateStart: fire.start.toISOString().split("T")[0],
              fireDateEnd: fire.end.toISOString().split("T")[0],
              distance: dist.toFixed(2),
              origin: flight.origin,
              destination: flight.destination,
            });
            break; // Only one match per fire per flight needed
          }
        }
      }
    }
  }

  await browser.close();

  // === Write results ===
  const out = [
    "TailNumber,FlightDate,Origin,Destination,FireIncident,FireStart,FireEnd,DistanceKM",
    ...results.map(
      (r) =>
        `${r.tail},${r.flightDate},${r.origin},${r.destination},${r.fire},${r.fireDateStart},${r.fireDateEnd},${r.distance}`
    ),
  ];

  fs.writeFileSync("flight_fire_matches.csv", out.join("\n"));
  console.log(chalk.green(`\n✅ Matches saved to flight_fire_matches.csv`));
}

scrapeAndMatchFlights();
