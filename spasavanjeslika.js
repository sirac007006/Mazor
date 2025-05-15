import pg from "pg";
import axios from "axios";
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

const db = new pg.Client({
    user: "postgres",
    password: "marko123",
    host: "localhost",
    port: 5432,
    database: "Mazor"
});

async function rescueImages() {
  await db.connect();
  console.log("🔄 Povezan sa bazom podataka");
  
  // Create directories for images and reports
  const imagesDir = path.join(process.cwd(), 'public', 'images', 'products');
  try {
    await mkdir(imagesDir, { recursive: true });
    console.log(`📁 Kreiran direktorijum: ${imagesDir}`);
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
  
  // Get all products with images
  const result = await db.query("SELECT id, naziv, subcategories, slka FROM proizvodiful_updated WHERE slka IS NOT NULL");
  console.log(`🔍 Pronađeno ${result.rows.length} proizvoda sa slikama`);
  
  const failedProducts = [];
  let savedCount = 0;

  for (const row of result.rows) {
    try {
      // Skip if already a local path
      if (row.slka.startsWith('/images/')) {
        console.log(`⏩ Slika za "${row.naziv}" je već lokalna`);
        continue;
      }
      
      // Generate a filename based on product ID and name
      const sanitizedName = row.naziv.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().substring(0, 50);
      const filename = `${row.id}_${sanitizedName}.jpg`;
      const filePath = path.join(imagesDir, filename);
      const dbPath = `/images/products/${filename}`;
      
      // Try to download the image
      console.log(`⬇️ Preuzimam sliku za "${row.naziv}"`);
      
      const response = await axios({
        method: 'GET',
        url: row.slka,
        responseType: 'arraybuffer',
        timeout: 8000 // 8 seconds timeout
      });
      
      // Save image to file
      await writeFile(filePath, response.data);
      
      // Update database with new local path
      await db.query("UPDATE proizvodiful_updated SET slka = $1 WHERE id = $2", [dbPath, row.id]);
      
      console.log(`✅ Sačuvana slika za "${row.naziv}"`);
      savedCount++;
      
    } catch (error) {
      console.error(`❌ Greška za "${row.naziv}": ${error.message}`);
      failedProducts.push({
        id: row.id,
        naziv: row.naziv,
        subcategories: row.subcategories,
        url: row.slka,
        error: error.message
      });
    }
  }
  
  // Save report of failed products
  const reportPath = path.join(process.cwd(), 'failed_images_report.json');
  await writeFile(reportPath, JSON.stringify(failedProducts, null, 2));
  
  console.log(`
📊 IZVEŠTAJ:
✅ Uspešno sačuvano: ${savedCount} slika
❌ Neuspelo: ${failedProducts.length} slika
📄 Detaljan izveštaj sačuvan u: ${reportPath}
  `);
  
  await db.end();
  console.log("✅ Proces završen.");
}

rescueImages().catch(err => {
  console.error("❌ Kritična greška:", err);
  process.exit(1);
});