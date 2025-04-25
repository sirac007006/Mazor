import pg from "pg";
import express from "express";
import bcrypt from "bcrypt";
import bodyParser from "body-parser";
import expressSession from "express-session";

const app = express();
const port = 3000;
const saltRounds = 10;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(expressSession({
    secret: "tajni_kljuc", // Zameni ovim sigurniji ključ
    resave: false,
    saveUninitialized: false
}));
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

const db = new pg.Client({
    user: "postgres",
    password: "marko123",
    host: "localhost",
    port: 5432,
    database: "Mazor"
})

db.connect();
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
        "SELECT * FROM proizvodiful_updated WHERE subcategories = 'Televizori' limit 14"
    );
    const masine = (await db.query(
        "SELECT * FROM proizvodiful_updated limit 14 offset 317"
    )).rows;
    const televizori = rows;
    console.log(req.session)
    res.render("index.ejs", {
        televizori: televizori,
        masine:masine,
        session: req.session
    });
});
app.get("/404", async(req,res) =>{
    res.render("404.ejs", { session: req.session });
})
app.get("/kontakt", async(req,res) =>{
    res.render("kontakt.ejs", { session: req.session });
})
app.post("/kontakt", async(req, res) => {

        console.log("Primljeni podaci iz forme:", req.body);

        const { name, email, phone, subject, message } = req.body;

        const { rows } = await db.query("SELECT COUNT(*) FROM poruke");
        const id = parseInt(rows[0].count) + 1;
        const datum = new Date();

        const result = await db.query(
            "INSERT INTO poruke(id, ime, email, telefon, predmet, poruka, vreme) VALUES ($1, $2, $3, $4, $5, $6, $7)",
            [id, name, email, phone || null, subject || 'Kontakt poruka', message, datum]
        );

        console.log('Poruka uspešno sačuvana u bazi sa ID:', result.rows[0].id);
        res.send("Poruka uspešno sačuvana.");

});
app.get("/svekategorije", async(req,res) =>{
    const proizvodi = (await db.query(
        "SELECT * FROM proizvodiful_updated WHERE subcategories = 'Televizori' limit 6 offset 9"
    )).rows;
    res.render("svekategorije.ejs", { proizvodi:proizvodi, session: req.session });
})
app.get("/svekategorije/:category", async (req, res) => {
    var category = req.params.category;
    var bcategory = getCategory(category);
    const proizvodi = (await db.query(
        "SELECT * FROM proizvodiful_updated WHERE subcategories = 'Televizori' limit 6 offset 9"
    )).rows;
    var subcategories = (await db.query(
        "SELECT * FROM subcategories WHERE category = $1", [category]
    )).rows;
    console.log(subcategories);

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
        WHERE subcategories = $1 
        AND CAST(cena_sapdv AS NUMERIC) BETWEEN $2 AND $3
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
        WHERE subcategories = $1
    `;
    const brendovi = (await db.query(brendoviQuery, [subcategory])).rows.map(row => row.brend);

    // Dohvati MIN/MAX cena, uz pretvaranje u broj
    const minMaxQuery = `
        SELECT 
            MIN(CAST(cena_sapdv AS NUMERIC)) as min_price, 
            MAX(CAST(cena_sapdv AS NUMERIC)) as max_price 
        FROM proizvodiful_updated 
        WHERE subcategories = $1
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
            "SELECT * FROM proizvodiful_updated WHERE id = $1 AND subcategories = $2",
            [id, subcategory]
        );

        const proizvod = rows[0];
        console.log(proizvod);
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
            "SELECT * FROM proizvodiful_updated WHERE id = $1",
            [id]
        );

        const proizvod = rows[0];
        console.log(proizvod);
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
        console.log("greska");
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
        AND CAST(cena_sapdv AS NUMERIC) BETWEEN $2 AND $3
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
        WHERE LOWER(naziv) LIKE LOWER($1)
    `;
    const brendovi = (await db.query(brendoviQuery, [`%${searchQuery}%`])).rows.map(row => row.brend);

    // Dohvati min i max cenu unutar pretrage
    const minMaxQuery = `
        SELECT 
            MIN(CAST(cena_sapdv AS NUMERIC)) as min_price, 
            MAX(CAST(cena_sapdv AS NUMERIC)) as max_price 
        FROM proizvodiful_updated 
        WHERE LOWER(naziv) LIKE LOWER($1)
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
            return res.redirect("/prijava");
        }
        bcrypt.compare(password, user.lozinka, (err, result) => {
            if (err) {
                console.error("Greška pri proveri lozinke:", err);
                return res.redirect("/prijava");
            }

            if (result === true) {
                req.session.user = { 
                    ime: user.ime, 
                    prezime: user.prezime, 
                    email: user.email 
                }; // Postavi user u sesiju
                res.redirect("/");
            } else {
                res.redirect("/prijava");
            }
        });
    } catch (err) {
        console.error("Greška pri prijavi:", err);
        res.redirect("/prijava");
    }
});
app.get("/registracija", (req, res) => {
    res.render("registracija.ejs", { session: req.session });
});
app.post("/registracija", async (req, res) => {
    let id = ((await db.query("SELECT * FROM users")).rows).length;
    let ime = req.body.ime;
    let prezime = req.body.prezime;
    let email = req.body.email;
    let lozinka = req.body.lozinka;
    let telefon = req.body.telefon;
    let dbemail = (await db.query("SELECT lozinka from users where email = $1", [email])).rows[0];
    if(dbemail){
        res.redirect("/prijava")
    }
    else{
        bcrypt.hash(lozinka, saltRounds, async function (err, hash) {
            if (err) {
                console.error("Greška pri generisanju hesirane lozinke:", err);
                return res.status(500).send("Greška pri hesiranju lozinke");
            }

            console.log(hash);
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
app.get("/profil", async(req,res) =>{
    res.render("profil.ejs", { session: req.session });
})
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


app.get('/kupovina', (req, res) => {
    const korpa = req.session.korpa || [];

    let ukupno = 0;

    console.log(req.session)
    korpa.forEach(item => {
        ukupno += parseFloat(item.cena) * item.kolicina;
    });

    res.render("kupovina.ejs", {
        korpa: korpa,
        ukupno,
        session: req.session
    });
});

app.get("/servisi", async(req,res) =>{
    res.render("servisi.ejs", { session: req.session });
})
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});