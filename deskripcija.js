import pg from "pg";
import axios from "axios";
import * as cheerio from "cheerio";

const db = new pg.Client({
  user: "postgres",
  password: "marko123",
  host: "localhost",
  port: 5432,
  database: "Mazor",
});

const SCRAPERAPI_KEY = "03f824b13b37da5056cc1f31b54cf82d";

async function fetchProductsWithoutDescription() {
  await db.connect();
  const res = await db.query(`
    SELECT id, naziv, subcategories 
    FROM proizvodiful_updated 
    where deskripcija = 'nema' and subcategories != 'Stono posuđe' and subcategories != 'Filteri' and subcategories != 'Dimne cijevi' and subcategories != 'Ostalo'
    LIMIT 1000
  `);
  return res.rows;
}

async function getGoogleLinks(queryText) {
  const query = encodeURIComponent(queryText + " specifikacije");
  const url = `http://api.scraperapi.com?api_key=${SCRAPERAPI_KEY}&url=https://www.google.com/search?q=${query}`;

  try {
    const res = await axios.get(url, { timeout: 80000 });
    const $ = cheerio.load(res.data);

    const links = [];
    $("a").each((i, el) => {
      const href = $(el).attr("href");
      if (
        href &&
        href.startsWith("http") &&
        !href.includes("google") &&
        !href.includes("youtube") &&
        !href.includes("facebook") &&
        !href.includes("voxelectronics.com") &&
        !href.includes("dodatnaoprema.com") &&
        !href.includes("tehnoprometst.rs") &&
        !href.includes("gorenje.com") &&
        !href.includes("ekupi.ba") &&
        !href.includes("kralj.hr") &&
        !href.includes("aquamanija.rs") &&
        !href.includes("ctshop.rs") &&
        !href.includes("domod.ba") &&
        !href.includes("icecat") &&
        !href.includes("tango.rs") &&
        !href.includes("dotmarket.rs") &&
        !href.includes("panteh.eu") &&
        !href.includes("elektroterm.rs") &&
        !href.includes("sellme.ee") &&
        !href.includes("sellme.ee") &&
        !href.includes("sellme.ee") &&
        !href.includes("deliks.rs") &&
        !href.includes("ribamundotecnologia.es") &&
        !href.includes("kucnatehnika.com") &&
        !href.includes("shoptok.si") &&
        !href.includes("poklonizakucu.rs") &&
        !href.includes("datalink.me") &&
        !href.includes("foxelectronics") &&
        !href.includes("electronic.ba") &&
        !href.includes("kernel.me") &&
        !href.includes("technomarket.rs") &&
        !href.includes("pioneerhomeaudio") &&
        !href.includes("bgelektronik.shop") &&
        !href.includes("peki.si") &&
        !href.includes("tri-o.rs") &&
        !href.includes("kliklak.rs") &&
        !href.includes("bosch-home") &&
        !href.includes("shoppster.rs") &&
        !href.includes("mall.hr") &&
        !href.includes("metro.it") &&
        !href.includes("centar-tehnike.hr") &&
        !href.includes("vesmasine.rs") &&
        !href.includes("andromedapc.me") &&
        !href.includes("ggmgastro.com") &&
        !href.includes("agromanojlovic.com") &&
        !href.includes("hgspot.hr") &&
        !href.includes("euroline.co.rs") &&
        !href.includes("eplaneta.rs") &&
        !href.includes("avalon-ltd.com") &&
        !href.includes("notebookcheck.net") &&
        !href.includes("tempo-tehnika.rs") &&
        !href.includes("kitele.com") &&
        !href.includes("ecomex.rs") &&
        !href.includes("bauhaus.hr") &&
        !href.includes("cmcelectric.com") &&
        !href.includes("najnajshop.rs") &&
        !href.includes("rakispilacourisltd") &&
        !href.includes("poruci.rs") &&
        !href.includes("appliancesdirect.co.uk") &&
        !href.includes("inelektronik.rs") &&
        !href.includes("triomax.ba") &&
        !href.includes("kingtrade.hr") &&
        !href.includes("aghasarkissian.com") &&
        !href.includes("winwin.rs") &&
        !href.includes("boss.co.rs") &&
        !href.includes("help.eset.com") &&
        !href.includes("foxelectronics.rs") &&
        !href.includes("digitalis.ba") &&
        !href.includes("ananas.rs") &&
        !href.includes("rowenta") &&
        !href.includes("drtechno.rs") &&
        !href.includes("svezakucu.rs") &&
        !href.includes("fero-term.si") &&
        !href.includes("bazzar.hr") &&
        !href.includes("vivax.com") &&
        !href.includes("internetshop.co.rs") &&
        !href.includes("alles.hr") &&
        !href.includes("gasiks.rs") &&
        !href.includes("ananas") &&
        !href.includes("newegg.com") &&
        !href.includes("rowenta") &&
        !href.includes("central-ch.com") &&
        !href.includes("tehnodepo.ba") &&
        !href.includes("api.goglasi.com") &&
        !href.includes("vodoterm.co.rs") &&
        !href.includes("gigatron.rs") &&
        !href.includes("spektar.rs") &&
        !href.includes("spektar.rs") &&
        !href.includes("prof.lv") &&
        !href.includes("nabava.net") &&
        !href.includes("attriumcacak.rs") &&
        !href.includes("bigbang.hr") &&
        !href.includes("dijaspora.shop") &&
        !href.includes("soundstar.gr") &&
        !href.includes("iskrabih.com") &&
        !href.includes("eurotehnikamn.me") &&
        !href.includes("fontana.rs") &&
        !href.includes("euronics") &&
        !href.includes("dateks.lv") &&
        !href.includes("lobod.me") &&
        !href.includes("digitec.ch") &&
        !href.includes("tehnomedia.rs") &&
        !href.includes("maxidom.rs") &&
        !href.includes("lg.com") &&
        !href.includes("protis.hr") &&
        !href.includes("kodmitra.com") &&
        !href.includes("elbraco.rs") &&
        !href.includes("merkury.hr") &&
        !href.includes("hdtelevizija.com") &&
        !href.includes("acs-klime.rs") &&
        !href.includes("frigo.hr") &&
        !href.includes("tehnopromet.rs") &&
        !href.includes("samsung.com") &&
        !href.includes("nitom.rs") &&
        !href.includes("kucniaparati.com") &&
        !href.includes("bigboom.eu") &&
        !href.includes("computers.rs") &&
        !href.includes("centrometal.hr") &&
        !href.includes("ananas.me") &&
        !href.includes("protronic.hr") &&
        !href.includes("bazzar") &&
        !href.includes("bazzar") &&
        !href.includes("enaa.com") &&
        !href.includes("gembird.rs") &&
        !href.includes("unicor.rs") &&
        !href.includes("tv-it.com") &&
        !href.includes("jakov.rs") &&
        !href.includes("gsmarena.com") &&
        !href.includes("digitrend.ba") &&
        !href.includes("eklix.rs") &&
        !href.includes("zoka.co.rs") &&
        !href.includes("tehnikauka.rs") &&
        !href.includes("blackdot.co.me") &&
        !href.includes("digitalko.me") &&
        !href.includes("exceed.rs") &&
        !href.includes("tehnoplus.ba") &&
        !href.includes("hisense.com") &&
        !href.includes("topchoice.com.mt") &&
        !href.includes("gstore.rs") &&
        !href.includes("multicom.me") &&
        !href.includes("marketserviszlatko.com") &&
        !href.includes("loudshop.me") &&
        !href.includes("sinclair-solutions.com") &&
        !href.includes("manuall.co.uk") &&
        !href.includes("forum.benchmark.rs") &&
        !href.includes("betterlifeuae.com") &&
        !href.includes("elektron.me") &&
        !href.includes("halooglasi.com") &&
        !href.includes("domoprema.rs") &&
        !href.includes("vitapur") &&
        !href.includes("tehnoplus.me") &&
        !href.includes("www.bcgroup-online.com") &&
        !href.includes("ekupi") &&
        !href.includes("shop.miele.rs") &&
        !href.includes("emix.ba") &&
        !href.includes("keeptank.rs") &&
        !href.includes("datika.me") &&
        !href.includes("promobil.me") &&
        !href.includes("amazon") &&
        !href.includes("idealno.ba") &&
        !href.includes("gsmpcshop.rs") &&
        !href.includes("aspiratori.rs") &&
        !href.includes("paluba.info") &&
        !href.includes("mazor.co.me") &&
        !href.includes("kondoras.rs") &&
        !href.includes("eponuda") &&
        !href.includes("goglasi") &&
        !href.includes("tehnocentar") &&
        !href.includes("uspon.rs") &&
        !href.includes("manuals") &&
        !href.includes("veli.store") &&
        !href.includes("bosch-home.rs") &&
        !href.includes("svijetgrijanja.ba") &&
        !href.includes("racunalo.com") &&
        !href.includes("magnetik.rs") &&
        !href.includes("magnetik.rs") &&
        !href.includes("magnetik.rs") &&
        !href.includes("omegashop.ba") &&
        !href.includes("pc-gamer.me") &&
        !href.includes("tehnoplanet.me") &&
        !href.includes("megashop.ba") &&
        !href.includes("tehnomanija.rs") &&
        !href.includes("tehnoteka.rs") &&
        !href.includes("technoshop.ba") &&
        !href.includes("loren.co.rs") &&
        !href.includes("zeusbl.com") &&
        !href.includes("plocicekeramika.rs") &&
        !href.includes("eltom.rs") &&
        !href.includes("vitapur.rs") &&
        !href.includes("eponuda.com") // ISKLJUČUJEMO VOX ELECTRONICS
      ) {
        links.push(href);
      }
    });

    return [...new Set(links)].slice(0, 5);
  } catch (e) {
    console.error("❌ Google pretraga nije uspela:", e.message);
    return [];
  }
}

