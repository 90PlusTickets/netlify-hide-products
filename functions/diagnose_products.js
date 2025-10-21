
const fetch = require("node-fetch");

const SHOPIFY_ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
const SHOPIFY_STORE = `${process.env.SHOPIFY_STORE}.myshopify.com`;
const API_FUNCTION_URL = "https://dreamy-sprite-72ab2d.netlify.app/.netlify/functions/getMatches";

const TEAM_ALIASES = {
      "barcelona":"barcelona",
      "dortmund":"dortmund",
      "ac milan":"ac milan","milan":"ac milan",
      "inter milan":"inter milan","inter milan - reserve your tickets":"inter milan","inter first minute": "inter milan",
      "atalanta":"atalanta bergamasca calcio","atalanta bergamo":"atalanta bergamasca calcio","atalanta bc":"atalanta bergamasca calcio",
      "ajax":"ajax","afc ajax":"ajax","ajax amsterdam":"ajax","ajax":"ajax",
      "az":"az alkmaar","az alkmaar":"az alkmaar",
      "pec zwolle":"pec zwolle","zwolle":"pec zwolle",
      "nac breda":"nac breda","breda":"nac breda",
      "fc groningen":"fc groningen","groningen":"fc groningen",
      "heracles almelo":"heracles almelo","heracles":"heracles almelo",
      "sc heerenveen":"sc heerenveen","heerenveen":"sc heerenveen","heerenveren":"sc heerenveen",
      "sbv excelsior":"sbv excelsior","excelsior":"sbv excelsior","excelsior rotterdam":"sbv excelsior",
      "telstar 1963":"telstar 1963","telstar":"telstar 1963","sc telstar":"telstar 1963",
      "feyenoord":"feyenoord rotterdam","feyenoord rotterdam":"feyenoord rotterdam","feyenoord":"Feyenoord",
      "psv":"psv eindhoven","psv eindhoven":"psv eindhoven",
      "utrecht":"Utrecht","fc utrecht":"Utrecht","Utrecht":"FC Utrecht","utrecht":"Utrecht",
      "nec":"nec nijmegen","nijmegen":"nec nijmegen","nec nijmegen":"nec nijmegen",
      "go ahead eagles":"go ahead eagles","g a eagles":"go ahead eagles","g a eagels":"go ahead eagles","go-ahead eagles":"go ahead eagles",
      "bayer leverkusen":"bayer leverkusen","bayer 04 leverkusen":"bayer leverkusen","leverkusen":"bayer leverkusen","leverkusen":"leverkusen",
      "borussia dortmund":"borussia dortmund","dortmund":"borussia dortmund","bvb":"borussia dortmund",
      "1 fc union berlin":"1 fc union berlin","1. fc union berlin":"1 fc union berlin","union berlin":"1 fc union berlin",
      "sc freiburg":"sc freiburg","freiburg":"sc freiburg","sport-club freiburg":"sc freiburg","freiburg":"freiburg",
      "stuttgart": "vfb stuttgart","stuttgart": "stuttgart",
      "eintracht frankfurt":"eintracht frankfurt","frankfurt":"eintracht frankfurt","frankfurt":"frankfurt",
      "fc bayern munchen":"fc bayern munchen","bayern":"fc bayern munchen","bayern munich":"fc bayern munchen","bayern münchen":"fc bayern munchen","fc bayern":"fc bayern munchen","bayern":"bayern",
      "sg dynamo dresden":"sg dynamo dresden","dynamo dresden":"sg dynamo dresden","dresden":"sg dynamo dresden","dresden":"dresden",
      "fc augsburg":"fc augsburg","augsburg":"fc augsburg",
      "1. fsv mainz 05":"1. fsv mainz 05","1 fsv mainz 05":"1. fsv mainz 05","mainz":"1. fsv mainz 05",
      "tsg 1899 hoffenheim":"tsg 1899 hoffenheim","tsg hoffenheim":"tsg 1899 hoffenheim","hoffenheim":"tsg 1899 hoffenheim",
      "hamburg":"hamburger sv","hamburg sv":"hamburger sv","hamburger sv":"hamburger sv","hamburger sport verein":"hamburger sv","hamburger sport-verein":"hamburger sv",
      "athletic club":"athletic club","ath bilbao":"athletic club","athletic bilbao":"athletic club","athletic club bilbao":"athletic club","bilbao":"athletic club","ath bilbao":"athletic bilbao",
      "everton fc":"everton fc","everton":"everton fc","everton":"everton fc","everton":"everton",
      "nottingham forest fc":"nottingham forest fc","nottingham forest":"nottingham forest fc","nottingham":"nottingham forest fc","forest":"nottingham forest fc",
      "tottenham":"Tottenham",
      "manchester united":"manchester united","manchester utd":"manchester united","man utd":"manchester united","man united":"manchester united",
      "arsenal fc":"arsenal fc","arsenal":"arsenal fc","arsenal":"arsenal",
      "chelsea fc":"chelsea fc","chelsea":"chelsea fc","chelsea":"chelsea",
      "leeds":"leeds","leeds":"Leeds",
      "burnley":"burnley","burnley":"burnley",
      "aston villa fc":"aston villa fc","aston villa":"aston villa fc","villa":"aston villa fc",
      "sunderland afc":"sunderland afc","sunderland":"sunderland afc","sunderland":"sunderland",
      "wrexham afc":"wrexham afc","wrexham":"wrexham afc","wrexham":"wrexham afc",
      "liverpool fc":"liverpool fc","liverpool":"liverpool fc",
      "newcastle united":"newcastle united","newcastle":"newcastle united","newcastle utd":"newcastle united","newcastle":"newcastle",
      "manchester city":"manchester city","man city":"manchester city",
      "west ham united":"west ham united","west ham":"west ham united","westham":"west ham united",
      "wolverhampton wanderers":"wolverhampton wanderers","wolves":"wolverhampton wanderers","wolverhampton":"wolverhampton wanderers",
      "brighton & hove albion":"brighton & hove albion","brighton":"brighton & hove albion","brighton and hove":"brighton & hove albion",
      "brentford fc":"brentford fc","brentford":"brentford fc",
      "afc bournemouth":"afc bournemouth","bournemouth":"afc bournemouth",
      "fulham fc":"fulham fc","fulham":"fulham fc",
      "crystal palace":"crystal palace",
      "celtic fc":"celtic fc","celtic":"celtic fc","celtic":"celtic",
      "rangers fc":"rangers fc","rangers":"rangers fc",
      "ac sparta praha":"ac sparta praha","sparta praha":"ac sparta praha","ac sparta prague":"ac sparta praha",
      "sk slavia praha":"sk slavia praha","slavia praha":"sk slavia praha",
      "fenerbahce":"fenerbahce","fenerbahçe":"fenerbahce",
      "germany":"germany","slovakia":"slovakia","ceska republika":"czech republic","czech republic":"czech republic",
    };

