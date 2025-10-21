const fetch = require("node-fetch");

// ENV proměnné
const SHOPIFY_ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
const SHOPIFY_STORE = `${process.env.SHOPIFY_STORE_NAME}.myshopify.com`;
const API_FUNCTION_URL = "https://dreamy-sprite-72ab2d.netlify.app/.netlify/functions/getMatches";

// Alias tabulka
const aliasMap = {
  "ac milan":"ac milan","milan":"ac milan",
  "inter milan":"internazionale milano","inter":"internazionale milano",
  "atalanta":"atalanta bergamasca calcio","atalanta bergamo":"atalanta bergamasca calcio","atalanta bc":"atalanta bergamasca calcio",
  "ajax":"ajax","afc ajax":"ajax","ajax amsterdam":"ajax",
  "az":"az alkmaar","az alkmaar":"az alkmaar",
  "pec zwolle":"pec zwolle","zwolle":"pec zwolle",
  "nac breda":"nac breda","breda":"nac breda",
  "fc groningen":"fc groningen","groningen":"fc groningen",
  "heracles almelo":"heracles almelo","heracles":"heracles almelo",
  "sc heerenveen":"sc heerenveen","heerenveen":"sc heerenveen","heerenveren":"sc heerenveen",
  "sbv excelsior":"sbv excelsior","excelsior":"sbv excelsior","excelsior rotterdam":"sbv excelsior",
  "telstar 1963":"telstar 1963","telstar":"telstar 1963","sc telstar":"telstar 1963",
  "feyenoord":"feyenoord rotterdam","feyenoord rotterdam":"feyenoord rotterdam",
  "psv":"psv","psv eindhoven":"psv",
  "utrecht":"fc utrecht","fc utrecht":"fc utrecht",
  "nec":"nec nijmegen","nijmegen":"nec nijmegen","nec nijmegen":"nec nijmegen",
  "go ahead eagles":"go ahead eagles","g a eagles":"go ahead eagles","g a eagels":"go ahead eagles","go-ahead eagles":"go ahead eagles",
  "bayer leverkusen":"bayer leverkusen","bayer 04 leverkusen":"bayer leverkusen","leverkusen":"bayer leverkusen",
  "borussia dortmund":"borussia dortmund","dortmund":"borussia dortmund","bvb":"borussia dortmund",
  "1 fc union berlin":"1 fc union berlin","1. fc union berlin":"1 fc union berlin","union berlin":"1 fc union berlin",
  "sc freiburg":"sc freiburg","freiburg":"sc freiburg","sport-club freiburg":"sc freiburg",
  "vfb stuttgart":"vfb stuttgart","stuttgart":"vfb stuttgart",
  "eintracht frankfurt":"eintracht frankfurt","frankfurt":"eintracht frankfurt",
  "fc bayern munchen":"fc bayern munchen","bayern":"fc bayern munchen","bayern munich":"fc bayern munchen","bayern münchen":"fc bayern munchen","fc bayern":"fc bayern munchen",
  "sg dynamo dresden":"sg dynamo dresden","dynamo dresden":"sg dynamo dresden","dresden":"sg dynamo dresden",
  "fc augsburg":"fc augsburg","augsburg":"fc augsburg",
  "1. fsv mainz 05":"1. fsv mainz 05","1 fsv mainz 05":"1. fsv mainz 05","mainz":"1. fsv mainz 05",
  "tsg 1899 hoffenheim":"tsg 1899 hoffenheim","tsg hoffenheim":"tsg 1899 hoffenheim","hoffenheim":"tsg 1899 hoffenheim",
"bayern": "fc bayern munchen",
"bayern munchen": "fc bayern munchen",
"bayern munich": "fc bayern munchen",
"fc bayern": "fc bayern munchen",
"fc bayern munich": "fc bayern munchen",
"fc bayern munchen": "fc bayern munchen",
"hamburg": "hamburger sv",
"hamburg sv": "hamburger sv",
"hamburger sv": "hamburger sv",
"hamburger sport verein": "hamburger sv",
"hamburger sport-verein": "hamburger sv",
  "athletic club":"athletic club","ath bilbao":"athletic club","athletic bilbao":"athletic club","athletic club bilbao":"athletic club","bilbao":"athletic club",
  "everton fc":"everton fc","everton":"everton fc",
  "nottingham forest fc":"nottingham forest fc","nottingham forest":"nottingham forest fc","nottingham":"nottingham forest fc","forest":"nottingham forest fc",
  "tottenham hotspur":"tottenham hotspur","tottenham":"tottenham hotspur","tottenham hotspurs":"tottenham hotspur","spurs":"tottenham hotspur",
  "manchester united":"manchester united","manchester utd":"manchester united","man utd":"manchester united","man united":"manchester united",
  "arsenal fc":"arsenal fc","arsenal":"arsenal fc",
  "chelsea fc":"chelsea fc","chelsea":"chelsea fc",
  "leeds united":"leeds united","leeds":"leeds united","leeds utd":"leeds united",
  "burnley":"burnley",
  "aston villa fc":"aston villa fc","aston villa":"aston villa fc","villa":"aston villa fc",
  "sunderland afc":"sunderland afc","sunderland":"sunderland afc",
  "wrexham afc":"wrexham afc","wrexham":"wrexham afc",
  "liverpool fc":"liverpool fc","liverpool":"liverpool fc",
  "newcastle united":"newcastle united","newcastle":"newcastle united","newcastle utd":"newcastle united",
  "manchester city":"manchester city","man city":"manchester city",
  "west ham united":"west ham united","west ham":"west ham united","westham":"west ham united",
  "wolverhampton wanderers":"wolverhampton wanderers","wolves":"wolverhampton wanderers","wolverhampton":"wolverhampton wanderers",
  "brighton & hove albion":"brighton & hove albion","brighton":"brighton & hove albion","brighton and hove":"brighton & hove albion",
  "brentford fc":"brentford fc","brentford":"brentford fc",
  "afc bournemouth":"afc bournemouth","bournemouth":"afc bournemouth",
  "fulham fc":"fulham fc","fulham":"fulham fc",
  "crystal palace":"crystal palace",
  "celtic fc":"celtic fc","celtic":"celtic fc",
  "rangers fc":"rangers fc","rangers":"rangers fc",
  "ac sparta praha":"ac sparta praha","sparta praha":"ac sparta praha",
  "sk slavia praha":"sk slavia praha","slavia praha":"sk slavia praha",
  "fenerbahce":"fenerbahce","fenerbahçe":"fenerbahce",
  "germany":"germany","slovakia":"slovakia","ceska republika":"czech republic","czech republic":"czech republic",
  "ajax":"Ajax","az alkmaar":"AZ Alkmaar","pec zwolle":"PEC Zwolle","nac breda":"NAC Breda",
  "fc groningen":"FC Groningen","heracles almelo":"Heracles Almelo","sc heerenveen":"SC Heerenveen",
  "sbv excelsior":"SBV Excelsior","telstar 1963":"Telstar 1963","feyenoord rotterdam":"Feyenoord",
  "psv eindhoven":"PSV Eindhoven","fc utrecht":"FC Utrecht","nec nijmegen":"NEC","go ahead eagles":"Go Ahead Eagles",
  "bayer leverkusen":"Bayer 04 Leverkusen","1 fc union berlin":"1. FC Union Berlin","sc freiburg":"SC Freiburg",
  "vfb stuttgart":"VfB Stuttgart","eintracht frankfurt":"Eintracht Frankfurt","fc bayern munchen":"FC Bayern München",
  "sg dynamo dresden":"SG Dynamo Dresden","fc augsburg":"FC Augsburg","1. fsv mainz 05":"1. FSV Mainz 05","tsg 1899 hoffenheim":"TSG 1899 Hoffenheim","fc bayern munchen": "FC Bayern München",
"hamburger sv": "Hamburger SV",
  "athletic club":"Athletic Club","celtic fc":"Celtic","rangers fc":"Rangers",
  "everton fc":"Everton","nottingham forest fc":"Nottingham Forest","tottenham hotspur":"Tottenham Hotspur",
  "manchester united":"Manchester United","arsenal fc":"Arsenal","chelsea fc":"Chelsea","leeds united":"Leeds United",
  "burnley":"Burnley","aston villa fc":"Aston Villa","sunderland afc":"Sunderland","wrexham afc":"Wrexham",
  "liverpool fc":"Liverpool","newcastle united":"Newcastle United","manchester city":"Manchester City",
  "west ham united":"West Ham United","wolverhampton wanderers":"Wolverhampton Wanderers","brighton & hove albion":"Brighton & Hove Albion",
  "brentford fc":"Brentford","afc bournemouth":"AFC Bournemouth","fulham fc":"Fulham","crystal palace":"Crystal Palace",
  "ac sparta praha":"AC Sparta Praha","sk slavia praha":"SK Slavia Praha",
  "fenerbahce":"Fenerbahçe",
  "germany":"Germany","slovakia":"Slovakia","czech republic":"Czech Republic",
"fc bayern munchen": "Bayern Munich",
    "vfb stuttgart": "Stuttgart",
    "leeds united": "Leeds",
    "sc freiburg": "Freiburg",
    "tsg 1899 hoffenheim": "Hoffenheim",
    "tottenham hotspur": "Tottenham",
"ssc napoli": "napoli",
"napoli": "napoli", "napoli":"Napoli"
};

