import pg from "pg";
import axios from "axios";

const db = new pg.Client({
    user: "postgres",
    password: "marko123",
    host: "localhost",
    port: 5432,
    database: "Mazor"
});

const SERP_API_KEY = "1b123c41c67dad0a13c87bab1d1307bae8abe182a0dcd4c2c65b255e8851c347";

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
    const result = await db.query("SELECT * FROM proizvodiful_updated WHERE slka IS NULL");

    for (const row of result.rows) {
        const query = `${row.naziv} ${row.subcategories}`.trim();
        console.log(`🔍 Tražim: ${query}`);

        const imageUrl = await getImageURL(query);
        if (imageUrl) {
            await db.query("UPDATE proizvodiful_updated SET slka = $1 WHERE id = $2", [imageUrl, row.id]);
            console.log(`✅ Dodata slika za ${row.naziv}`);
        } else {
            console.log(`⚠️ Nema slike za ${row.naziv}`);
        }
    }

    await db.end();
    console.log("✅ Gotovo.");
}

updateImages();
