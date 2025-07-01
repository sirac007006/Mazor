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

// Primarni i rezervni API ključevi
const PRIMARY_SCRAPERAPI_KEY = "415a6197d3a5f51b63dd944a412d5cd4";
const BACKUP_SCRAPERAPI_KEY1 = "322858336d2ea84527fe1be304b4705a"; // Prvi rezervni ključ
const BACKUP_SCRAPERAPI_KEY2 = "56ca942d15fb81b16546b8cd43514c54"; // Drugi rezervnsi ključ

// Funkcija za korišćenje odgovarajućeg API ključa
async function fetchWithRetry(url, keyIndex = 0) {
  // Izbor odgovarajućeg ključa na osnovu indeksa
  let apiKey;
  switch (keyIndex) {
    case 0:
      apiKey = PRIMARY_SCRAPERAPI_KEY;
      break;
    case 1:
      apiKey = BACKUP_SCRAPERAPI_KEY1;
      break;
    case 2:
      apiKey = BACKUP_SCRAPERAPI_KEY2;
      break;
    default:
      throw new Error("Svi API ključevi su iskorišćeni ili su nevažeći");
  }
  
  const scraperUrl = `http://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(url)}`;
  
  try {
    return await axios.get(scraperUrl, { timeout: 80000 });
  } catch (error) {
    if (error.response && error.response.status === 403) {
      if (keyIndex < 2) { // Ako još uvek imamo rezervne ključeve
        console.log(`⚠️ API ključ #${keyIndex + 1} vratio 403 Forbidden, pokušavam sa sledećim ključem...`);
        return fetchWithRetry(url, keyIndex + 1); // Ponovni pokušaj sa sledećim ključem
      }
    }
    throw error; // Prosleđujemo grešku asko nije 403 ili ako su iskorišćeni svi ključevi
  }
}

async function fetchProductsWithoutDescription() {
  await db.connect();
  const res = await db.query(`
    SELECT id, naziv, subcategories 
FROM proizvodiful_updated 
WHERE deskripcija = 'alfa' 
  AND subcategories != 'Stono posuđe' 
  AND subcategories != 'Filteri' 
  AND subcategories != 'Dimne cijevi' 
  AND subcategories != 'Ostalo' 
  AND subcategories != 'Kablovi' 
  AND subcategories != 'Baterije' 
  AND subcategories != 'Posuđe za pripremu hrane'
ORDER BY id DESC
LIMIT 1000;
  `);
  return res.rows;
}

