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

const SCRAPERAPI_KEY = "fd9caaf916b728a879b5003064e98d25";

async function fetchProductsWithoutDescription() {
  await db.connect();
  const res = await db.query(`
    SELECT id, naziv, subcategories 
    FROM proizvodiful_updated 
    WHERE deskripcija IS NULL 
    LIMIT 1000
  `);
  return res.rows;
}

async function getGoogleLinks(queryText) {
  const query = encodeURIComponent(queryText + " specifikacije");
  const url = `http://api.scraperapi.com?api_key=${SCRAPERAPI_KEY}&url=https://www.google.com/search?q=${query}`;

  try {
    const res = await axios.get(url, { timeout: 80000 });
    const $ = cheerio.load(res.data);

    const links = [];
    $("a").each((i, el) => {
      const href = $(el).attr("href");
      if (
        href &&
        href.startsWith("http") &&
        !href.includes("google") &&
        !href.includes("youtube") &&
        !href.includes("facebook") &&
        !href.includes("voxelectronics.com") &&
        !href.includes("dodatnaoprema.com") &&
        !href.includes("tehnoprometst.rs") &&
        !href.includes("gorenje.com") &&
        !href.includes("ekupi.ba") &&
        !href.includes("kralj.hr") &&
        !href.includes("aquamanija.rs") &&
        !href.includes("ctshop.rs") &&
        !href.includes("domod.ba") &&
        !href.includes("boss.co.rs") &&
        !href.includes("help.eset.com") &&
        !href.includes("foxelectronics.rs") &&
        !href.includes("digitalis.ba") &&
        !href.includes("ananas.rs") &&
        !href.includes("vodoterm.co.rs") &&
        !href.includes("gigatron.rs") &&
        !href.includes("spektar.rs") &&
        !href.includes("merkury.hr") &&
        !href.includes("hdtelevizija.com") &&
        !href.includes("acs-klime.rs") &&
        !href.includes("frigo.hr") &&
        !href.includes("tehnopromet.rs") &&
        !href.includes("samsung.com") &&
        !href.includes("nitom.rs") &&
        !href.includes("bigboom.eu") &&
        !href.includes("centrometal.hr") &&
        !href.includes("ananas.me") &&
        !href.includes("multicom.me") &&
        !href.includes("tehnoplus.me") &&
        !href.includes("www.bcgroup-online.com") &&
        !href.includes("ekupi") &&
        !href.includes("datika.me") &&
        !href.includes("paluba.info") &&
        !href.includes("mazor.co.me") &&
        !href.includes("kondoras.rs") &&
        !href.includes("eponuda") &&
        !href.includes("bosch-home.rs") &&
        !href.includes("svijetgrijanja.ba") &&
        !href.includes("magnetik.rs") &&
        !href.includes("omegashop.ba") &&
        !href.includes("pc-gamer.me") &&
        !href.includes("tehnoteka.rs") &&
        !href.includes("vitapur.rs") &&
        !href.includes("eponuda.com") // ISKLJUČUJEMO VOX ELECTRONICS
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
      "brzina",
      "protok",
      "osvetljenje",
      "buka",
      "ugradnj",
    ];

    let results = [];

    $("table, ul, ol, div").each((i, el) => {
      const text = $(el).text().toLowerCase();
      if (keywords.some((k) => text.includes(k)) && text.length < 1500) {
        results.push($(el).text().trim());
      }
    });

    const uniqueLines = Array.from(
      new Set(
        results
          .join("\n")
          .split("\n")
          .map((l) => l.trim())
          .filter((l) =>
            l.length > 0 &&
            l.length < 1000 &&
            !l.toLowerCase().includes("cene koje se nalaze") &&
            !l.toLowerCase().includes("informativnog karaktera") &&
            !l.toLowerCase().includes("kontaktirajte") &&
            !l.toLowerCase().includes("podeli sa prijateljima")
          )
      )
    );

    const uniqueBlocks = Array.from(new Set(uniqueLines.join("\n").split(/\n{2,}/)));

    return uniqueBlocks.slice(0, 10).join("\n\n");
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
      console.log("📝 Deskripcija koja se upisuje:\n", description);
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
