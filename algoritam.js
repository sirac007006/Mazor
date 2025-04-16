// Napredni algoritam za mapiranje proizvoda na sve kategorije iz subcategories.csv
import Papa from 'papaparse';
import fs from 'fs/promises';  // Koristimo Node.js fs modul umesto window objekta

async function intelligentCategoryMapping() {
  try {
    // Učitavanje podataka koristeći fs/promises umesto window.fs
    const subcategoriesContent = await fs.readFile('subcategories.csv', { encoding: 'utf8' });
    const proizvodifulContent = await fs.readFile('proizvodiful.csv', { encoding: 'utf8' });
    
    // Parsiranje CSV podataka
    const subcategories = Papa.parse(subcategoriesContent, {
      header: true,
      skipEmptyLines: true
    }).data;
    
    const products = Papa.parse(proizvodifulContent, {
      header: true,
      skipEmptyLines: true
    }).data;
    
    // Osnovne informacije
    console.log(`Učitano ${subcategories.length} kategorija i ${products.length} proizvoda`);
    
    // Funkcija za uklanjanje dijakritičkih znakova
    function removeDiacritics(str) {
      if (!str) return '';
      return str.normalize('NFD')
               .replace(/[\u0300-\u036f]/g, '')
               .replace(/đ/g, 'd').replace(/Đ/g, 'D')
               .replace(/š/g, 's').replace(/Š/g, 'S')
               .replace(/č/g, 'c').replace(/Č/g, 'C')
               .replace(/ć/g, 'c').replace(/Ć/g, 'C')
               .replace(/ž/g, 'z').replace(/Ž/g, 'Z');
    }
    
    // Kreiranje rečnika ključnih reči za svaku kategoriju
    const categoryKeywords = {};
    
    // Mapiranje specifičnih ključnih reči za kategorije
    // Za svaku kategoriju definišemo više varijanti (i sa velikim i sa malim slovima)
    const specificKeywords = {
      // Bela tehnika
      'Frižideri': ['frizider', 'FRIZIDER', 'Frizider', 'friz', 'FRIZ', 'Friz', 'hladnjak', 'HLADNJAK', 'fridge', 'refrigerator', 'cooling'],
      'Veš mašine': ['ves', 'VES', 'Ves', 'masina', 'MASINA', 'Masina', 'w/m', 'W/M', 'vm', 'VM', 'washing', 'WASHING', 'veseraj', 'W/m'],
      'Zamrzivači': ['zamrzivac', 'ZAMRZIVAC', 'Zamrzivac', 'freezer', 'FREEZER', 'deep freeze', 'DEEP FREEZE', 'rez', 'REZ', 'zam', 'ZAM', 'lada'],
      'Mašine za pranje suđa': ['sudovi', 'SUDOVI', 'Sudovi', 'dishwasher', 'DISHWASHER', 'sudo masina', 'SUDO MASINA', 'sudje', 'SUDJE', 'M/S', 'M/s'],
      'Mašine za sušenje': ['sus', 'SUSENJE', 'Susenje', 'dryer', 'DRYER', 'Dryer', 'susara', 'SUSARA'],
      'Bojleri': ['bojler', 'BOJLER', 'Bojler', 'boiler', 'BOILER', 'Boiler', 'water heater', 'WATER HEATER'],
      'Aspiratori': ['aspirator', 'ASPIRATOR', 'Aspirator', 'hood', 'HOOD', 'Hood', 'napa', 'NAPA', 'Napa', 'aspir'],
      
      // TV i Audio
      'Televizori': ['tv', 'TV', 'Tv', 'televizor', 'TELEVIZOR', 'Televizor', 'led', 'LED', 'Led', 'lcd', 'LCD', 'smart tv', 'SMART TV'],
      'Audio plejeri': ['audio', 'AUDIO', 'Audio', 'player', 'PLAYER', 'Player', 'mp3', 'MP3', 'muzicki', 'MUZICKI', 'vokmen', 'VOKMEN'],
      'Radio': ['radio', 'RADIO', 'Radio', 'fm', 'FM', 'am', 'AM', 'prijemnik', 'PRIJEMNIK'],
      'Zvucnici': ['zvucnik', 'ZVUCNIK', 'Zvucnik', 'speaker', 'SPEAKER', 'Speaker', 'zvuc', 'Zvuc'],
      'Slušalice': ['slusalice', 'SLUSALICE', 'Slusalice', 'headphones', 'HEADPHONES', 'earphones', 'bubice', 'BUBICE', 'slus'],
      
      // Šporeti, kamini, peći
      'Šporeti': ['sporet', 'SPORET', 'Sporet', 'stednjak', 'STEDNJAK', 'stove', 'STOVE', 'cooker', 'COOKER', 'rerna'],
      'Peći': ['pec', 'PEC', 'Pec', 'kamin', 'KAMIN', 'Kamin', 'grejanje', 'GREJANJE', 'grejac', 'GREJAC', 'heater'],
      'Dimne cijevi': ['dimna', 'DIMNA', 'Dimna', 'cev', 'CEV', 'Cev', 'dimnjak', 'DIMNJAK', 'chimney'],
      
      // Ugradna tehnika
      'Indukcione ploče': ['indukciona', 'INDUKCIONA', 'Indukciona', 'ploca', 'PLOCA', 'Ploca', 'induction', 'INDUCTION'],
      'Ugradne ploče': ['ugradna', 'UGRADNA', 'Ugradna', 'Ugr.ploca', 'UGR.PLOCA', 'Ploca', 'built-in', 'BUILT-IN'],
      'Ugradne rerne': ['ugradna', 'UGRADNA', 'Ugradna', 'rerna', 'RERNA', 'Rerna', 'built-in', 'oven', 'OVEN'],
      'Ugradne mašine za suđe': ['ugradna', 'UGRADNA', 'Ugradna', 'sudo', 'SUDO', 'Sudo', 'built-in', 'dishwasher'],
      'Ugradni aspiratori': ['ugradni', 'UGRADNI', 'Ugradni', 'aspirator', 'ASPIRATOR', 'Aspirator', 'built-in', 'hood'],
      'Ugradne frižideri': ['ugradni', 'UGRADNI', 'Ugradni', 'frizider', 'FRIZIDER', 'Frizider', 'built-in'],
      'Ugradne mikrotalasne': ['ugradna', 'UGRADNA', 'Ugradna', 'mikrotalasna', 'MIKROTALASNA', 'Mikrotalasna', 'built-in'],
      
      // Mali kućni aparati
      'Aparati za kafu': ['kafa', 'KAFA', 'Kafa', 'espresso', 'ESPRESSO', 'Espresso', 'coffee', 'COFFEE', 'nescafe'],
      'Pegle': ['pegla', 'PEGLA', 'Pegla', 'iron', 'IRON', 'Iron', 'steamer', 'STEAMER', 'Steamer'],
      'Sokovnici': ['sok', 'SOK', 'Sok', 'juice', 'JUICE', 'Juice', 'juicer', 'JUICER', 'cediljka'],
      'Usisivači': ['usisivac', 'USISIVAC', 'Usisivac', 'vacuum', 'VACUUM', 'Vacuum', 'cleaner', 'CLEANER'],
      'Paročistači': ['parocistac', 'PAROCISTAC', 'Parocistac', 'steam', 'STEAM', 'Steam', 'cleaner', 'CLEANER'],
      'Mikrotalasne': ['mikrotalasna', 'MIKROTALASNA', 'Mikrotalasna', 'mikrovalna', 'microwave', 'MICROWAVE', 'micro'],
      'Pekači': ['pekac', 'PEKAC', 'Pekac', 'hleba', 'HLEBA', 'bread', 'BREAD', 'toster', 'TOSTER'],
      'Roštilji': ['rostilj', 'ROSTILJ', 'Rostilj', 'grill', 'GRILL', 'Grill', 'bbq', 'BBQ', 'barbecue'],
      'Grilovi': ['gril', 'GRIL', 'Gril', 'grill', 'GRILL', 'Grill', 'toster', 'TOSTER', 'sendvic'],
      'Friteza': ['friteza', 'FRITEZA', 'Friteza', 'fryer', 'FRYER', 'Fryer', 'airfryer', 'AIRFRYER'],
      'Mašine za šišanje i brijanje': ['sisanje', 'SISANJE', 'Sisanje', 'brijanje', 'BRIJANJE', 'trimmer', 'TRIMMER', 'shaver'],
      'Vage': ['vaga', 'VAGA', 'Vaga', 'scale', 'SCALE', 'Scale', 'weight', 'WEIGHT', 'merenje'],
      'Fenovi': ['fen', 'FEN', 'Fen', 'susilo', 'SUSILO', 'Susilo', 'dryer', 'DRYER', 'hair dryer'],
      'Mikser': ['mikser', 'MIKSER', 'Mikser', 'mixer', 'MIXER', 'Mixer', 'blender', 'BLENDER', 'mutilica'],
      'Depilatori i epilatori': ['depilator', 'DEPILATOR', 'Depilator', 'epilator', 'EPILATOR', 'wax', 'WAX', 'hair removal'],
      'Blenderi': ['blender', 'BLENDER', 'Blender', 'mixer', 'MIXER', 'Mixer', 'smoothie', 'SMOOTHIE', 'stick blender'],
      'Čajovnici': ['cajnik', 'CAJNIK', 'Cajnik', 'kettle', 'KETTLE', 'Kettle', 'kuhalo', 'KUHALO', 'water boiler'],
      'Mlinovi': ['mlin', 'MLIN', 'Mlin', 'mill', 'MILL', 'Mill', 'grinder', 'GRINDER', 'coffee grinder'],
      'Stajleri i prese za kosu': ['stajler', 'STAJLER', 'Stajler', 'presa', 'PRESA', 'Presa', 'uvijac', 'UVIJAC', 'styler'],
      'Aparati za hranu': ['hrana', 'HRANA', 'Hrana', 'food', 'FOOD', 'Food', 'pripremanje', 'PRIPREMANJE', 'kuhinjski'],
      
      // Grejanje i hlađenje
      'Grijalice': ['grijalica', 'GRIJALICA', 'Grijalica', 'grejalica', 'GREJALICA', 'Grejalica', 'heater', 'HEATER', 'grejanje'],
      'Klime': ['klima', 'KLIMA', 'Klima', 'air', 'AIR', 'Air', 'conditioner', 'CONDITIONER', 'ac', 'AC', 'klimatizacija'],
      
      // Laptopi i tableti
      'Tablet uređaji': ['tablet', 'TABLET', 'Tablet', 'tab', 'TAB', 'Tab', 'ipad', 'IPAD', 'iPad', 'android tablet'],
      'Laptop računari': ['laptop', 'LAPTOP', 'Laptop', 'notebook', 'NOTEBOOK', 'Notebook', 'computer', 'COMPUTER', 'pc', 'PC'],
      
      // Telefoni i gaming
      'Mobilni telefoni': ['telefon', 'TELEFON', 'Telefon', 'mobile', 'MOBILE', 'Mobile', 'smartphone', 'SMARTPHONE', 'iphone'],
      'Konzole': ['konzola', 'KONZOLA', 'Konzola', 'playstation', 'PLAYSTATION', 'xbox', 'XBOX', 'nintendo'],
      
      // Razno
      'Kablovi': ['kabl', 'KABL', 'Kabl', 'cable', 'CABLE', 'Cable', 'adapter', 'ADAPTER', 'connector', 'CONNECTOR'],
      'Stono posuđe': ['stono', 'STONO', 'Stono', 'posudje', 'POSUDJE', 'Posudje', 'tableware', 'TABLEWARE', 'escajg'],
      'Posuđe za pripremu hrane': ['posudje', 'POSUDJE', 'Posudje', 'priprema', 'PRIPREMA', 'hrana', 'HRANA', 'cookware'],
      'Filteri': ['filter', 'FILTER', 'Filter', 'filtration', 'FILTRATION', 'Filtration', 'preciscivac', 'PRECISCIVAC'],
      'Antene': ['antena', 'ANTENA', 'Antena', 'antenna', 'ANTENNA', 'Antenna', 'signal', 'SIGNAL', 'satelitska'],
      'Baterije': ['baterija', 'BATERIJA', 'Baterija', 'battery', 'BATTERY', 'Battery', 'punjiva', 'PUNJIVA', 'punjac'],
      'Ostalo': ['ostalo', 'OSTALO', 'Ostalo', 'misc', 'MISC', 'Misc', 'drugo', 'DRUGO', 'razno', 'RAZNO']
    };
    
    // Dodaj sve kategorije iz subcategories.csv
    subcategories.forEach(subcat => {
      if (!subcat.naziv || !subcat.id) return; // Preskoči prazne redove
      
      const categoryName = subcat.naziv;
      const cleanCategoryName = removeDiacritics(categoryName);
      
      // Prvo dodaj osnovni naziv kategorije bez dijakritičkih znakova
      // i DODAJ SVE VARIJANTE VELIKIH/MALIH SLOVA
      const variants = [
        cleanCategoryName.toLowerCase(),  // mala slova
        cleanCategoryName.toUpperCase(),  // VELIKA SLOVA
        cleanCategoryName.charAt(0).toUpperCase() + cleanCategoryName.slice(1).toLowerCase() // Prva Velika
      ];
      
      categoryKeywords[categoryName] = variants;
      
      // Dodaj specifične ključne reči ako postoje
      if (specificKeywords[categoryName]) {
        categoryKeywords[categoryName].push(...specificKeywords[categoryName]);
      } else {
        // Ako nema specifičnih ključnih reči, dodaj pojedinačne reči iz naziva
        const words = cleanCategoryName.toLowerCase().split(' ');
        words.forEach(word => {
          if (word.length > 3) { // Samo reči duže od 3 karaktera
            categoryKeywords[categoryName].push(word);
            // Dodatno dodajemo varijante velikih/malih slova
            categoryKeywords[categoryName].push(word.toUpperCase());
            categoryKeywords[categoryName].push(
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            );
          }
        });
      }
    });
    
    // Osnovni pregled generisanih ključnih reči
    console.log(`Generisano ključnih reči za ${Object.keys(categoryKeywords).length} kategorija`);
    
    // Pomoćna funkcija za ocenu podudaranja
    function scoreMatch(productName, keywords) {
      if (!productName) return 0;
      
      // Pretvaramo naziv proizvoda u mala slova i uklanjamo dijakritičke znakove
      const cleanProductName = removeDiacritics(productName).toLowerCase();
      let score = 0;
      
      for (const keyword of keywords) {
        // Pretvaramo ključnu reč u mala slova za case-insensitive podudaranje
        const cleanKeyword = keyword.toLowerCase();
        if (cleanProductName.includes(cleanKeyword)) {
          // Dajemo veći skor za duže ključne reči
          score += cleanKeyword.length;
        }
      }
      
      return score;
    }
    
    // Obrada proizvoda - mapiranje na kategorije
    let updatedCount = 0;
    let existingCount = 0;
    const updatedProducts = products.map(product => {
      // Ako proizvod već ima kategoriju, sačuvaj postojeću kategoriju
      if (product.subcategories && product.subcategories.trim() !== "") {
        existingCount++;
        return product; // Vrati originalni proizvod sa postojećom kategorijom
      }
      
      // Preskoči ako proizvod nema naziv
      if (!product.naziv || product.naziv.trim() === "") {
        return product;
      }
      
      // Nađi najbolju kategoriju
      let bestCategory = null;
      let bestScore = 0;
      
      for (const [category, keywords] of Object.entries(categoryKeywords)) {
        const score = scoreMatch(product.naziv, keywords);
        
        if (score > bestScore) {
          bestScore = score;
          bestCategory = category;
        }
      }
      
      // Postavljamo minimalni prag skora da izbegnemo netačna mapiranja
      const MINIMUM_SCORE_THRESHOLD = 3;
      if (bestCategory && bestScore >= MINIMUM_SCORE_THRESHOLD) {
        updatedCount++;
        return { ...product, subcategories: bestCategory };
      }
      
      // Ako je skor ispod praga, ne dodeljujemo kategoriju
      return product;
    });
    
    // Statistika ažuriranja
    const emptyBefore = products.filter(p => !p.subcategories || p.subcategories.trim() === "").length;
    const emptyAfter = updatedProducts.filter(p => !p.subcategories || p.subcategories.trim() === "").length;
    
    console.log(`Statistika ažuriranja:
    - Ukupan broj proizvoda: ${products.length}
    - Proizvodi sa postojećom kategorijom: ${existingCount}
    - Proizvodi bez kategorije pre: ${emptyBefore}
    - Ažurirano proizvoda: ${updatedCount} 
    - Proizvodi bez kategorije posle: ${emptyAfter}`);
    
    // Prikaži neke primere ažuriranih proizvoda
    const examples = updatedProducts
      .filter((p, i) => {
        const originalProduct = products[i];
        return (!originalProduct.subcategories || originalProduct.subcategories.trim() === "") && 
                p.subcategories && p.subcategories.trim() !== "";
      })
      .slice(0, 10);
    
    console.log("\nPrimeri ažuriranih proizvoda:");
    examples.forEach(p => {
      console.log(`ID: ${p.id}, Naziv: ${p.naziv}, Kategorija: ${p.subcategories}`);
    });
    
    // Prikaži neke primere proizvoda sa zadržanim kategorijama
    const existingExamples = updatedProducts
      .filter((p, i) => products[i].subcategories && products[i].subcategories.trim() !== "")
      .slice(0, 5);
    
    console.log("\nPrimeri proizvoda sa zadržanim kategorijama:");
    existingExamples.forEach(p => {
      console.log(`ID: ${p.id}, Naziv: ${p.naziv}, Kategorija: ${p.subcategories}`);
    });
    
    // Konvertuj nazad u CSV
    const updatedCsv = Papa.unparse(updatedProducts);
    
    // Sačuvaj ažurirani CSV u novu datoteku
    await fs.writeFile('proizvodiful_updated.csv', updatedCsv, 'utf8');
    
    console.log("Ažurirani CSV sačuvan u proizvodiful_updated.csv");
    
    return {
      stats: {
        total: products.length,
        existingWithCategories: existingCount,
        emptyBefore,
        updated: updatedCount,
        emptyAfter
      },
      examples,
      existingExamples,
      updatedCsv
    };
    
  } catch (error) {
    return { error: error.message };
  }
}

// Izvrši funkciju i prikaži rezultate
intelligentCategoryMapping().then(result => {
  console.log("Završeno ažuriranje kategorija.");
  if (result.error) {
    console.error("Greška:", result.error);
  } else {
    console.log("Statistika:", result.stats);
  }
}).catch(error => {
  console.error("Greška pri izvršavanju:", error);
});