async function getGoogleLinks(queryText) {
  const query = encodeURIComponent(queryText + " specifikacije");
  const url = `https://www.google.com/search?q=${query}`;

  try {
    const res = await fetchWithRetry(url);
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
        !href.includes("dodatnaoprema.com") &&

        !href.includes("gorenje.com") &&
        !href.includes("ekupi.ba") &&
        !href.includes("kralj.hr") &&
        !href.includes("aquamanija.rs") &&
        !href.includes("ctshop.rs") &&
        !href.includes("domod.ba") &&
        !href.includes(".lt") &&
        !href.includes("karcher.com") &&
        !href.includes("tribi.rs") &&
        !href.includes("philips.hr") &&
        !href.includes("icecat") &&
        !href.includes("eurotehna.rs") &&
        !href.includes("klimacentar.com") &&
        !href.includes("www.sk.rs") &&
        !href.includes("vremejenovac.rs") &&
        !href.includes("cityshop.rs") &&
        !href.includes("salonicentar.com") &&
        !href.includes("coolsistem.com") &&
        !href.includes("cgprodavnica.com") &&
        !href.includes("makromikrogrupa.hr") &&
        !href.includes("najboljacena.rs") &&
        !href.includes("svetlostnis.rs") &&
        !href.includes("uputstvo.rs") &&
        !href.includes("zokapromet.rs") &&
        !href.includes("kontekst.io") &&
        !href.includes("tango.rs") &&
        !href.includes("dotmarket.rs") &&
        !href.includes("panteh.eu") &&
        !href.includes("elektroterm.rs") &&
        !href.includes("beltek.rs") &&
        !href.includes("olimpsport.rs") &&
        !href.includes("trgoban.rs") &&
        !href.includes("termorad.com") &&
        !href.includes("frog.rs") &&
        !href.includes("elektrooprema.net") &&
        !href.includes("lokaterm.com") &&
        !href.includes("dropshop.rs") &&
        !href.includes("nt.rs") &&
        !href.includes("ignis.rs") &&
        !href.includes("vatrostalnostaklo.rs") &&
        !href.includes("vacom.hr") &&
        !href.includes("unionelectronics.rs") &&
        !href.includes("alati.shop") &&
        !href.includes("ignis-aurum.hr") &&
        !href.includes("adriameer.com.hr") &&
        !href.includes("ljiljan-s.hr") &&
        !href.includes("hoopla.rshoopla.rs") &&
        !href.includes("e-catalog.com") &&
        !href.includes("klimakoncept.hr") &&
        !href.includes("detelina.rs") &&
        !href.includes("nexi.go.jp") &&
        !href.includes("stefan.co.rs") &&
        !href.includes("vivamedia.hr") &&
        !href.includes("klimauredjaji.co.rs") &&
        !href.includes("villager.rs") &&
        !href.includes("komelshop.rs") &&
        !href.includes("euroimpex.rs") &&
        !href.includes("klimescepanovic.com") &&
        !href.includes("kerametal.rs") &&
        !href.includes("kojo-komerc.com") &&
        !href.includes("pccomponentes.com") &&
        !href.includes("gorenje.cn") &&
        !href.includes("elementa.rs") &&
        !href.includes("virtikom.com") &&
        !href.includes("ronis.hr") &&
        !href.includes("sellme.ee") &&
        !href.includes("tika.hr") &&
        !href.includes("philips.rs") &&
        !href.includes("ikoma.hr") &&
        !href.includes("zumzum.rs") &&

        !href.includes("excetrashop.hr") &&
        !href.includes("prekoreda.com") &&
        !href.includes("positiveline.rs") &&
        !href.includes("bojleri-srbija.rs") &&
        !href.includes("pevex.hr") &&
        !href.includes("kupindo.com") &&
        !href.includes("deliks.rs") &&
        !href.includes("ribamundotecnologia.es") &&
        !href.includes("kucnatehnika.com") &&
        !href.includes("shoptok.si") &&
        !href.includes("poklonizakucu.rs") &&
        !href.includes("datalink.me") &&

        !href.includes("electronic.ba") &&


        !href.includes("pioneerhomeaudio") &&
        !href.includes("bgelektronik.shop") &&
        !href.includes("peki.si") &&
        !href.includes("procomp.ba") &&
        !href.includes("tri-o.rs") &&
        !href.includes("sharpconsumer.com") &&
        !href.includes("bigbang.rs") &&
        !href.includes("svezavasdom") &&
        !href.includes("kale.co.rs") &&
        !href.includes("mojwebshop") &&
        !href.includes("pametno.rs") &&
        !href.includes("dudico.com") &&
        !href.includes(".si") &&
        !href.includes(".ba") &&
        !href.includes(".ba") &&
        !href.includes(".ba") &&
        !href.includes(".ba") &&
        !href.includes(".ba") &&
        !href.includes(".ba") &&
        !href.includes(".ba") &&
        !href.includes("katalozi.njuskalo.hr") &&
        !href.includes("whirlpool.rs") &&
        !href.includes("cini.rs") &&
        !href.includes("contessa.rs") &&
        !href.includes("vodocentar.rs") &&
        !href.includes("enmongroup.com") &&
        !href.includes("kernel.me") &&
        !href.includes("montis-klima.com") &&
        !href.includes(".nl") &&
        !href.includes("machineseeker.rs") &&
        !href.includes("benchmark.rs") &&
        !href.includes("multicom.me") &&
        !href.includes("a1.hr") &&
        !href.includes("klimauredjaji.com") &&
        !href.includes("voxelectronics.com") &&
        !href.includes("shop.ellux.rs") &&
        !href.includes("fravega.com") &&
        !href.includes("technicmarket.rs") &&
        !href.includes("klimatizacija.hr") &&
        !href.includes("odigledolokomotive.rs") &&
        !href.includes("etrg.net") &&
        !href.includes("vjeverica.me") &&
        !href.includes("prodavnicaalata.rs") &&
        !href.includes("beha.com.hr") &&
        !href.includes("bojlerirenome.com") &&
        !href.includes("restart.rs") &&
        !href.includes("ralink.rs") &&
        !href.includes("bug.hr") &&
        !href.includes("zed.hr") &&
        !href.includes("tehnopolis.rs") &&
        !href.includes("gedoo.rs") &&
        !href.includes("samot.rs") &&
        !href.includes("megatone.net") &&
        !href.includes("fagor.me") &&
        !href.includes("deltapcshop.com") &&
        !href.includes("oglasiko.com") &&
        !href.includes("ciklama.com.hr") &&
        !href.includes("kamini.rs") &&
        !href.includes("ihousetop.decorexpro.com") &&
        !href.includes("diplon.net") &&
        !href.includes("rs.elmarkstore.eu") &&
        !href.includes("frigotehnika.hr") &&
        !href.includes("instagram.com") &&
        !href.includes("beobagat.rs") &&
        !href.includes("loudshop-247.magepitstop.com") &&
        !href.includes("maliali.rs") &&
        !href.includes("outletbeletehnike.rs") &&
        !href.includes("karcher-centar-keller.com") &&
        !href.includes("kozmetikafeniks.hr") &&
        !href.includes("panteh.hr") &&
        !href.includes("soping.rs") &&
        !href.includes("haier-europe.com") &&
        !href.includes("links.hr") &&
        !href.includes("tehnikasara.com") &&
        !href.includes("itnetwork.rs") &&
        !href.includes("alatitehnika.com") &&
        !href.includes("crafter.rs") &&
        !href.includes("lalafo.rs") &&
        !href.includes("warmpro.techinfus.com") &&
        !href.includes("kupon.rs") &&
        !href.includes("termor.rs") &&
        !href.includes("preporuke.hr") &&
        !href.includes("centralno-grijanje-na-drva.blogspot.com") &&
        !href.includes("hr.geekbuying.com") &&
        !href.includes("sistembp.com") &&
        !href.includes("ctmobile.rs") &&
        !href.includes("shopperalati.rs") &&
        !href.includes("orbiter-g.com") &&
        !href.includes("prodajabojlera.com") &&
        !href.includes("staklorezac.com") &&
        !href.includes("manuales.mx") &&
        !href.includes("metalflex.rs") &&
        !href.includes("okshop.rs") &&
        !href.includes("okov.me") &&
        !href.includes("interprom-bosch.rs") &&
        !href.includes("mega-shop.rs") &&
        !href.includes("neptun.rs") &&
        !href.includes("wobyhaus.co.rs") &&
        !href.includes("mbs.rs") &&
        !href.includes("emag.ro") &&
        !href.includes("scribd.com") &&
        !href.includes("shoptogo.rs") &&
        !href.includes("pavleri.com") &&
        !href.includes("ecotech-shop.rs") &&
        !href.includes("fix.rs") &&
        !href.includes("superalati.rs") &&
        !href.includes("indesit.ro") &&
        !href.includes("vipalati.rs") &&
        !href.includes("nshop.rs") &&
        !href.includes("delovizabelutehniku.com") &&
        !href.includes("zd-elpro.hr") &&
        !href.includes("bioenergypoint.com") &&
        !href.includes("sasomange.rs") &&
        !href.includes("ka.rs") &&
        !href.includes("iskustvaipreporuke.rs") &&
        !href.includes("panomed.com.hr") &&
        !href.includes("temaso.me") &&
        !href.includes("kamini-beofabrilor.com") &&
        !href.includes("tehno-mag.hr") &&
        !href.includes("termometal.hr") &&
        !href.includes("hobotnica.rs") &&
        !href.includes("mathema.hr") &&
        !href.includes("agria.hr") &&
        !href.includes("svebaterije.net") &&
        !href.includes("mspromet.com") &&
        !href.includes("prirucnici.hr") &&
        !href.includes("kaercher.com") &&
        !href.includes("metacon.rs") &&
        !href.includes("muziker.co.uk") &&
        !href.includes("lirsshop.rs") &&
        !href.includes("muziker.ie") &&
        !href.includes("bralex.co.me") &&
        !href.includes("chinaluoqi.com") &&
        !href.includes("dimensions.com") &&
        !href.includes("mi-srbija.rs") &&
        !href.includes("handy.rs") &&
        !href.includes("fero-term.hr") &&
        !href.includes("donic.rs") &&
        !href.includes("funavo.com.hr") &&
        !href.includes("dodatnaoprema.rs") &&
        !href.includes("kalimero.com.hr") &&
        !href.includes("pcpractic.rs") &&
        !href.includes("idealno.rs") &&
        !href.includes("gotech.al") &&
        !href.includes("mcooker-hrm.tomathouse.com") &&
        !href.includes("tradeinn.com") &&
        !href.includes("manua.ls") &&
        !href.includes("en.wikipedia.org") &&
        !href.includes("soundmachine.com.mt") &&
        !href.includes("tehnoroom.rs") &&
        !href.includes("bima-shop.si") &&
        !href.includes("bhtelecom.ba") &&
        !href.includes("adazal.ba") &&
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
        !href.includes("friz.hr") &&
        !href.includes("ikl.rs") &&
        !href.includes("ba.hw-glass.com") &&
        !href.includes("oxfordhouse.com.mt") &&
        !href.includes("tvcentardjecevic.me") &&
        !href.includes("bshop.co.rs") &&
        !href.includes("shopmania.rs") &&
        !href.includes("unichrom.hr") &&
        !href.includes("kupideo.com") &&
        !href.includes("elektrotermnis.rs") &&
        !href.includes("zutiklik.hr") &&
        !href.includes("frigocool.rs") &&
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
        !href.includes(".fi") &&
        !href.includes("mimovrste.com") &&
        !href.includes("kupujemprodajem.com") &&
        !href.includes("gasiks.rs") &&
        !href.includes("candy-home.com") &&
        !href.includes("ananas") &&
        !href.includes("newegg.com") &&
        !href.includes("rowenta") &&
        !href.includes("central-ch.com") &&
        !href.includes("tehnodepo.ba") &&
        !href.includes("api.goglasi.com") &&
        !href.includes("vodoterm.co.rs") &&
        !href.includes("gigatron.rs") &&
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
        !href.includes("icp-nis.co.rs") &&
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
        !href.includes("omegashop.ba") &&


        !href.includes("megashop.ba") &&
        !href.includes("alfaplam.rs") &&

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
  try {
    const res = await fetchWithRetry(link);
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
      "veličina",
      "rezolucija"
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

// Funkcija za praćenje statistike API ključeva
const apiKeyUsage = {
  primary: 0,
  backup1: 0,
  backup2: 0
};

// Modifikujemo axios funkciju da prati korišćenje različitih API ključeva
const originalGet = axios.get;
axios.get = function(url, config) {
  // Pratimo koji API ključ se koristi
  if (url.includes('api_key=' + PRIMARY_SCRAPERAPI_KEY)) {
    apiKeyUsage.primary++;
  } else if (url.includes('api_key=' + BACKUP_SCRAPERAPI_KEY1)) {
    apiKeyUsage.backup1++;
  } else if (url.includes('api_key=' + BACKUP_SCRAPERAPI_KEY2)) {
    apiKeyUsage.backup2++;
  }
  
  // Pozivamo originalnu funkciju sa istim argumentima
  return originalGet.apply(this, arguments);
};

// Funkcija za proveru statusa API ključeva
async function checkApiKeyStatus() {
  const testUrl = "https://www.google.com";
  const results = [];
  
  console.log("🔄 Provera statusa API ključeva...");
  
  // Testiramo primarni ključ
  try {
    await axios.get(`http://api.scraperapi.com?api_key=${PRIMARY_SCRAPERAPI_KEY}&url=${encodeURIComponent(testUrl)}`, { timeout: 10000 });
    results.push("✅ Primarni API ključ: Aktivan");
  } catch (error) {
    if (error.response && error.response.status === 403) {
      results.push("❌ Primarni API ključ: Neaktivan (403 Forbidden)");
    } else {
      results.push(`⚠️ Primarni API ključ: Greška (${error.message})`);
    }
  }
  
  // Testiramo prvi rezervni ključ
  try {
    await axios.get(`http://api.scraperapi.com?api_key=${BACKUP_SCRAPERAPI_KEY1}&url=${encodeURIComponent(testUrl)}`, { timeout: 10000 });
    results.push("✅ Prvi rezervni API ključ: Aktivan");
  } catch (error) {
    if (error.response && error.response.status === 403) {
      results.push("❌ Prvi rezervni API ključ: Neaktivan (403 Forbidden)");
    } else {
      results.push(`⚠️ Prvi rezervni API ključ: Greška (${error.message})`);
    }
  }
  
  // Testiramo drugi rezervni ključ
  try {
    await axios.get(`http://api.scraperapi.com?api_key=${BACKUP_SCRAPERAPI_KEY2}&url=${encodeURIComponent(testUrl)}`, { timeout: 10000 });
    results.push("✅ Drugi rezervni API ključ: Aktivan");
  } catch (error) {
    if (error.response && error.response.status === 403) {
      results.push("❌ Drugi rezervni API ključ: Neaktivan (403 Forbidden)");
    } else {
      results.push(`⚠️ Drugi rezervni API ključ: Greška (${error.message})`);
    }
  }
  
  console.log("\n=== STATUS API KLJUČEVA ===");
  results.forEach(result => console.log(result));
  console.log("===========================\n");
  
  // Resetujemo brojače nakon provere
  apiKeyUsage.primary = 0;
  apiKeyUsage.backup1 = 0;
  apiKeyUsage.backup2 = 0;
  
  return results.every(r => r.includes("Aktivan"));
}

// Funkcija za praćenje statistike
async function logStatistics(success, fail) {
  console.log("\n=== STATISTIKA ===");
  console.log(`✅ Uspešno: ${success}`);
  console.log(`❌ Neuspešno: ${fail}`);
  console.log(`🔄 Ukupno obrađeno: ${success + fail}`);
  console.log("\n=== KORIŠĆENJE API KLJUČEVA ===");
  console.log(`🔑 Primarni ključ: ${apiKeyUsage.primary} zahteva`);
  console.log(`🔑 Prvi rezervni ključ: ${apiKeyUsage.backup1} zahteva`);
  console.log(`🔑 Drugi rezervni ključ: ${apiKeyUsage.backup2} zahteva`);
  console.log("=================\n");
}

// Pomoćna funkcija za testiranje API ključa
async function testApiKey(key, index) {
  const testUrl = "https://www.google.com";
  try {
    await axios.get(`http://api.scraperapi.com?api_key=${key}&url=${encodeURIComponent(testUrl)}`, { timeout: 10000 });
    return true; // Ključ je aktivan
  } catch (error) {
    if (error.response && error.response.status === 403) {
      console.log(`❌ API ključ #${index + 1} je neaktivan (403 Forbidden)`);
      return false;
    }
    // Za druge greške pretpostavljamo da ključ može raditi
    console.log(`⚠️ API ključ #${index + 1}: Greška (${error.message}), ali pokušaćemo koristiti`);
    return true;
  }
}

// Modificirani fetchWithRetry koji koristi samo aktivne ključeve
async function initApiKeyStatus() {
  console.log("🔄 Inicijalizacija API ključeva...");
  
  // Testirajte sve ključeve
  const keyStatuses = [
    await testApiKey(PRIMARY_SCRAPERAPI_KEY, 0),
    await testApiKey(BACKUP_SCRAPERAPI_KEY1, 1),
    await testApiKey(BACKUP_SCRAPERAPI_KEY2, 2)
  ];
  
  // Formiramo listu aktivnih ključeva
  const activeKeys = [];
  if (keyStatuses[0]) activeKeys.push(PRIMARY_SCRAPERAPI_KEY);
  if (keyStatuses[1]) activeKeys.push(BACKUP_SCRAPERAPI_KEY1);
  if (keyStatuses[2]) activeKeys.push(BACKUP_SCRAPERAPI_KEY2);
  
  console.log(`\n✅ Pronađeno ${activeKeys.length} aktivnih API ključeva od 3 ukupno`);
  
  return activeKeys;
}

// Glavna funkcija
(async () => {
  try {
    // Inicijalizacija API ključeva i provera statusa
    const activeKeys = await initApiKeyStatus();
    
    if (activeKeys.length === 0) {
      console.log("❌ Nije pronađen nijedan aktivan API ključ! Prekidam proces...");
      return;
    }
    
    console.log(`🚀 Nastavljam rad sa ${activeKeys.length} aktivnih API ključeva...`);
    
    // Postavljamo funkciju za korišćenje aktivnih ključeva
    // Modifikujemo fetchWithRetry funkciju da koristi samo aktivne ključeve
    const originalFetchWithRetry = fetchWithRetry;
    fetchWithRetry = async function(url, keyIndex = 0) {
      if (keyIndex >= activeKeys.length) {
        throw new Error("Svi dostupni API ključevi su iskorišćeni");
      }
      
      const apiKey = activeKeys[keyIndex];
      const scraperUrl = `http://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(url)}`;
      
      try {
        return await axios.get(scraperUrl, { timeout: 80000 });
      } catch (error) {
        if (error.response && error.response.status === 403) {
          if (keyIndex < activeKeys.length - 1) {
            console.log(`⚠️ API ključ vratio 403 Forbidden, pokušavam sa sledećim dostupnim ključem...`);
            return fetchWithRetry(url, keyIndex + 1);
          }
        }
        throw error;
      }
    };
    
    
    const products = await fetchProductsWithoutDescription();
    let successCount = 0;
    let failCount = 0;

    console.log(`🚀 Počinjem obradu za ${products.length} proizvoda...`);

    for (const product of products) {
      const fullName = `${product.naziv} ${product.subcategories || ""}`.trim();
      console.log(`\n🔍 Obrađujem (${successCount + failCount + 1}/${products.length}): ${fullName}`);

      try {
        // Čuvamo prethodno stanje statistike
        const prevPrimaryCount = apiKeyUsage.primary;
        const prevBackup1Count = apiKeyUsage.backup1;
        const prevBackup2Count = apiKeyUsage.backup2;

        const description = await fetchDescriptionFromWeb(product.naziv, product.subcategories || "");

        // Pokazujemo koji ključ je korišćen
        if (apiKeyUsage.primary > prevPrimaryCount) {
          console.log("🔑 Korišćen primarni API ključ");
        } else if (apiKeyUsage.backup1 > prevBackup1Count) {
          console.log("🔑 Korišćen prvi rezervni API ključ");
        } else if (apiKeyUsage.backup2 > prevBackup2Count) {
          console.log("🔑 Korišćen drugi rezervni API ključ");
        }

        if (description) {
          console.log("📝 Deskripcija koja se upisuje:\n", description);
          await updateDescriptionInDB(product.id, description);
          console.log("✅ Deskripcija uneta.");
          successCount++;
        } else {
          await updateDescriptionInDB(product.id, "fullfailed");
          console.log("❌ Nema pronađene deskripcije. Upisano 'fullfailed'.");
          failCount++;
        }
      } catch (error) {
        console.error(`❌ Greška pri obradi proizvoda ${product.id}: ${error.message}`);
        // U slučaju greške, označavamo proizvod kao neuspešan ali nastavljamo s ostalima
        try {
          await updateDescriptionInDB(product.id, "error: " + error.message.substring(0, 100));
        } catch (dbError) {
          console.error("❌ Greška prilikom upisa u bazu:", dbError.message);
        }
        failCount++;
      }

      // Periodično beležimo statistiku
      if ((successCount + failCount) % 10 === 0) {
        await logStatistics(successCount, failCount);
      }

      // Pauza između proizvoda
      await delay(2000);
    }

    // Konačna statistika na kraju
    await logStatistics(successCount, failCount);
    console.log("✅ Obrada završena!");
  } catch (err) {
    console.error("❌ Globalna greška:", err);
  } finally {
    try {
      await db.end();
      console.log("🔄 Konekcija sa bazom je zatvorena.");
    } catch (err) {
      console.error("❌ Greška pri zatvaranju konekcije:", err.message);
    }
  }
})();