import pg from "pg";
import axios from "axios";

const db = new pg.Client({
    user: "postgres",
    password: "marko123",
    host: "localhost",
    port: 5432,
    database: "Mazor"
});

const SERP_API_KEY = "ef4a6b4e3f8af5bf00f7b399278be0ab834fef258b5806d9380550347a2f4103";

async function getImageURL(query) {
    const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&tbm=isch&api_key=${SERP_API_KEY}`;

    try {
        const res = await axios.get(url);
        const images = res.data.images_results;

        if (images && images.length > 0) {
            return images[0].thumbnail || images[0].original;
        }
    } catch (e) {
        console.error(`Greška za "${query}":`, e.message);
    }

    return null;
}

async function updateImages() {
    await db.connect();
    const result = await db.query("SELECT * FROM proizvodi WHERE slka IS NULL");

    for (const row of result.rows) {
        const query = `${row.naziv} ${row.subcategories}`.trim();
        console.log(`🔍 Tražim: ${query}`);

        const imageUrl = await getImageURL(query);
        if (imageUrl) {
            await db.query("UPDATE proizvodi SET slka = $1 WHERE id = $2", [imageUrl, row.id]);
            console.log(`✅ Dodata slika za ${row.naziv}`);
        } else {
            console.log(`⚠️ Nema slike za ${row.naziv}`);
        }
    }

    await db.end();
    console.log("✅ Gotovo.");
}

updateImages();
