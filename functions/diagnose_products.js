
const fetch = require("node-fetch");

const SHOPIFY_ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
const SHOPIFY_STORE = `${process.env.SHOPIFY_STORE}.myshopify.com`;
const API_FUNCTION_URL = "https://dreamy-sprite-72ab2d.netlify.app/.netlify/functions/getMatches";

// 🧠 Bezpečná funkce pro převod jména týmu podle aliasů
function normalizeTeamName(name) {
  if (!name || typeof name !== "string") return "";
  return aliasMap[name.trim().toLowerCase()] || name.trim();
}

// 🏁 Hlavní funkce
exports.handler = async function () {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  let debugLogs = [];

  try {
    // 1️⃣ Načti produkty
    const productsRes = await fetch(
      `https://${SHOPIFY_STORE}/admin/api/2023-04/products.json?status=active&limit=250`,
      {
        headers: {
          "X-Shopify-Access-Token": SHOPIFY_ADMIN_API_TOKEN,
          "Content-Type": "application/json",
        },
      }
    );
    const productsJson = await productsRes.json();
    const products = productsJson.products || [];

    debugLogs.push(`🧾 Nalezeno ${products.length} aktivních produktů\n`);

    // 2️⃣ Projdi produkty
    for (const product of products) {
      const title = product.title;

      if (product.tags?.includes("never-hide")) {
        debugLogs.push(`⏭️ ${title}: Přeskočeno (má tag 'never-hide')`);
        continue;
      }

      // Rozdělení názvu na domácí a hostující tým
      const [homeRaw, awayRaw] = title.toLowerCase().split(" vs ");
      if (!homeRaw || !awayRaw) {
        debugLogs.push(`⚠️ ${title}: Není ve formátu "Team A vs Team B", přeskočeno.`);
        continue;
      }

      const normalizedTitle = `${normalizeTeamName(homeRaw)} vs ${normalizeTeamName(awayRaw)}`;

      // 3️⃣ Načti metapole
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
        debugLogs.push(`⚠️ ${title}: Nemá datum zápasu v metapoli.`);
        continue;
      }

      // 4️⃣ Porovnání dat
      const matchDate = new Date(matchDateField.value);
      const matchStr = matchDate.toISOString().split("T")[0];

      if (matchStr === todayStr) {
        debugLogs.push(`🔴 ${title}: Zápas je DNES (${matchStr}) – měl by být skryt.`);
      } else if (matchStr === tomorrowStr) {
        debugLogs.push(`🟠 ${title}: Zápas je ZÍTRA (${matchStr}) – bude skryt zítra.`);
      } else if (matchDate < now) {
        debugLogs.push(`⚫ ${title}: Zápas již proběhl (${matchStr}) – měl by být již skryt.`);
      } else {
        debugLogs.push(`🟢 ${title}: Zápas je v budoucnu (${matchStr}) – produkt zůstává aktivní.`);
      }
    }

    // 🧾 Výstup
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