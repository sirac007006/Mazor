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

// Primarni i rezervni API ključevi
const PRIMARY_SCRAPERAPI_KEY = "efe36703f12673301dae1f1c28f9ba21";
const BACKUP_SCRAPERAPI_KEY1 = "322858336d2ea84527fe1be304b4705a"; // Prvi rezervni ključ
const BACKUP_SCRAPERAPI_KEY2 = "56ca942d15fb81b16546b8cd43514c54"; // Drugi rezervnsi ključ

async function fetchWithRetry(url, keyIndex = 0) {
  let apiKey;
  switch (keyIndex) {
    case 0:
      apiKey = PRIMARY_SCRAPERAPI_KEY;
      break;
    case 1:
      apiKey = BACKUP_SCRAPERAPI_KEY1;
      break;
    case 2:
      apiKey = BACKUP_SCRAPERAPI_KEY2;
      break;
    default:
      throw new Error("Svi API ključevi su iskorišćeni ili su nevažeći");
  }

  const scraperUrl = `http://api.scraperapi.com?api_key=${apiKey}&render=false&url=${encodeURIComponent(url)}`;

  try {
    return await axios.get(scraperUrl, { timeout: 80000 });
  } catch (error) {
    const status = error.response?.status;
    if ((status === 403 || status === 401) && keyIndex < 2) {
      console.log(`⚠️ API ključ #${keyIndex + 1} vratio ${status}, pokušavam sledeći...`);
      return fetchWithRetry(url, keyIndex + 1);
    }
    throw error;
  }
}


async function fetchProductsWithoutDescription() {
  await db.connect();
  const res = await db.query(`
    SELECT id, naziv, subcategories 
FROM proizvodiful_updated 
WHERE deskripcija = 'fullfailed' 
  AND subcategories != 'Stono posuđe' 
  AND subcategories != 'Filteri' 
  AND subcategories != 'Dimne cijevi' 
  AND subcategories != 'Ostalo' 
  AND subcategories != 'Kablovi' 
  AND subcategories != 'Baterije' 
  AND subcategories != 'Posuđe za pripremu hrane'
ORDER BY id DESC
LIMIT 1000;
  `);
  return res.rows;
}

