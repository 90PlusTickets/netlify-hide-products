// File: functions/hide_products.js

export async function handler(event, context) {
  const apiKey = process.env.SHOPIFY_ADMIN_API_KEY;
  const store = process.env.SHOPIFY_STORE_NAME;
  const matchesApiUrl = "https://dreamy-sprite-72ab2d.netlify.app/.netlify/functions/getMatches";

  const headers = {
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": apiKey,
  };

  try {
    // 1. Get products
    const productsRes = await fetch(`https://${store}.myshopify.com/admin/api/2023-10/products.json`, {
      headers,
    });
    const { products } = await productsRes.json();

    // 2. Get current matches from API
    const matchesRes = await fetch(matchesApiUrl);
    const matches = await matchesRes.json();
    const futureMatchNames = matches.map((m) => m.name.toLowerCase());

    // 3. Loop through Shopify products and hide past ones
    const now = new Date();
    for (const product of products) {
      const matchName = product.title.toLowerCase();

      let isUpcoming = false;

      // Check API match list
      if (futureMatchNames.includes(matchName)) {
        isUpcoming = true;
      }

      // Check metafield (custom.match_date)
      const metafieldsRes = await fetch(`https://${store}.myshopify.com/admin/api/2023-10/products/${product.id}/metafields.json`, {
        headers,
      });
      const { metafields } = await metafieldsRes.json();
      const matchDateField = metafields.find((f) => f.key === "match_date" && f.namespace === "custom");
      if (matchDateField) {
        const matchDate = new Date(matchDateField.value);
        if (matchDate > now) {
          isUpcoming = true;
        }
      }

      // If match already happened, hide product
      if (!isUpcoming && product.status !== "draft") {
        await fetch(`https://${store}.myshopify.com/admin/api/2023-10/products/${product.id}.json`, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            product: {
              id: product.id,
              status: "draft",
            },
          }),
        });
        console.log(`Product hidden: ${product.title}`);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Product check complete." }),
    };
  } catch (err) {
    console.error("Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error", details: err.message }),
    };
  }
}
