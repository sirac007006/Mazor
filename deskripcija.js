import pg from "pg";
import axios from "axios";
import * as cheerio from "cheerio";

const db = new pg.Client({
  user: "postgres",
  password: "marko123",
  host: "localhost",
  port: 5432,
  database: "Mazor",
});

const SCRAPERAPI_KEY = "63c4d6e993798dd9759680e03a8500d1";

async function fetchProductsWithoutDescription() {
  await db.connect();
  const res = await db.query(`
    SELECT id, naziv, subcategories 
    FROM proizvodiful_updated 
    WHERE deskripcija IS NULL 
    LIMIT 100
  `);
  return res.rows;
}

async function getGoogleLinks(queryText) {
  const query = encodeURIComponent(queryText + " specifikacije");
  const url = `http://api.scraperapi.com?api_key=${SCRAPERAPI_KEY}&url=https://www.google.com/search?q=${query}`;

  try {
    const res = await axios.get(url, { timeout: 20000 });
    const $ = cheerio.load(res.data);

    const links = [];
    $("a").each((i, el) => {
      const href = $(el).attr("href");
      if (
        href &&
        href.startsWith("http") &&
        !href.includes("google") &&
        !href.includes("youtube") &&
        !href.includes("facebook")
      ) {
        links.push(href);
      }
    });

    return [...new Set(links)].slice(0, 5);
  } catch (e) {
    console.error("❌ Google pretraga nije uspela:", e.message);
    return [];
  }
}

async function fetchDescriptionFromLink(link) {
  const url = `http://api.scraperapi.com?api_key=${SCRAPERAPI_KEY}&url=${encodeURIComponent(link)}`;
  try {
    const res = await axios.get(url, { timeout: 20000 });
    const $ = cheerio.load(res.data);
    const keywords = [
      "kapacitet",
      "rpm",
      "energetska",
      "programa",
      "klasa",
      "garancija",
      "dimenzije",
      "snaga",
      "zapremina",
      "frenkvencija",
    ];

    let results = [];

    $("table").each((i, el) => {
      const text = $(el).text().toLowerCase();
      if (keywords.some((k) => text.includes(k))) {
        results.push($(el).text().trim());
      }
    });

    $("ul, ol").each((i, el) => {
      const text = $(el).text().toLowerCase();
      if (keywords.some((k) => text.includes(k))) {
        results.push($(el).text().trim());
      }
    });

    $("div").each((i, el) => {
      const text = $(el).text().toLowerCase();
      if (keywords.some((k) => text.includes(k)) && $(el).text().length < 1500) {
        results.push($(el).text().trim());
      }
    });

    const combined = results
      .join("\n\n")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    return combined.slice(0, 50).join("\n");
  } catch (err) {
    console.error("⚠️ Greška sa linkom:", link, err.message);
    return null;
  }
}

async function fetchDescriptionFromWeb(productName, subcategory) {
  const fullQuery = `${productName} ${subcategory}`.trim();
  const links = await getGoogleLinks(fullQuery);

  for (const link of links) {
    console.log("➡️ Pokušavam:", link);
    const desc = await fetchDescriptionFromLink(link);
    if (desc && desc.length > 100) return desc;
  }

  return null;
}

async function updateDescriptionInDB(id, description) {
  const query = "UPDATE proizvodiful_updated SET deskripcija = $1 WHERE id = $2";
  await db.query(query, [description, id]);
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  const products = await fetchProductsWithoutDescription();

  for (const product of products) {
    const fullName = `${product.naziv} ${product.subcategories || ""}`.trim();
    console.log("🔍 Obrađujem:", fullName);

    const description = await fetchDescriptionFromWeb(product.naziv, product.subcategories || "");

    if (description) {
      await updateDescriptionInDB(product.id, description);
      console.log("✅ Deskripcija uneta.");
    } else {
      await updateDescriptionInDB(product.id, "failed");
      console.log("❌ Nema pronađene deskripcije. Upisano 'failed'.");
    }

    await delay(2000);
  }

  await db.end();
})();