async function getGoogleLinks(queryText) {
  const query = encodeURIComponent(queryText + " specifikacije");
  const url = `https://www.google.com/search?q=${query}`;

  try {
    const res = await fetchWithRetry(url);
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
        !href.includes("bosch-home.rs") &&
        !href.includes("ekupi") &&
        !href.includes("gsmarena.com") &&
        !href.includes("ekupi.me") &&
        !href.includes("bigbang.rs") &&
        !href.includes("friz.hr") &&
        !href.includes("eponuda.com") &&
        !href.includes("voxelectronics.com") &&
        !href.includes(".ba") &&
        !href.includes(".ba") &&
        !href.includes(".ba") &&
        !href.includes(".ba") &&
        !href.includes(".ba") &&
        !href.includes(".ba") &&
        !href.includes(".ba") &&
        !href.includes("cini.rs") &&
        !href.includes("kondoras.rs") &&
        !href.includes(".lt") &&
        !href.includes("prirucnici.hr") &&
        !href.includes("tempo-tehnika.rs") &&
        !href.includes("gasiks.rs") &&
        !href.includes("kernel.me") &&
        !href.includes("ananas") &&
        !href.includes("centralno-grijanje-na-drva.blogspot.com") &&
        !href.includes("shophisense.com") &&
        !href.includes("kralj.hr") &&
        !href.includes("goglasi.com") &&
        !href.includes("elbraco.rs") &&
        !href.includes("rowenta.co.rs") &&
        !href.includes("datika.me") &&
        !href.includes("klimacentar.com") &&
        !href.includes("ebay.com") &&
        !href.includes("foxelectronics.rs") &&
        !href.includes("halooglasi.com") &&
        !href.includes("tehnoteka.rs") &&
        !href.includes("amazon") &&
        !href.includes("enaa.com") &&
        !href.includes("api.goglasi.com") &&
        !href.includes("klimescepanovic.com") &&
        !href.includes("dimensions.com") &&
        !href.includes("bosch-home") &&
        !href.includes("fero-term.hr") &&
        !href.includes("newegg.com") &&
        !href.includes("manua") &&
        !href.includes("lg.com") 
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
  try {
    const res = await fetchWithRetry(link);
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
      "veličina",
      "buka",
      "ugradnj",
      "veličina",
      "rezolucija"
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

// Funkcija za praćenje statistike API ključesva
const apiKeyUsage = {
  primary: 0,
  backup1: 0,
  backup2: 0
};

// Modifikujemo axios funkciju da prati korišćenje različitih API ključeva
const originalGet = axios.get;
axios.get = function(url, config) {
  // Pratimo koji API ključ se koristi
  if (url.includes('api_key=' + PRIMARY_SCRAPERAPI_KEY)) {
    apiKeyUsage.primary++;
  } else if (url.includes('api_key=' + BACKUP_SCRAPERAPI_KEY1)) {
    apiKeyUsage.backup1++;
  } else if (url.includes('api_key=' + BACKUP_SCRAPERAPI_KEY2)) {
    apiKeyUsage.backup2++;
  }
  
  // Pozivamo originalnu funkciju sa istim argumentima
  return originalGet.apply(this, arguments);
};

// Funkcija za proveru statusa API ključeva
async function checkApiKeyStatus() {
  const testUrl = "https://www.google.com";
  const results = [];
  
  console.log("🔄 Provera statusa API ključeva...");
  
  // Testiramo primarni ključ
  try {
    await axios.get(`http://api.scraperapi.com?api_key=${PRIMARY_SCRAPERAPI_KEY}&url=${encodeURIComponent(testUrl)}`, { timeout: 10000 });
    results.push("✅ Primarni API ključ: Aktivan");
  } catch (error) {
    if (error.response && error.response.status === 403) {
      results.push("❌ Primarni API ključ: Neaktivan (403 Forbidden)");
    } else {
      results.push(`⚠️ Primarni API ključ: Greška (${error.message})`);
    }
  }
  
  // Testiramo prvi rezervni ključ
  try {
    await axios.get(`http://api.scraperapi.com?api_key=${BACKUP_SCRAPERAPI_KEY1}&url=${encodeURIComponent(testUrl)}`, { timeout: 10000 });
    results.push("✅ Prvi rezervni API ključ: Aktivan");
  } catch (error) {
    if (error.response && error.response.status === 403) {
      results.push("❌ Prvi rezervni API ključ: Neaktivan (403 Forbidden)");
    } else {
      results.push(`⚠️ Prvi rezervni API ključ: Greška (${error.message})`);
    }
  }
  
  // Testiramo drugi rezervni ključ
  try {
    await axios.get(`http://api.scraperapi.com?api_key=${BACKUP_SCRAPERAPI_KEY2}&url=${encodeURIComponent(testUrl)}`, { timeout: 10000 });
    results.push("✅ Drugi rezervni API ključ: Aktivan");
  } catch (error) {
    if (error.response && error.response.status === 403) {
      results.push("❌ Drugi rezervni API ključ: Neaktivan (403 Forbidden)");
    } else {
      results.push(`⚠️ Drugi rezervni API ključ: Greška (${error.message})`);
    }
  }
  
  console.log("\n=== STATUS API KLJUČEVA ===");
  results.forEach(result => console.log(result));
  console.log("===========================\n");
  
  // Resetujemo brojače nakon provere
  apiKeyUsage.primary = 0;
  apiKeyUsage.backup1 = 0;
  apiKeyUsage.backup2 = 0;
  
  return results.every(r => r.includes("Aktivan"));
}

// Funkcija za praćenje statistike
async function logStatistics(success, fail) {
  console.log("\n=== STATISTIKA ===");
  console.log(`✅ Uspešno: ${success}`);
  console.log(`❌ Neuspešno: ${fail}`);
  console.log(`🔄 Ukupno obrađeno: ${success + fail}`);
  console.log("\n=== KORIŠĆENJE API KLJUČEVA ===");
  console.log(`🔑 Primarni ključ: ${apiKeyUsage.primary} zahteva`);
  console.log(`🔑 Prvi rezervni ključ: ${apiKeyUsage.backup1} zahteva`);
  console.log(`🔑 Drugi rezervni ključ: ${apiKeyUsage.backup2} zahteva`);
  console.log("=================\n");
}

// Pomoćna funkcija za testiranje API ključa
async function testApiKey(key, index) {
  const testUrl = "https://www.google.com";
  try {
    await axios.get(`http://api.scraperapi.com?api_key=${key}&url=${encodeURIComponent(testUrl)}`, { timeout: 10000 });
    return true; // Ključ je aktivan
  } catch (error) {
    if (error.response && error.response.status === 403) {
      console.log(`❌ API ključ #${index + 1} je neaktivan (403 Forbidden)`);
      return false;
    }
    // Za druge greške pretpostavljamo da ključ može raditi
    console.log(`⚠️ API ključ #${index + 1}: Greška (${error.message}), ali pokušaćemo koristiti`);
    return true;
  }
}

// Modificirani fetchWithRetry koji koristi samo aktivne ključeve
async function initApiKeyStatus() {
  console.log("🔄 Inicijalizacija API ključeva...");
  
  // Testirajte sve ključeve
  const keyStatuses = [
    await testApiKey(PRIMARY_SCRAPERAPI_KEY, 0),
    await testApiKey(BACKUP_SCRAPERAPI_KEY1, 1),
    await testApiKey(BACKUP_SCRAPERAPI_KEY2, 2)
  ];
  
  // Formiramo listu aktivnih ključeva
  const activeKeys = [];
  if (keyStatuses[0]) activeKeys.push(PRIMARY_SCRAPERAPI_KEY);
  if (keyStatuses[1]) activeKeys.push(BACKUP_SCRAPERAPI_KEY1);
  if (keyStatuses[2]) activeKeys.push(BACKUP_SCRAPERAPI_KEY2);
  
  console.log(`\n✅ Pronađeno ${activeKeys.length} aktivnih API ključeva od 3 ukupno`);
  
  return activeKeys;
}

// Glavna funkcija
(async () => {
  try {
    // Inicijalizacija API ključeva i provera statusa
    const activeKeys = await initApiKeyStatus();
    
    if (activeKeys.length === 0) {
      console.log("❌ Nije pronađen nijedan aktivan API ključ! Prekidam proces...");
      return;
    }
    
    console.log(`🚀 Nastavljam rad sa ${activeKeys.length} aktivnih API ključeva...`);
    
    // Postavljamo funkciju za korišćenje aktivnih ključeva
    // Modifikujemo fetchWithRetry funkciju da koristi samo aktivne ključeve
    const originalFetchWithRetry = fetchWithRetry;
    fetchWithRetry = async function(url, keyIndex = 0) {
      if (keyIndex >= activeKeys.length) {
        throw new Error("Svi dostupni API ključevi su iskorišćeni");
      }
      
      const apiKey = activeKeys[keyIndex];
      const scraperUrl = `http://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(url)}`;
      
      try {
        return await axios.get(scraperUrl, { timeout: 80000 });
      } catch (error) {
        if (error.response && error.response.status === 403) {
          if (keyIndex < activeKeys.length - 1) {
            console.log(`⚠️ API ključ vratio 403 Forbidden, pokušavam sa sledećim dostupnim ključem...`);
            return fetchWithRetry(url, keyIndex + 1);
          }
        }
        throw error;
      }
    };
    
    
    const products = await fetchProductsWithoutDescription();
    let successCount = 0;
    let failCount = 0;

    console.log(`🚀 Počinjem obradu za ${products.length} proizvoda...`);

    for (const product of products) {
      const fullName = `${product.naziv} ${product.subcategories || ""}`.trim();
      console.log(`\n🔍 Obrađujem (${successCount + failCount + 1}/${products.length}): ${fullName}`);

      try {
        // Čuvamo prethodno stanje statistike
        const prevPrimaryCount = apiKeyUsage.primary;
        const prevBackup1Count = apiKeyUsage.backup1;
        const prevBackup2Count = apiKeyUsage.backup2;

        const description = await fetchDescriptionFromWeb(product.naziv, product.subcategories || "");

        // Pokazujemo koji ključ je korišćen
        if (apiKeyUsage.primary > prevPrimaryCount) {
          console.log("🔑 Korišćen primarni API ključ");
        } else if (apiKeyUsage.backup1 > prevBackup1Count) {
          console.log("🔑 Korišćen prvi rezervni API ključ");
        } else if (apiKeyUsage.backup2 > prevBackup2Count) {
          console.log("🔑 Korišćen drugi rezervni API ključ");
        }

        if (description) {
          console.log("📝 Deskripcija koja se upisuje:\n", description);
          await updateDescriptionInDB(product.id, description);
          console.log("✅ Deskripcija uneta.");
          successCount++;
        } else {
          await updateDescriptionInDB(product.id, "nema");
          console.log("❌ Nema pronađene deskripcije. Upisano 'nema'.");
          failCount++;
        }
      } catch (error) {
        console.error(`❌ Greška pri obradi proizvoda ${product.id}: ${error.message}`);
        // U slučaju greške, označavamo proizvod kao neuspešan ali nastavljamo s ostalima
        try {
          await updateDescriptionInDB(product.id, "error: " + error.message.substring(0, 100));
        } catch (dbError) {
          console.error("❌ Greška prilikom upisa u bazu:", dbError.message);
        }
        failCount++;
      }

      // Periodično beležimo statistiku
      if ((successCount + failCount) % 10 === 0) {
        await logStatistics(successCount, failCount);
      }

      // Pauza između proizvoda
      await delay(2000);
    }

    // Konačna statistika na kraju
    await logStatistics(successCount, failCount);
    console.log("✅ Obrada završena!");
  } catch (err) {
    console.error("❌ Globalna greška:", err);
  } finally {
    try {
      await db.end();
      console.log("🔄 Konekcija sa bazom je zatvorena.");
    } catch (err) {
      console.error("❌ Greška pri zatvaranju konekcije:", err.message);
    }
  }
})();