function normalizeTeamName(name) {
  return aliasMap[name.trim().toLowerCase()] || name.trim();
}

// === FUNKCE ===
exports.handler = async function () {
  try {
    const now = new Date();
    console.log(`🚀 Spuštěno v: ${now.toISOString()}`);
    let debugLogs = [];

    // 1. Načti zápasy z API
    const matchRes = await fetch(API_FUNCTION_URL);
    const matchJson = await matchRes.json();
    const matches = matchJson?.matches || [];

    // 2. Vytvoř seznam názvů zápasů: "Home vs Away"
    const validNames = matches.map(
      (match) => `${normalizeTeamName(match.homeTeam.name)} vs ${normalizeTeamName(match.awayTeam.name)}`
    );
    debugLogs.push(`📄 Zápasy z API: ${validNames.length} ks`);

    // 3. Načti produkty z Shopify
    const shopifyRes = await fetch(`https://${SHOPIFY_STORE}/admin/api/2023-04/products.json?limit=250`, {
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ADMIN_API_TOKEN,
        "Content-Type": "application/json",
      },
    });

    const shopifyJson = await shopifyRes.json();
    const products = shopifyJson.products;

    for (const product of products) {
      const title = product.title;

      if (product.tags?.includes("never-hide")) {
        debugLogs.push(`⏭️ "${title}" přeskočen (má tag 'never-hide')`);
        continue;
      }

      // 🧠 Normalizace názvu
      const [homeRaw, awayRaw] = title.toLowerCase().split(" vs ");
      const normalizedTitle = `${normalizeTeamName(homeRaw)} vs ${normalizeTeamName(awayRaw)}`;
      debugLogs.push(`🔍 Kontroluji "${title}" → alias: "${normalizedTitle}"`);

      // === Odpovídá API zápasu?
      if (validNames.includes(normalizedTitle)) {
        debugLogs.push(`✅ "${title}" je v seznamu aktivních zápasů (API) – zůstává.`);
        continue;
      }

      // === Kontrola ručního data zápasu
      const metafieldsRes = await fetch(
        `https://${SHOPIFY_STORE}/admin/api/2023-04/products/${product.id}/metafields.json`,
        {
          headers: {
            "X-Shopify-Access-Token": SHOPIFY_ADMIN_API_TOKEN,
            "Content-Type": "application/json",
          },
        }
      );

      const metafieldsJson = await metafieldsRes.json();
      const matchDateField = metafieldsJson.metafields.find(
        (f) => f.namespace === "custom" && f.key === "match_date"
      );

      if (!matchDateField) {
        debugLogs.push(`⚠️ "${title}" není v API a nemá match_date → zůstává.`);
        continue;
      }

      const matchDate = new Date(matchDateField.value);
      matchDate.setHours(23, 59, 59, 999); // Ošetření času

      if (matchDate < now) {
        debugLogs.push(`🛑 "${title}" – zápas proběhl (${matchDate.toISOString()}) → SKRÝVÁM.`);

        const updateRes = await fetch(`https://${SHOPIFY_STORE}/admin/api/2023-04/products/${product.id}.json`, {
          method: "PUT",
          headers: {
            "X-Shopify-Access-Token": SHOPIFY_ADMIN_API_TOKEN,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            product: {
              id: product.id,
              status: "draft",
            },
          }),
        });

        const updateJson = await updateRes.json();
        debugLogs.push(`✅ "${title}" skryt jako 'draft'`);
      } else {
        debugLogs.push(`🕓 "${title}" – zápas v budoucnu (${matchDate.toISOString()}) → aktivní.`);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Kontrola dokončena",
        logs: debugLogs,
      }),
    };
  } catch (error) {
    console.error("❌ Chyba ve skriptu hide_products:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};