const fetch = require("node-fetch");

const SHOPIFY_ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
const SHOPIFY_STORE = `${process.env.SHOPIFY_STORE_NAME}.myshopify.com`;
const API_FUNCTION_URL = "https://dreamy-sprite-72ab2d.netlify.app/.netlify/functions/getMatches";

const ALIASES = {
  "Sunderland": "Sunderland AFC",
  "Wolves": "Wolverhampton Wanderers",
  "Nottingham": "Nottingham Forest",
  "Man United": "Manchester United",
  "Man City": "Manchester City",
  // Přidej další aliasy sem
};

function applyAliases(name) {
  return ALIASES[name.trim()] || name.trim();
}

exports.handler = async function () {
  try {
    const matchRes = await fetch(API_FUNCTION_URL);
    const matchJson = await matchRes.json();
    const matches = matchJson?.matches || [];

    const validNames = matches.map((match) => {
      const home = applyAliases(match.homeTeam.name);
      const away = applyAliases(match.awayTeam.name);
      return `${home} vs ${away}`;
    });

    const shopifyRes = await fetch(`https://${SHOPIFY_STORE}/admin/api/2023-04/products.json?limit=250`, {
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ADMIN_API_TOKEN,
        "Content-Type": "application/json",
      },
    });

    const shopifyJson = await shopifyRes.json();
    const products = shopifyJson.products;

    const now = new Date();

    for (const product of products) {
      const title = product.title;

      // a) API název zápasu
      if (validNames.includes(title)) {
        continue;
      }

      // b) Manuální datum zápasu
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

      if (matchDateField) {
        const matchDate = new Date(matchDateField.value);
        if (matchDate < now) {
          await fetch(`https://${SHOPIFY_STORE}/admin/api/2023-04/products/${product.id}.json`, {
            method: "PUT",
            headers: {
              "X-Shopify-Access-Token": SHOPIFY_ADMIN_API_TOKEN,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ product: { id: product.id, status: "draft" } }),
          });

          console.log(`Skrytí produktu: ${title}`);
        }
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error("Chyba:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};