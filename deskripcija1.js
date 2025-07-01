import pg from "pg";
import readline from "readline";

// Kreiranje konekcije sa bazom
const db = new pg.Client({
  user: "postgres",
  password: "marko123",
  host: "localhost",
  port: 5432,
  database: "Mazor",
});

// Kreiranje interfejsa za čitanje korisničkog unosa
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Funkcija za dobijanje proizvoda bez deskripcije ili sa neuspešnom deskripcijom
async function fetchProductsWithoutDescription() {
  await db.connect();
  const res = await db.query(`
    SELECT id, naziv, subcategories 
    FROM proizvodiful_updated 
    WHERE (deskripcija = 'nema' OR deskripcija = 'fullfailed')
      AND subcategories != 'Stono posuđe' 
      AND subcategories != 'Filteri' 
      AND subcategories != 'Dimne cijevi' 
      AND subcategories != 'Ostalo' 
      AND subcategories != 'Kablovi' 
      AND subcategories != 'Baterije'
      AND subcategories != 'Mobilni telefoni'
      AND subcategories != 'Depilatori i epilatori'
      AND subcategories != 'Antene'
      AND subcategories != 'Audio plejeri'
      AND subcategories != 'Radio'
      AND subcategories != 'Pegle'
      AND subcategories != 'Aparati za hranu'
      AND subcategories != 'Čajovnici'
      AND subcategories != 'Posuđe za pripremu hrane'
    ORDER BY id DESC
    LIMIT 1000;
  `);
  return res.rows;
}

// Funkcija za ažuriranje deskripcije u bazi
async function updateDescriptionInDB(id, description) {
  const query = "UPDATE proizvodiful_updated SET deskripcija = $1 WHERE id = $2";
  await db.query(query, [description, id]);
}

// Funkcija za postavljanje pitanja i čekanje unosa
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Funkcija za prikaz statistike
function displayStatistics(success, fail, total) {
  console.log("\n=== STATISTIKA ===");
  console.log(`✅ Uspešno upisano: ${success}`);
  console.log(`❌ Preskočeno: ${fail}`);
  console.log(`🔄 Obrađeno: ${success + fail}/${total}`);
  console.log("=================\n");
}

// Glavna funkcija
async function main() {
  try {
    console.log("🔌 Povezivanje sa bazom podataka...");
    
    // Dohvatamo sve proizvode bez deskripcije ili sa neuspešnom deskripcijom
    const products = await fetchProductsWithoutDescription();
    console.log(`🚀 Pronađeno ${products.length} proizvoda bez deskripcije ili sa neuspešnom deskripcijom.`);
    
    if (products.length === 0) {
      console.log("✅ Nema proizvoda za obradu.");
      return;
    }
    
    let successCount = 0;
    let failCount = 0;
    
    console.log("\n📝 PROGRAM ZA MANUELNI UNOS DESKRIPCIJA 📝");
    console.log("Pratite uputstva i unesite deskripciju za svaki proizvod.\n");
    console.log("Posebne komande:");
    console.log("- Unesite 'skip' da preskočite proizvod");
    console.log("- Unesite 'exit' da završite program\n");
    
    // Iteriramo kroz sve proizvode
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const fullName = `${product.naziv} ${product.subcategories || ""}`.trim();
      
      console.log(`\n🔍 Proizvod ${i+1}/${products.length}: ${fullName} (ID: ${product.id})`);
      
      // Pitamo korisnika za deskripciju
      console.log("Unesite deskripciju za ovaj proizvod (ili 'skip' za preskakanje, 'exit' za izlaz):");
      const userInput = await askQuestion("> ");
      
      // Provera komandi
      if (userInput.toLowerCase() === "exit") {
        console.log("\n⏹️ Program je prekinut na zahtev korisnika.");
        break;
      }
      
      if (userInput.toLowerCase() === "skip") {
        console.log("⏭️ Proizvod preskočen.");
        failCount++;
        continue;
      }
      
      // Ažuriranje deskripcije u bazi
      try {
        await updateDescriptionInDB(product.id, userInput);
        console.log("✅ Deskripcija uspešno upisana u bazu.");
        successCount++;
      } catch (error) {
        console.error(`❌ Greška pri upisu u bazu: ${error.message}`);
        failCount++;
      }
      
      // Prikazujemo statistiku nakon svakih 5 proizvoda
      if ((i + 1) % 5 === 0) {
        displayStatistics(successCount, failCount, products.length);
      }
    }
    
    // Konačna statistika
    displayStatistics(successCount, failCount, products.length);
    console.log("✅ Program završen!");
    
  } catch (error) {
    console.error("❌ Globalna greška:", error);
  } finally {
    // Zatvaramo konekciju sa bazom i readline interfejs
    try {
      rl.close();
      await db.end();
      console.log("🔄 Konekcija sa bazom je zatvorena.");
    } catch (err) {
      console.error("❌ Greška pri zatvaranju konekcije:", err.message);
    }
  }
}

// Pokretanje programa
main();