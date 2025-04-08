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
app.get("/", (req, res) => {
    res.render("index.ejs", { session: req.session });
});
app.get("/kontakt", async(req,res) =>{
    res.render("kontakt.ejs", { session: req.session });
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
app.get("/korpa", async(req,res) =>{
    res.render("korpa.ejs", { session: req.session });
});
app.get("/kupovina", async(req,res) =>{
    res.render("kupovina.ejs", { session: req.session });
})
app.get("/servisi", async(req,res) =>{
    res.render("servisi.ejs", { session: req.session });
})
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});