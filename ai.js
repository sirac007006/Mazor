import pg from "pg";
import axios from "axios";

// DB konekcija
const db = new pg.Client({
    user: "postgres",
    password: "marko123",
    host: "localhost",
    port: 5432,
    database: "Mazor"
});

const SERPER_API_KEY = "bc0b9b05a791827d693b2bd9ac875e6eb058c87d";
const SCRAPER_API_KEY = "a57a7ccaf38749de27e00ccc24242deb";

// Pauza između API poziva
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Funkcija za pronalaženje slike
async function getImageURL(query) {
    const cleanQuery = query.replace(/[^\w\s]/gi, " ");

    try {
        const res = await axios.post("https://google.serper.dev/images", { q: cleanQuery }, {
            headers: {
                "X-API-KEY": SERPER_API_KEY,
                "Content-Type": "application/json"
            }
        });

        const images = res.data.images;
        if (images?.length > 0) {
            return images[0].thumbnailUrl || images[0].imageUrl;
        } else {
            console.log(`⚠️ Serper nije našao, pokušavam ScraperAPI...`);
        }
    } catch (e) {
        console.log(`❌ Serper greška za "${cleanQuery}": ${e.message}`);
    }

    try {
        const scraperRes = await axios.get(`http://api.scraperapi.com`, {
            params: {
                api_key: SCRAPER_API_KEY,
                url: `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(cleanQuery)}`
            }
        });

        const matches = [...scraperRes.data.matchAll(/"ou":"(.*?)"/g)];
        if (matches.length > 0) {
            return matches[0][1];
        }
    } catch (e) {
        console.log(`❌ ScraperAPI greška za "${cleanQuery}": ${e.message}`);
    }

    return null;
}

// Glavna funkcija
async function updateImages() {
    await db.connect();

    const result = await db.query(`
        SELECT * FROM proizvodiful_updated 
        WHERE slka = 'Nema' OR slka = 'FAILED' 
        ORDER BY id 
        LIMIT 2600
    `);

    console.log(`📦 Ukupno proizvoda za obradu: ${result.rows.length}`);

    for (const row of result.rows) {
        const query = `${row.naziv} ${row.subcategories}`.trim();
        console.log(`🔍 Tražim: ${query.replace(/[^\w\s]/gi, " ")}`);

        const imageUrl = await getImageURL(query);
        if (imageUrl) {
            await db.query("UPDATE proizvodiful_updated SET slka = $1 WHERE id = $2", [imageUrl, row.id]);
            console.log(`✅ Dodata slika za ${row.naziv}`);
        } else {
            await db.query("UPDATE proizvodiful_updated SET slka = 'FAILED' WHERE id = $1", [row.id]);
            console.log(`❌ Nema slike za ${row.naziv}`);
        }

        await sleep(1000);
    }

    await db.end();
    console.log("🏁 Gotovo - obrada završena.");
}

updateImages();
