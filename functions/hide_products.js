const fetch = require("node-fetch");

const SHOPIFY_ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
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
  return aliasMap[name.trim().toLowerCase()] || name.trim().toLowerCase();
}

function sameDay(dateA, dateB) {
  const d1 = new Date(new Date(dateA).toLocaleString("en-US", { timeZone: "Europe/Prague" }));
  const d2 = new Date(new Date(dateB).toLocaleString("en-US", { timeZone: "Europe/Prague" }));
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

exports.handler = async function () {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Prague" }));
  const today = now.toISOString().split("T")[0];
  const debug = [];

  try {
    // 1. API zápasy
    const apiRes = await fetch(API_FUNCTION_URL);
    const apiJson = await apiRes.json();
    const apiMatches = apiJson.matches || [];

    const activeMatchNames = apiMatches.map(m => {
      const home = normalizeTeamName(m.home_team);
      const away = normalizeTeamName(m.away_team);
      return `${home} vs ${away}`;
    });

    // 2. Produkty z Shopify
    const prodRes = await fetch(`https://${SHOPIFY_STORE}/admin/api/2023-04/products.json?status=active&limit=250`, {
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ADMIN_API_TOKEN,
        "Content-Type": "application/json",
      },
    });

    const products = (await prodRes.json()).products;

    for (const product of products) {
      const title = product.title || "";
      if (!title.toLowerCase().includes(" vs ")) continue;
      if (product.tags && product.tags.includes("never-hide")) {
        debug.push(`⏭️ ${title} přeskočen (tag never-hide)`);
        continue;
      }

      const [home, away] = title.toLowerCase().split(" vs ");
      const normTitle = `${normalizeTeamName(home)} vs ${normalizeTeamName(away)}`;

      let matchIsToday = false;

      // 3. Hledání v API
      for (const match of apiMatches) {
        const matchTitle = `${normalizeTeamName(match.home_team)} vs ${normalizeTeamName(match.away_team)}`;
        if (matchTitle === normTitle && sameDay(match.utcDate, now)) {
          matchIsToday = true;
          break;
        }
      }

      // 4. Pokud není v API, zkus metafield
      if (!matchIsToday) {
        const mfRes = await fetch(`https://${SHOPIFY_STORE}/admin/api/2023-04/products/${product.id}/metafields.json`, {
          headers: {
            "X-Shopify-Access-Token": SHOPIFY_ADMIN_API_TOKEN,
            "Content-Type": "application/json",
          },
        });

        const metafields = (await mfRes.json()).metafields;
        const matchDateField = metafields.find(
          (f) => f.namespace === "custom" && f.key === "match_date"
        );

        if (matchDateField) {
          const matchDate = new Date(matchDateField.value);
          if (sameDay(matchDate, now)) {
            matchIsToday = true;
          }
        }
      }

      if (matchIsToday) {
        // 5. SKRYJ
        await fetch(`https://${SHOPIFY_STORE}/admin/api/2023-04/products/${product.id}.json`, {
          method: "PUT",
          headers: {
            "X-Shopify-Access-Token": SHOPIFY_ADMIN_API_TOKEN,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            product: {
              id: product.id,
              status: "archived",
            },
          }),
        });
        debug.push(`🔴 ${title} → skryt (zápas je dnes)`);
      } else {
        debug.push(`🟢 ${title} → ponechán aktivní`);
      }
    }

    return {
      statusCode: 200,
      body: debug.join("\n"),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: `Chyba: ${err.message}`,
    };
  }
};