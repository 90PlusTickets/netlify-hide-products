const fetch = require("node-fetch");

const SHOPIFY_ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
const SHOPIFY_STORE = `${process.env.SHOPIFY_STORE_NAME}.myshopify.com`;
const API_FUNCTION_URL = "https://dreamy-sprite-72ab2d.netlify.app/.netlify/functions/getMatches";

exports.handler = async function () {
  try {
    // Krok 1: Načti zápasy z API (AC Milan, Inter atd.)
    const matchRes = await fetch(API_FUNCTION_URL);
    const matchJson = await matchRes.json();
    const matches = matchJson?.matches || [];

    // Krok 2: Vytvoř seznam názvů produktů ve formátu "Home vs Away"
    const validNames = matches.map(
      (match) => `${match.homeTeam.name} vs ${match.awayTeam.name}`
    );

    // Krok 3: Načti všechny produkty ze Shopify
    const shopifyRes = await fetch(`https://${SHOPIFY_STORE}/admin/api/2023-04/products.json?limit=250`, {
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ADMIN_API_TOKEN,
        "Content-Type": "application/json",
      },
    });

    const shopifyJson = await shopifyRes.json();
    const products = shopifyJson.products;

    if (!Array.isArray(products)) {
      console.error("Chyba: 'products' není pole", products);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "'products' není pole" }),
      };
    }

    // Krok 4: Projdi každý produkt a rozhodni, jestli ho skrýt
    const now = new Date();

    for (const product of products) {
      const title = product.title;

      // a) Má produkt platný název zápasu z API?
      if (validNames.includes(title)) {
        continue; // Produkt je aktuální, ponech
      }

      // b) Jinak zkus načíst datum z metafieldu 'custom.match_date'
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

      let matchDate = matchDateField?.value;
      if (matchDate) {
        const matchDateObj = new Date(matchDate);
        if (matchDateObj < now) {
          // Produkt skrýt
          await fetch(`https://${SHOPIFY_STORE}/admin/api/2023-04/products/${product.id}.json`, {
            method: "PUT",
            headers: {
              "X-Shopify-Access-Token": SHOPIFY_ADMIN_API_TOKEN,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ product: { id: product.id, status: "draft" } }),
          });

          console.log(`Produkt '${title}' byl skryt (zápas proběhl).`);
        }
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error("Chyba ve funkci hide_products:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};