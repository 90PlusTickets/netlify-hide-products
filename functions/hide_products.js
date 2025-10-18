const fetch = require("node-fetch");

// ENV proměnné
const SHOPIFY_ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
const SHOPIFY_STORE = `${process.env.SHOPIFY_STORE_NAME}.myshopify.com`;
const API_FUNCTION_URL = "https://dreamy-sprite-72ab2d.netlify.app/.netlify/functions/getMatches";

// Alias tabulka
const aliasMap = {
  "Sunderland vs Wolves": "Sunderland AFC vs Wolverhampton Wanderers",
  "Nottingham vs Chelsea": "Nottingham Forest vs Chelsea",
  "PSG vs Strasbourg": "Paris Saint-Germain vs RC Strasbourg Alsace",
  "Stuttgart vs Feyenoord": "VfB Stuttgart vs Feyenoord Rotterdam",
};

exports.handler = async function () {
  try {
    const now = new Date();
    console.log(`Spuštěno v: ${now.toISOString()}`);

    // 1. Načti zápasy z API
    const matchRes = await fetch(API_FUNCTION_URL);
    const matchJson = await matchRes.json();
    const matches = matchJson?.matches || [];

    // 2. Vytvoř seznam názvů ve formátu "Home vs Away"
    const validNames = matches.map(
      (match) => `${match.homeTeam.name} vs ${match.awayTeam.name}`
    );
    console.log("Názvy zápasů z API:", validNames);

    // 3. Načti produkty
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
      const aliasTitle = aliasMap[title] || title;

      console.log(`\n🔍 Kontroluji produkt: "${title}" → alias: "${aliasTitle}"`);

      // Přeskoč produkty s tagem 'never-hide'
      if (product.tags?.includes("never-hide")) {
        console.log("⏭️  Přeskočeno (má tag 'never-hide')");
        continue;
      }

      // 4a. Pokud název (nebo alias) odpovídá zápasu z API → NEskrýváme
      if (validNames.includes(aliasTitle)) {
        console.log("✅ Produkt odpovídá zápasu z API, ponechán aktivní.");
        continue;
      }

      // 4b. Zjisti, zda má metapole s datem
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
        console.log("❌ Žádné datum v metapoli.");
        continue;
      }

      const matchDate = new Date(matchDateField.value);
      matchDate.setHours(23, 59, 59, 999); // ošetření případného rozdílu v čase

      if (matchDate < now) {
        // Produkt skrýt
        console.log(`🛑 Zápas již proběhl (${matchDate.toISOString()}), skrývám produkt.`);

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
        console.log(`✅ Produkt "${title}" skryt.`);
      } else {
        console.log(`🕓 Zápas je v budoucnu (${matchDate.toISOString()}), produkt zůstává aktivní.`);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Kontrola dokončena" }),
    };
  } catch (error) {
    console.error("❌ Chyba ve skriptu hide_products:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};