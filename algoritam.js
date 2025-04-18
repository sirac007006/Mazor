// Algoritam za prepoznavanje brendova u nazivima proizvoda
import Papa from 'papaparse';
import fs from 'fs/promises';

async function detectBrands() {
  try {
    // Učitavanje proizvoda iz CSV fajla
    const proizvodifulContent = await fs.readFile('proizvodiful.csv', { encoding: 'utf8' });
    
    // Parsiranje CSV-a
    const proizvodi = Papa.parse(proizvodifulContent, {
      header: true,
      skipEmptyLines: true
    }).data;
    
    console.log(`Ukupno proizvoda: ${proizvodi.length}`);
    
    // Statistika postojećih brendova
    const popunjenBrendCount = proizvodi.filter(p => p.brend && p.brend.trim() !== "").length;
    console.log(`Proizvodi sa popunjenim brendom: ${popunjenBrendCount}`);
    console.log(`Proizvodi bez brenda: ${proizvodi.length - popunjenBrendCount}`);
    
    // Lista brendova sa različitim varijantama pisanja (velika/mala slova)
    const brendVarijante = {
      'Samsung': ['samsung', 'SAMSUNG', 'Samsung'],
      'LG': ['lg', 'LG', 'Lg'],
      'Sony': ['sony', 'SONY', 'Sony'],
      'Panasonic': ['panasonic', 'PANASONIC', 'Panasonic'],
      'Philips': ['philips', 'PHILIPS', 'Philips'],
      'Bosch': ['bosch', 'BOSCH', 'Bosch'],
      'Siemens': ['siemens', 'SIEMENS', 'Siemens'],
      'Gorenje': ['gorenje', 'GORENJE', 'Gorenje'],
      'Beko': ['beko', 'BEKO', 'Beko'],
      'Whirlpool': ['whirlpool', 'WHIRLPOOL', 'Whirlpool', 'WHIRPOOL'],
      'Electrolux': ['electrolux', 'ELECTROLUX', 'Electrolux'],
      'AEG': ['aeg', 'AEG', 'Aeg'],
      'Tefal': ['tefal', 'TEFAL', 'Tefal'],
      'Sinclair': ['SINCLAIR', 'sinclair', 'Sinclair'],
      'Vox': ['vox', 'VOX', 'Vox'],
      'Tesla': ['tesla', 'TESLA', 'Tesla'],
      'HP': ['hp', 'HP', 'Hp'],
      'Dell': ['dell', 'DELL', 'Dell'],
      'Apple': ['apple', 'APPLE', 'Apple'],
      'Huawei': ['huawei', 'HUAWEI', 'Huawei'],
      'Nokia': ['nokia', 'NOKIA', 'Nokia'],
      'Lenovo': ['lenovo', 'LENOVO', 'Lenovo'],
      'ASUS': ['asus', 'ASUS', 'Asus'],
      'Acer': ['acer', 'ACER', 'Acer'],
      'Pioneer': ['pioneer', 'PIONEER', 'Pioneer'],
      'Toshiba': ['toshiba', 'TOSHIBA', 'Toshiba'],
      'Sharp': ['sharp', 'SHARP', 'Sharp'],
      'Grundig': ['grundig', 'GRUNDIG', 'Grundig'],
      'Miele': ['miele', 'MIELE', 'Miele'],
      'Candy': ['candy', 'CANDY', 'Candy'],
      'Zanussi': ['zanussi', 'ZANUSSI', 'Zanussi'],
      'Indesit': ['indesit', 'INDESIT', 'Indesit'],
      'Hisense': ['hisense', 'HISENSE', 'Hisense'],
      'Elegant': ['Elegant', 'elegant', 'ELEGANT'],
      'Duracell':['duracell', 'Duracell', 'DURACELL'],
      'Alfa Plam':['alfa', 'Alfa', 'ALFA'],
      'Xiaomi': ['xiaomi', 'XIAOMI', 'Xiaomi', 'Redmi', 'REDMI', 'redmi'],
      'Ariston': ['ariston', 'ARISTON', 'Ariston'],
      'Blaupunkt': ['blaupunkt', 'BLAUPUNKT', 'Blaupunkt'],
      'Alcatel': ['alcatel', 'ALCATEL', 'Alcatel'],
      'Daewoo': ['daewoo', 'DAEWOO', 'Daewoo'],
      'Hyundai': ['hyundai', 'HYUNDAI', 'Hyundai'],
      'JVC': ['jvc', 'JVC', 'Jvc'],
      'Karcher': ['karcher', 'KARCHER', 'Karcher'],
      'Kenwood': ['kenwood', 'KENWOOD', 'Kenwood'],
      'KitchenAid': ['kitchenaid', 'KITCHENAID', 'Kitchenaid'],
      'Krups': ['krups', 'KRUPS', 'Krups'],
      'Moulinex': ['moulinex', 'MOULINEX', 'Moulinex'],
      'OPPO': ['oppo', 'OPPO', 'Oppo'],
      'Philco': ['philco', 'PHILCO', 'Philco'],
      'Rowenta': ['rowenta', 'ROWENTA', 'Rowenta'],
      'Sencor': ['sencor', 'SENCOR', 'Sencor'],
      'Braun': ['braun', 'BRAUN', 'Braun'],
      'Midea': ['midea', 'MIDEA', 'Midea'],
      'Vivax': ['vivax', 'VIVAX', 'Vivax'],
      'Motorola': ['motorola', 'MOTOROLA', 'Motorola'],
      'Hoover': ['hoover', 'HOOVER', 'Hoover'],
      'Rosenlew': ['rosenlew', 'ROSENLEW', 'Rosenlew'],
      'Hotpoint': ['hotpoint', 'HOTPOINT', 'Hotpoint'],
      'Elite': ['elite', 'ELITE', 'Elite'],
      'Favorit': ['favorit', 'FAVORIT', 'Favorit'],
      'Vega': ['vega', 'VEGA', 'Vega'],
      'First': ['first', 'FIRST', 'First'],
      'Continental': ['continental', 'CONTINENTAL', 'Continental'],
      'Crown': ['crown', 'CROWN', 'Crown'],
      'Digi': ['digi', 'DIGI', 'Digi'],
      'Haier': ['haier', 'HAIER', 'Haier'],
      'Gree': ['gree', 'GREE', 'Gree'],
      'Končar': ['koncar', 'KONCAR', 'Koncar'],
      'Matrix': ['matrix', 'MATRIX', 'Matrix'],
      'Omega': ['omega', 'OMEGA', 'Omega'],
      'Orion': ['orion', 'ORION', 'Orion'],
      'Quadro': ['quadro', 'QUADRO', 'Quadro'],
      'Royal': ['royal', 'ROYAL', 'Royal'],
      'Singer': ['singer', 'SINGER', 'Singer'],
      'Vesta': ['vesta', 'VESTA', 'Vesta'],
      'Champion': ['champion', 'CHAMPION', 'Champion'],
      'Nikon': ['nikon', 'NIKON', 'Nikon'],
      'Canon': ['canon', 'CANON', 'Canon'],
      'Olympus': ['olympus', 'OLYMPUS', 'Olympus'],
      'Fuji': ['fuji', 'FUJI', 'Fuji'],
      'Fujitsu': ['fujitsu', 'FUJITSU', 'Fujitsu'],
      'Mitsubishi': ['mitsubishi', 'MITSUBISHI', 'Mitsubishi'],
      'Microsoft': ['microsoft', 'MICROSOFT', 'Microsoft'],
      'Mediacom': ['mediacom', 'MEDIACOM', 'Mediacom'],
      'iPhone': ['iphone', 'IPHONE', 'iPhone'],
      'MacBook': ['macbook', 'MACBOOK', 'MacBook'],
      'Hitachi': ['hitachi', 'HITACHI', 'Hitachi'],
      'PlayStation': ['playstation', 'PLAYSTATION', 'PlayStation'],
      'Xbox': ['xbox', 'XBOX', 'Xbox'],
      'Nintendo': ['nintendo', 'NINTENDO', 'Nintendo'],
      'Sony PlayStation': ['sony playstation', 'SONY PLAYSTATION', 'Sony PlayStation'],
      'DeLonghi': ['delonghi', 'DELONGHI', 'DeLonghi', 'De Longhi', 'DE LONGHI'],
      'Zelmer': ['zelmer', 'ZELMER', 'Zelmer'],
      'BenQ': ['benq', 'BENQ', 'BenQ'],
      'Kodak': ['kodak', 'KODAK', 'Kodak'],
      'Electronic': ['electronic', 'ELECTRONIC', 'Electronic'],
      'Sanyo': ['sanyo', 'SANYO', 'Sanyo'],
      'Fisher':['Fiser', 'fiser', 'FISER'],
      'Dyson': ['dyson', 'DYSON', 'Dyson'],
      'Genius': ['genius', 'GENIUS', 'Genius'],
      'Logitech': ['logitech', 'LOGITECH', 'Logitech', 'logiteh', 'LOGITEH', 'Logiteh']
    };
    
    // Lista generičkih termina koje treba ignorisati pri pretrazi
    const ignoreTerms = [
      'set', 'masina', 'uredjaj', 'aparat', 'kamin', 'fen', 'kucni', 'mini',
      'mala', 'mali', 'veliko', 'veliki', 'adapter', 'kabl', 'televizor', 'tv',
      'monitor', 'laptop', 'racunar', 'telefon', 'slusalice', 'zvucnik', 'frižider',
      'sporet', 'pegla', 'usisivac', 'klima', 'bojler', 'radio', 'blender', 'mikser'
    ];
    
    // Ažuriranje proizvoda - dodavanje brenda
    let updatedCount = 0;
    let existingCount = 0;
    let unassignedCount = 0;
    
    const updatedProizvodi = proizvodi.map(proizvod => {
      // Ako proizvod već ima brend, zadrži ga
      if (proizvod.brend && proizvod.brend.trim() !== "") {
        existingCount++;
        return proizvod;
      }
      
      // Preskoči ako proizvod nema naziv
      if (!proizvod.naziv || proizvod.naziv.trim() === "") {
        return proizvod;
      }
      
      const naziv = proizvod.naziv;
      
      // Proveri da li naziv sadrži neki od poznatih brendova
      for (const [brandName, brandVariants] of Object.entries(brendVarijante)) {
        for (const variant of brandVariants) {
          // Ignoriši ako je brend deo generičkog termina
          let isGeneric = false;
          for (const term of ignoreTerms) {
            if (term.toLowerCase().includes(variant.toLowerCase()) || variant.toLowerCase().includes(term.toLowerCase())) {
              isGeneric = true;
              break;
            }
          }
          
          if (isGeneric) continue;
          
          // Proveri da li naziv proizvoda sadrži varijantu brenda
          // Koristimo regex za proveru da li je brend zasebna reč
          const regex = new RegExp(`\\b${variant}\\b|^${variant}|${variant}$`, 'i');
          if (regex.test(naziv)) {
            updatedCount++;
            return { ...proizvod, brend: brandName };
          }
        }
      }
      
      // Ako nismo našli podudaranje sa poznatim brendom, kategorišemo kao 'Bez rasporeda po brendovima'
      unassignedCount++;
      return { ...proizvod, brend: 'Bez rasporeda po brendovima' };
    });
    
    // Statistika ažuriranja
    const emptyBefore = proizvodi.filter(p => !p.brend || p.brend.trim() === "").length;
    const emptyAfter = updatedProizvodi.filter(p => !p.brend || p.brend.trim() === "").length;
    const unassignedAfter = updatedProizvodi.filter(p => p.brend === 'Bez rasporeda po brendovima').length;
    
    console.log(`Statistika ažuriranja brendova:
    - Ukupan broj proizvoda: ${proizvodi.length}
    - Proizvodi sa postojećim brendom: ${existingCount}
    - Proizvodi bez brenda pre: ${emptyBefore}
    - Ažurirano proizvoda sa prepoznatim brendom: ${updatedCount} 
    - Kategorisano kao 'Bez rasporeda po brendovima': ${unassignedCount}
    - Proizvodi bez brenda posle: ${emptyAfter}`);
    
    // Prikaži neke primere ažuriranih proizvoda
    const examplesAssigned = updatedProizvodi
      .filter((p, i) => {
        const originalProduct = proizvodi[i];
        return (!originalProduct.brend || originalProduct.brend.trim() === "") && 
                p.brend && p.brend.trim() !== "" && 
                p.brend !== 'Bez rasporeda po brendovima';
      })
      .slice(0, 5);
    
    const examplesUnassigned = updatedProizvodi
      .filter(p => p.brend === 'Bez rasporeda po brendovima')
      .slice(0, 5);
    
    console.log("\nPrimeri ažuriranih proizvoda sa prepoznatim brendom:");
    examplesAssigned.forEach(p => {
      console.log(`ID: ${p.id}, Naziv: ${p.naziv}, Brend: ${p.brend}`);
    });
    
    console.log("\nPrimeri proizvoda kategorisanih kao 'Bez rasporeda po brendovima':");
    examplesUnassigned.forEach(p => {
      console.log(`ID: ${p.id}, Naziv: ${p.naziv}, Brend: ${p.brend}`);
    });
    
    // Konvertuj nazad u CSV
    const updatedCsv = Papa.unparse(updatedProizvodi);
    
    // Sačuvaj ažurirani CSV u novu datoteku
    await fs.writeFile('proizvodiful_updated.csv', updatedCsv, 'utf8');
    
    console.log("Ažurirani CSV sačuvan u proizvodiful_updated.csv");
    
    return {
      stats: {
        total: proizvodi.length,
        existingWithBrands: existingCount,
        emptyBefore,
        updatedWithBrand: updatedCount,
        categorizedAsUnassigned: unassignedCount,
        emptyAfter,
        unassignedAfter
      },
      examplesAssigned,
      examplesUnassigned
    };
    
  } catch (error) {
    return { error: error.message };
  }
}

// Izvrši funkciju i prikaži rezultate
detectBrands().then(result => {
  console.log("Završeno ažuriranje brendova.");
  if (result.error) {
    console.error("Greška:", result.error);
  } else {
    console.log("Statistika:", result.stats);
  }
}).catch(error => {
  console.error("Greška pri izvršavanju:", error);
});