async function fetchDescriptionFromLink(link) {
  const url = `http://api.scraperapi.com?api_key=${SCRAPERAPI_KEY}&url=${encodeURIComponent(link)}`;
  try {
    const res = await axios.get(url, { timeout: 30000 });
    const $ = cheerio.load(res.data);
    const keywords = [
      "kapacitet",
      "rpm",
      "energetska",
      "programa",
      "klasa",
      "garancija",
      "dimenzije",
      "snaga",
      "zapremina",
      "frenkvencija",
      "brzina",
      "protok",
      "osvetljenje",
      "buka",
      "ugradnj",
      "hdmi",
      "smart",

    ];

    let results = [];

    $("table, ul, ol, div").each((i, el) => {
      const text = $(el).text().toLowerCase();
      if (keywords.some((k) => text.includes(k)) && text.length < 1500) {
        results.push($(el).text().trim());
      }
    });

    const uniqueLines = Array.from(
      new Set(
        results
          .join("\n")
          .split("\n")
          .map((l) => l.trim())
          .filter((l) =>
            l.length > 0 &&
            l.length < 1000 &&
            !l.toLowerCase().includes("cene koje se nalaze") &&
            !l.toLowerCase().includes("informativnog karaktera") &&
            !l.toLowerCase().includes("kontaktirajte") &&
            !l.toLowerCase().includes("podeli sa prijateljima")
          )
      )
    );

    const uniqueBlocks = Array.from(new Set(uniqueLines.join("\n").split(/\n{2,}/)));

    return uniqueBlocks.slice(0, 10).join("\n\n");
  } catch (err) {
    console.error("⚠️ Greška sa linkom:", link, err.message);
    return null;
  }
}

async function fetchDescriptionFromWeb(productName, subcategory) {
  const fullQuery = `${productName} ${subcategory}`.trim();
  const links = await getGoogleLinks(fullQuery);

  for (const link of links) {
    console.log("➡️ Pokušavam:", link);
    const desc = await fetchDescriptionFromLink(link);
    if (desc && desc.length > 100) return desc;
  }

  return null;
}

async function updateDescriptionInDB(id, description) {
  const query = "UPDATE proizvodiful_updated SET deskripcija = $1 WHERE id = $2";
  await db.query(query, [description, id]);
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  const products = await fetchProductsWithoutDescription();

  for (const product of products) {
    const fullName = `${product.naziv} ${product.subcategories || ""}`.trim();
    console.log("🔍 Obrađujem:", fullName);

    const description = await fetchDescriptionFromWeb(product.naziv, product.subcategories || "");

    if (description) {
      console.log("📝 Deskripcija koja se upisuje:\n", description);
      await updateDescriptionInDB(product.id, description);
      console.log("✅ Deskripcija uneta.");
    } else {
      await updateDescriptionInDB(product.id, "failed");
      console.log("❌ Nema pronađene deskripcije. Upisano 'failed'.");
    }

    await delay(2000);
  }

  await db.end();
})();