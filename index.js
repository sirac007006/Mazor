import db from "db";
import express from "express";
import bcrypt from "bcrypt";
import bodyParser from "body-parser";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", async(req, res) =>{
    res.render("index.ejs");
})
app.get("/kontakt", async(req,res) =>{
    res.render("kontakt.ejs");
})
app.get("/prijava", async(req,res) =>{
    res.render("prijava.ejs");
})
app.get("/registracija", async(req,res) =>{
    res.render("registracija.ejs");
})
app.get("/zaboravljenalozinka", async(req,res) =>{
    res.render("email.ejs");
})
app.get("/korpa", async(req,res) =>{
    res.render("korpa.ejs");
});
app.get("/kupovina", async(req,res) =>{
    res.render("kupovina.ejs");
})
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });