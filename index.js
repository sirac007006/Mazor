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

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });