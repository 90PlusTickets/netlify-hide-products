const fetch = require("node-fetch");

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;
const SHOPIFY_API_PASSWORD = process.env.SHOPIFY_API_PASSWORD;
const SHOPIFY_STORE_NAME = process.env.SHOPIFY_STORE_NAME;

const TEAM_ALIAS = "acmilan"; // můžeš změnit dynamicky nebo udělat seznam
const MATCHES_API = `https://dreamy-sprite-72ab2d.netlify.app/.netlify/functions/getMatches?team=${TEAM_ALIAS}`;

exports.handler = async function(event, context) {
  try {
    const res = await fetch(MATCHES_API);
    const data = await res.json();

    if (!Array.isArray(data.matches)) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "matches.map is not a function",
          rawData: data,
        }),
      };
    }

    const now = new Date();

    for (const match of data.matches) {
      const matchDate = new Date(match.utcDate);
      const productHandle = match.productHandle;

      if (!productHandle || isNaN(matchDate)) continue;

      if (matchDate < now) {
        await hideProductByHandle(productHandle);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Staré produkty byly skryty." }),
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

async function hideProductByHandle(handle) {
  const url = `https://${SHOPIFY_API_KEY}:${SHOPIFY_API_PASSWORD}@${SHOPIFY_STORE_NAME}.myshopify.com/admin/api/2023-07/products.json?handle=${handle}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!data.products || data.products.length === 0) {
    console.log(`Produkt s handle '${handle}' nenalezen.`);
    return;
  }

  const productId = data.products[0].id;

  const updateUrl = `https://${SHOPIFY_API_KEY}:${SHOPIFY_API_PASSWORD}@${SHOPIFY_STORE_NAME}.myshopify.com/admin/api/2023-07/products/${productId}.json`;
  const updateData = {
    product: {
      id: productId,
      published: false
    }
  };

  const updateResponse = await fetch(updateUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(updateData)
  });

  if (updateResponse.ok) {
    console.log(`Skrytý produkt: ${handle}`);
  } else {
    console.log(`Chyba při skrývání ${handle}:`, updateResponse.status);
  }
}