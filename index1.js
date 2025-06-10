import pg from "pg";
import express from "express";
import bcrypt from "bcrypt";
import bodyParser from "body-parser";
import expressSession from "express-session";
import crypto from "crypto";
import nodemailer from "nodemailer";
import "dotenv/config";

const app = express();
const port = 3000;
const saltRounds = 10;
const router = express.Router();
app.use(router);


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(expressSession({
    secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

const db = new pg.Client({
    user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
})
const transporter = nodemailer.createTransport({
    service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  });
  

db.connect();
function authMiddleware(req, res, next) {
    if (!req.session.user) {
        return res.redirect("/prijava");
    }
    next();
}

function getCategory(category){
    let bcategory;
    switch(category){
        case "bijelatehnika":
            bcategory = "Bijela tehnika";
            break;
        case "tviaudio":
            bcategory = "TV i audio";
            break;
        case "sporetikaminipeci":
            bcategory = "Šporeti, kamini i peći";
            break;
        case "grijanjeihladjenje":
            bcategory = "Grijanje i hlađenje";
            break;
        case "ugradnatehnika":
            bcategory = "Ugradna tehnika";
            break;
        case "malikucniaparati":
            bcategory = "Mali kućni aparati";
            break;
        case "telefonigaming":
            bcategory = "Telefoni i Gaming";
            break;
        case "laptopitableti":
            bcategory = "Laptop i tablet uređaji";
            break;
        case "razno":
            bcategory = "Razno";
            break;
    }
    return bcategory;
}
app.get("/", async(req, res) => {
    const { rows } = await db.query(
        "SELECT * FROM proizvodiful_updated WHERE subcategories = 'Šporeti' or subcategories = 'Električni šporeti' AND kolicina != '0' LIMIT 14"
    );
    
    const masine = (await db.query(
        "SELECT * FROM proizvodiful_updated where kolicina != '0' limit 14 offset 6"
    )).rows;
    const televizori = rows;
    res.render("index.ejs", {
        televizori: televizori,
        masine:masine,
        session: req.session
    });
});
app.get("/kontakt", async(req,res) =>{
    res.render("kontakt.ejs", { session: req.session });
})

  
app.post("/kontakt", async (req, res) => {
    try {
        console.log("Primljeni podaci iz forme:", req.body);

        const { name, email, phone, subject, message } = req.body;

        const { rows } = await db.query("SELECT COUNT(*) FROM poruke");
        const id = parseInt(rows[0].count) + 1;
        const datum = new Date();

        const result = await db.query(
            "INSERT INTO poruke(id, ime, email, telefon, predmet, poruka, vreme) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
            [id, name, email, phone || null, subject || 'Kontakt poruka', message, datum]
        );

        console.log('Poruka uspešno sačuvana u bazi sa ID:', result.rows[0].id);
        res.send("Poruka uspešno sačuvana.");
    } catch (err) {
        console.error("Greška pri čuvanju kontakt poruke:", err);
        res.status(500).send("Došlo je do greške.");
    }
});
app.get("/svekategorije", async(req,res) =>{
    const proizvodi = (await db.query(
        "SELECT * FROM proizvodiful_updated WHERE subcategories = 'Šporeti' or subcategories = 'Električni šporeti' AND kolicina != '0' LIMIT 6"
    )).rows;
    res.render("svekategorije.ejs", { proizvodi:proizvodi, session: req.session });
})
app.get("/svekategorije/:category", async (req, res) => {
    var category = req.params.category;
    var bcategory = getCategory(category);
    const proizvodi = (await db.query(
        "SELECT * FROM proizvodiful_updated WHERE subcategories = 'Šporeti' or subcategories = 'Električni šporeti' AND kolicina != '0' LIMIT 6"
    )).rows;
    var subcategories = (await db.query(
        "SELECT * FROM subcategories WHERE category = $1", [category]
    )).rows;

    res.render("podkategorije1.ejs", {
        category:category,
        bcategory:bcategory,
        proizvodi:proizvodi,
        subcategories:subcategories,
        session: req.session
    });
});
app.get("/svekategorije/:category/:subcategory", async (req, res) => {
    const category = req.params.category;
    const subcategory = req.params.subcategory;
    const bcategory = getCategory(category);
    const selectedBrands = req.query.brand;
    const min = parseFloat(req.query.min) || 0;
    const max = parseFloat(req.query.max) || 10000;

    // Osnovna SQL logika
    let values = [subcategory, min, max];
    let query = `
        SELECT * FROM proizvodiful_updated 
        WHERE subcategories = $1 and slka is not null and slka != 'Bez rasporeda po brendovima'
        AND CAST(cena_sapdv AS NUMERIC) BETWEEN $2 AND $3 and kolicina != '0'
    `;

    // Ako su selektovani brendovi
    if (selectedBrands) {
        const brands = Array.isArray(selectedBrands) ? selectedBrands : [selectedBrands];
        const startIndex = values.length + 1;
        const brandPlaceholders = brands.map((_, i) => `$${startIndex + i}`).join(", ");
        query += ` AND brend IN (${brandPlaceholders})`;
        values.push(...brands);
    }

    // Dohvati proizvode
    const proizvodi = (await db.query(query, values)).rows;

    // Dohvati dostupne brendove
    const brendoviQuery = `
        SELECT DISTINCT brend 
        FROM proizvodiful_updated 
        WHERE subcategories = $1 and slka is not null and slka != 'Bez rasporeda po brendovima' and kolicina != '0'
    `;
    const brendovi = (await db.query(brendoviQuery, [subcategory])).rows.map(row => row.brend);

    // Dohvati MIN/MAX cena, uz pretvaranje u broj
    const minMaxQuery = `
        SELECT 
            MIN(CAST(cena_sapdv AS NUMERIC)) as min_price, 
            MAX(CAST(cena_sapdv AS NUMERIC)) as max_price 
        FROM proizvodiful_updated 
        WHERE subcategories = $1 and slka is not null and slka != 'Bez rasporeda po brendovima' and kolicina != '0'
    `;
    const { rows: minMaxCene } = await db.query(minMaxQuery, [subcategory]);
    let { min_price, max_price } = minMaxCene[0];

    // Sanity check: ako je min veće od max — zameni ih
    if (parseFloat(min_price) > parseFloat(max_price)) {
        const temp = min_price;
        min_price = max_price;
        max_price = temp;
    }

    res.render("proizvodi.ejs", {
        category,
        subcategory,
        proizvodi,
        brendovi,
        min_price,
        max_price,
        bcategory,
        session: req.session
    });
});
app.get("/svekategorije/:category/:subcategory/:id", async (req, res) => {
    const category = req.params.category;
    const subcategory = req.params.subcategory;
    const id = req.params.id;
    const bcategory = getCategory(category);

    try {
        const { rows } = await db.query(
            "SELECT * FROM proizvodiful_updated WHERE id = $1 AND subcategories = $2 and kolicina != '0'",
            [id, subcategory]
        );

        const proizvod = rows[0];
        res.render("proizvod.ejs", {
            category,
            subcategory,
            proizvod,
            bcategory,
            session: req.session
        });
    } catch (err) {
        console.error("Greška kod dohvaćanja proizvoda:", err);
        res.status(500).send("Greška na serveru.");
    }
});
app.get("/proizvodi/:id", async (req, res) => {
    const id = req.params.id;
    var proizvodi = (await db.query("Select * from proizvodiful_updated")).rows;
    if(id > 0 && id < proizvodi.length +1){
    try {
        const { rows } = await db.query(
            "SELECT * FROM proizvodiful_updated WHERE id = $1 and kolicina != '0'",
            [id]
        );

        const proizvod = rows[0];
        res.render("proizvod.ejs", {
            proizvod,
            session: req.session,
            category: proizvod.kategorija || null,
            bcategory: proizvod.bkategorija || null,
            subcategory: proizvod.subcategories || null
        });
    } catch (err) {
        console.error("Greška kod dohvaćanja proizvoda:", err);
        res.status(500).send("Greška na serveru.");
    }}
    else{
        res.redirect("/404")
    }
});
app.get("/search", async (req, res) => {
    const searchQuery = req.query.q || ""; // tekst koji je korisnik uneo
    const selectedBrands = req.query.brand;
    const min = parseFloat(req.query.min) || 0;
    const max = parseFloat(req.query.max) || 10000;

    // Osnovna SQL logika za pretragu po nazivu
    let values = [`%${searchQuery}%`, min, max];
    let query = `
        SELECT * FROM proizvodiful_updated 
        WHERE LOWER(naziv) LIKE LOWER($1)
        AND CAST(cena_sapdv AS NUMERIC) BETWEEN $2 AND $3 and cena_sapdv != '0' and kolicina != '0'
    `;

    // Ako su selektovani brendovi
    if (selectedBrands) {
        const brands = Array.isArray(selectedBrands) ? selectedBrands : [selectedBrands];
        const startIndex = values.length + 1;
        const brandPlaceholders = brands.map((_, i) => `$${startIndex + i}`).join(", ");
        query += ` AND brend IN (${brandPlaceholders})`;
        values.push(...brands);
    }

    // Dohvati proizvode
    const proizvodi = (await db.query(query, values)).rows;

    // Dohvati dostupne brendove u okviru rezultata
    const brendoviQuery = `
        SELECT DISTINCT brend 
        FROM proizvodiful_updated 
        WHERE LOWER(naziv) LIKE LOWER($1) and kolicina != '0'
    `;
    const brendovi = (await db.query(brendoviQuery, [`%${searchQuery}%`])).rows.map(row => row.brend);

    // Dohvati min i max cenu unutar pretrage
    const minMaxQuery = `
        SELECT 
            MIN(CAST(cena_sapdv AS NUMERIC)) as min_price, 
            MAX(CAST(cena_sapdv AS NUMERIC)) as max_price 
        FROM proizvodiful_updated 
        WHERE LOWER(naziv) LIKE LOWER($1) and kolicina != '0'
    `;
    const { rows: minMaxCene } = await db.query(minMaxQuery, [`%${searchQuery}%`]);
    let { min_price, max_price } = minMaxCene[0];

    // Sanity check
    if (parseFloat(min_price) > parseFloat(max_price)) {
        const temp = min_price;
        min_price = max_price;
        max_price = temp;
    }

    // Pošto nije kategorija, postavljamo category/subcategory/bcategory na null
    res.render("search.ejs", {
        category: null,
        subcategory: null,
        bcategory: null,
        proizvodi,
        brendovi,
        min_price,
        max_price,
        session: req.session
    });
});

app.get("/proizvod", async(req,res) =>{
    res.render("proizvod.ejs", { session: req.session });
})

app.get("/prijava", (req, res) => {
    res.render("prijava.ejs", { session: req.session });
});

app.post("/prijava", async (req, res) => {
    let email = req.body.email;
    let password = req.body.password;
    try {
        let user = (await db.query("SELECT * FROM users WHERE email = $1", [email])).rows[0];
        if (!user) {
            // Dodajemo parametar greške u URL
            return res.redirect("/prijava?error=invalid_credentials");
        }
        bcrypt.compare(password, user.lozinka, (err, result) => {
            if (err) {
                console.error("Greška pri proveri lozinke:", err);
                return res.redirect("/prijava?error=server_error");
            }

            if (result === true) {
                req.session.user = { 
                    ime: user.ime, 
                    prezime: user.prezime, 
                    email: user.email 
                }; // Postavi user u sesiju
                res.redirect("/");
            } else {
                // Dodajemo parametar greške u URL
                res.redirect("/prijava?error=invalid_credentials");
            }
        });
    } catch (err) {
        console.error("Greška pri prijavi:", err);
        res.redirect("/prijava?error=server_error");
    }
});
app.get("/registracija", (req, res) => {
    res.render("registracija.ejs", { session: req.session, error: req.query.error });
});
app.post("/registracija", async (req, res) => {
    let id = ((await db.query("SELECT * FROM users")).rows).length;
    let ime = req.body.ime;
    let prezime = req.body.prezime;
    let email = req.body.email;
    let lozinka = req.body.lozinka;
    let telefon = req.body.telefon;
    let dbemail = (await db.query("SELECT lozinka from users where email = $1", [email])).rows[0];
    if (dbemail) {
        return res.redirect("/registracija?error=postoji");
    }
    
    else{
        bcrypt.hash(lozinka, saltRounds, async function (err, hash) {
            if (err) {
                console.error("Greška pri generisanju hesirane lozinke:", err);
                return res.status(500).send("Greška pri hesiranju lozinke");
            }

            let password = hash;

            await db.query(
                "INSERT INTO users(id, ime, prezime, email, lozinka, telefon) VALUES ($1, $2, $3, $4, $5, $6)",
                [id + 1, ime, prezime, email, password, telefon]
            );

            res.redirect("/");
        });
    }
});

app.get("/zaboravljenalozinka", async(req,res) =>{
    res.render("email.ejs", { session: req.session });
})
app.post("/zaboravljenalozinka", async (req, res) => {

    const { email } = req.body;
  
    const userRes = await db.query("SELECT id FROM users WHERE email = $1", [email]);
    if (userRes.rowCount === 0) {
      console.log("Sve top")
    }
  
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1h
  
    await db.query(
      "INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)",
      [userRes.rows[0].id, token, expires]
    );
  
    const link = `https://mazor-w95x.onrender.com/reset-lozinka?token=${token}`;
  
    await transporter.sendMail({
      from: '"Mazor" <ivanovicmicko4@gmail.com>',
      to: email,
      subject: "Resetovanje lozinke",
      html: `<p>Klikni ispod da resetuješ lozinku:</p><a href="${link}">${link}</a>`,
    });
  
    res.send("Ako mejl postoji, poslat je link za reset.");
  });
  
  export default router;
app.get("/reset-lozinka", async (req, res) => {
  const { token } = req.query;
  const tokenCheck = await db.query(
    "SELECT * FROM password_resets WHERE token = $1 AND expires_at > NOW()",
    [token]
  );

  if (tokenCheck.rowCount === 0) {
    return res.send("Link nije validan ili je istekao.");
  }

  res.render("reset-lozinka.ejs", { token });
});
app.post("/reset-lozinka", async (req, res) => {
    const { token, password } = req.body;
  
    const tokenRes = await db.query("SELECT * FROM password_resets WHERE token = $1", [token]);
    if (tokenRes.rowCount === 0) {
      return res.send("Token nije validan.");
    }
  
    const userId = tokenRes.rows[0].user_id;
    const hashed = await bcrypt.hash(password, 10);
  
    await db.query("UPDATE users SET lozinka = $1 WHERE id = $2", [hashed, userId]);
    await db.query("DELETE FROM password_resets WHERE token = $1", [token]);
  
    res.send("Lozinka uspešno promenjena.");
  });
  app.get("/profil", authMiddleware, async(req, res) => {
    try {
        // Dohvati podatke korisnika
        let korisnik = (await db.query("SELECT * FROM users WHERE email = $1", [req.session.user.email])).rows[0];
        
        // Dohvati narudžbine korisnika, sortirane po datumu (najnovije prvo)
        const porudzbineResult = await db.query(
            `SELECT * FROM porudzbine 
             WHERE iduser = $1 
             ORDER BY datum DESC 
             LIMIT 10`, // Prikazujemo samo 10 najnovijih
            [korisnik.id]
        );
        
        const porudzbine = porudzbineResult.rows;
        
        res.render("profil.ejs", { 
            session: req.session, 
            korisnik,
            porudzbine 
        });
    } catch (err) {
        console.error("Greška pri dohvaćanju podataka profila:", err);
        res.status(500).send("Greška na serveru.");
    }
});
app.post("/profil", authMiddleware, async (req, res) => {
    try {
        const { telefon, adresa, grad, postanski_broj } = req.body;
        const email = req.session.user.email;

        await db.query(
            `UPDATE users 
             SET telefon = $1, adresa = $2, grad = $3, pbroj = $4 
             WHERE email = $5`,
            [telefon, adresa, grad, postanski_broj, email]
        );

        // Redirect with success parameter
        res.redirect("/profil?success=true");
    } catch (err) {
        console.error("Greška prilikom ažuriranja profila:", err);
        res.status(500).send("Greška na serveru.");
    }
});
app.post("/otkazi-narudzbinu", authMiddleware, async (req, res) => {
    try {
        const { porudzbina_id } = req.body;
        const korisnik = (await db.query("SELECT id FROM users WHERE email = $1", [req.session.user.email])).rows[0];
        
        // Proveri da li je narudžbina od ovog korisnika
        const porudzbina = (await db.query(
            "SELECT * FROM porudzbine WHERE id = $1 AND iduser = $2",
            [porudzbina_id, korisnik.id]
        )).rows[0];
        
        if (!porudzbina) {
            return res.status(403).send("Nemate pristup ovoj narudžbini.");
        }
        
        // Proveri da li je status "U obradi"
        if (porudzbina.status !== 'U obradi') {
            return res.status(400).send("Možete otkazati samo narudžbine koje su u obradi.");
        }
        
        // Otkaži narudžbinu (postavi status na "Otkazano")
        await db.query(
            "UPDATE porudzbine SET status = 'Otkazano' WHERE id = $1",
            [porudzbina_id]
        );
        
        // Preusmeri nazad na profil
        res.redirect("/profil");
        
    } catch (err) {
        console.error("Greška pri otkazivanju narudžbine:", err);
        res.status(500).send("Greška na serveru.");
    }
});

app.get("/korpa", (req, res) => {
    const korpa = req.session.cart || [];

    let ukupno = 0;
    korpa.forEach(item => {
        ukupno += parseFloat(item.cena) * item.kolicina;
    });

    res.render("korpa.ejs", {
        korpa: req.session.korpa,
        session: req.session
    });
});

app.post("/dodaj-u-korpu", (req, res) => {
    const { id, naziv, cena, slika } = req.body;

    // Inicijalizuj korpu ako ne postoji
    if (!req.session.korpa) {
        req.session.korpa = [];
    }

    const korpa = req.session.korpa;

    const postojeci = korpa.find(p => p.id == id);
    if (postojeci) {
        postojeci.kolicina++;
    } else {
        korpa.push({
            id,
            naziv,
            cena: parseFloat(cena),
            slika,
            kolicina: 1,
        });
    }

    res.redirect("/korpa");
});

app.post("/azuriraj-kolicinu", (req, res) => {
    const { id, action } = req.body;
    const korpa = req.session.korpa;

    const proizvod = korpa.find(p => p.id == id);
    if (proizvod) {
        if (action === "increase") {
            proizvod.kolicina++;
        } else if (action === "decrease" && proizvod.kolicina > 1) {
            proizvod.kolicina--;
        }
    }

    req.session.korpa = korpa;
    res.redirect("/korpa");
});
app.post("/ukloni-iz-korpe", (req, res) => {
    const id = req.body.id;
    req.session.korpa = req.session.korpa.filter(p => p.id != id);
    res.redirect("/korpa");
});


app.get('/kupovina', async(req, res) => {
    if (!req.session.user) {
        return res.redirect("/prijava?redirect=kupovina");
    }
    const korpa = req.session.korpa || [];
    let korisnik = await db.query("Select * from users where email = $1", [req.session.user[1]])
    let ukupno = 0;
    console.log(req.session)
    korpa.forEach(item => {
        ukupno += parseFloat(item.cena) * item.kolicina;
    });

    res.render("kupovina.ejs", {
        korisnik,
        korpa: korpa,
        ukupno,
        session: req.session
    });
});
// Add this POST route to your server code to handle the form submission

// Updated route with fixed ID generation

// Fix for the /kupovina POST route
// Fix for the /kupovina POST route
app.post("/kupovina", async (req, res) => {
    try {
        // Check if user is logged in
        if (!req.session.user) {
            return res.redirect("/prijava?redirect=kupovina");
        }

        // Get user ID from session
        const userEmail = req.session.user.email;
        const userResult = await db.query("SELECT id FROM users WHERE email = $1", [userEmail]);
        
        if (userResult.rows.length === 0) {
            return res.status(400).send("Korisnik nije pronađen.");
        }
        
        const iduser = userResult.rows[0].id;
        
        // Get form data
        const { 
            ime, prezime, email, telefon, 
            ulica, broj, stan, sprat, grad, postanski_broj,
            ima_lift, napomena, delivery_method 
        } = req.body;
        
        // Format address
        const adresa = `${ulica} ${broj}${stan ? `, stan ${stan}` : ''}${sprat ? `, sprat ${sprat}` : ''}, ${grad} ${postanski_broj}${ima_lift ? ' (ima lift)' : ''}`;
        
        // Calculate total amount (add 5 euros for shipping)
        const korpa = req.session.korpa || [];
        let iznos = 0;
        korpa.forEach(item => {
            iznos += parseFloat(item.cena) * item.kolicina;
        });
        
        // Get new order ID - simplified approach
        let id = 1; // Default value if table is empty
        
        try {
            // Get the max ID from the table (handles both text and integer IDs)
            const maxIdResult = await db.query("SELECT MAX(CAST(id AS INTEGER)) as max_id FROM porudzbine");
            if (maxIdResult.rows[0].max_id) {
                id = parseInt(maxIdResult.rows[0].max_id) + 1;
            }
        } catch (err) {
            console.error("Error while getting max ID, using default value", err);
        }
        
        // Current date
        const datum = new Date();
        
        // Default status
        const status = "U obradi";
        
        // Format cart items as JSON for sadrzaj
        const sadrzaj = JSON.stringify(korpa.map(item => ({
            id: item.id,
            naziv: item.naziv,
            cena: item.cena,
            kolicina: item.kolicina
        })));
        
        // Insert order into database
        await db.query(
            "INSERT INTO porudzbine(id, iduser, datum, iznos, status, adresa, sadrzaj) VALUES($1, $2, $3, $4, $5, $6, $7)",
            [id, iduser, datum, iznos, status, adresa, sadrzaj]
        );
        
        // DO NOT attempt to insert into porudzbine_stavke - we're storing everything in the sadrzaj JSON field
        
        // NOVO: Pošalji email notifikaciju
        try {
            // Formatiramo sadržaj korpe za email
            let proizvodiHtml = '';
            korpa.forEach(item => {
                proizvodiHtml += `
                    <tr>
                        <td>${item.naziv}</td>
                        <td>${item.kolicina}</td>
                        <td>${item.cena} €</td>
                        <td>${(item.cena * item.kolicina).toFixed(2)} €</td>
                    </tr>
                `;
            });

            const emailHtml = `
                <h2>Nova narudžbina - #${id}</h2>
                <p><strong>Datum:</strong> ${datum.toLocaleString('sr-RS')}</p>
                <p><strong>Kupac:</strong> ${ime} ${prezime}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Telefon:</strong> ${telefon}</p>
                <p><strong>Adresa:</strong> ${adresa}</p>
                ${napomena ? `<p><strong>Napomena:</strong> ${napomena}</p>` : ''}
                
                <h3>Naručeni proizvodi:</h3>
                <table border="1" style="border-collapse: collapse; width: 100%;">
                    <thead>
                        <tr style="background-color: #f0f0f0;">
                            <th style="padding: 8px;">Proizvod</th>
                            <th style="padding: 8px;">Količina</th>
                            <th style="padding: 8px;">Cena</th>
                            <th style="padding: 8px;">Ukupno</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${proizvodiHtml}
                        <tr style="font-weight: bold; background-color: #e0e0e0;">
                            <td colspan="3" style="padding: 8px;">UKUPNO:</td>
                            <td style="padding: 8px;">${iznos.toFixed(2)} €</td>
                        </tr>
                    </tbody>
                </table>
            `;

            await transporter.sendMail({
                from: '"Mazor Shop" <ivanovicmicko4@gmail.com>',
                to: ['mazor@t-com.me', 'radnjamazor@gmail.com'],
                subject: `Nova narudžbina #${id} - ${ime} ${prezime}`,
                html: emailHtml
            });
            

            console.log('Email notifikacija uspešno poslana za narudžbinu #' + id);
        } catch (emailError) {
            console.error('Greška pri slanju email notifikacije:', emailError);
            // Ne prekidamo proces čak i ako email ne može da se pošalje
        }
        
        // Clear cart after successful order
        req.session.korpa = [];
        
        // Redirect to success page or order summary
        res.redirect("/profil");
        
    } catch (err) {
        console.error("Greška pri obradi porudžbine:", err);
        res.status(500).send("Došlo je do greške prilikom obrade porudžbine. Pokušajte ponovo.");
    }
});
app.get("/servisi", async(req,res) =>{
    res.render("servisi.ejs", { session: req.session });
})

// Dodaj rutu za 404 stranicu
app.get("/404", (req, res) => {
    res.status(404).render("404.ejs", { session: req.session });
});

// Važno: Ovo je middleware koji hvata sve rute koje nisu definisane iznad
// Mora biti postavljen NAKON svih regularnih ruta
app.use((req, res, next) => {
    res.status(404).render("404.ejs", { session: req.session });
});

app.listen(port, () => {
    console.log(`Ide`);
});