function normalizeTeamName(name) {
  if (!name || typeof name !== 'string') return '';
  return aliasMap[name.trim().toLowerCase()] || name.trim();
}

exports.handler = async function () {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  let debugLogs = [];

  try {
    // 1. Získání zápasů z API
    const apiRes = await fetch(API_FUNCTION_URL);
    const apiJson = await apiRes.json();
    const apiMatches = apiJson.matches || [];

    const validNames = apiMatches.map((match) => {
      const home = normalizeTeamName(match.home);
      const away = normalizeTeamName(match.away);
      return `${home} vs ${away}`;
    });

    // 2. Získání produktů
    const productsRes = await fetch(`https://${SHOPIFY_STORE}/admin/api/2023-04/products.json?status=active&limit=250`, {
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ADMIN_API_TOKEN,
        "Content-Type": "application/json",
      },
    });
    const productsJson = await productsRes.json();
    const products = productsJson.products || [];

    debugLogs.push(`🧾 Nalezeno ${products.length} aktivních produktů\n`);

    for (const product of products) {
      const title = product.title;

      // Přeskočit produkty bez "vs" (např. merch)
      if (!title.toLowerCase().includes(" vs ")) {
        debugLogs.push(`⚠️ ${title}: Nenázev ve formátu "Home vs Away", přeskočeno.`);
        continue;
      }

      // Přeskočit s tagem never-hide
      if (product.tags?.includes("never-hide")) {
        debugLogs.push(`⏭️ ${title}: Přeskočeno (má tag 'never-hide')`);
        continue;
      }

      // Normalizace názvu
      const [homeRaw, awayRaw] = title.split(" vs ");
      const normalizedTitle = `${normalizeTeamName(homeRaw)} vs ${normalizeTeamName(awayRaw)}`;

      // Hledání v API
      const apiMatch = validNames.includes(normalizedTitle);

      if (apiMatch) {
        debugLogs.push(`🟢 ${title}: Zápas nalezen v API – nebude skryt (API).`);
        continue;
      }

      // 3. Získání metapole s datem
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
        debugLogs.push(`⚠️ ${title}: Nemá datum zápasu v metapoli ani API.`);
        continue;
      }

      const matchDate = new Date(matchDateField.value);
      const matchStr = matchDate.toISOString().split("T")[0];

      if (matchStr === todayStr) {
        debugLogs.push(`🔴 ${title}: Zápas je DNES (${matchStr}) – měl by být skryt.`);
      } else if (matchStr === tomorrowStr) {
        debugLogs.push(`🟠 ${title}: Zápas je ZÍTRA (${matchStr}) – bude skryt zítra.`);
      } else if (matchDate < now) {
        debugLogs.push(`⚫ ${title}: Zápas již proběhl (${matchStr}) – měl by být již skryt.`);
      } else {
        debugLogs.push(`🟢 ${title}: Zápas je v budoucnu (${matchStr}) – zůstává aktivní.`);
      }
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/plain" },
      body: `📊 DIAGNOSTICKÝ VÝSTUP\n======================\n\n${debugLogs.join("\n")}`,
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: `❌ Chyba ve skriptu diagnose_products: ${error.message}`,
    };
  }
};