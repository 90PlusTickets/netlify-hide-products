import fetch from 'node-fetch';

export default async (req, context) => {
  const SHOPIFY_ADMIN_API = 'https://your-shop-name.myshopify.com/admin/api/2023-07';
  const ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
  const API_PRODUCTS_ENDPOINT = `${SHOPIFY_ADMIN_API}/products.json?limit=250`;
  const CUSTOM_MATCH_DATE_NAMESPACE = 'custom';
  const CUSTOM_MATCH_DATE_KEY = 'match_date';
  const EXTERNAL_API = 'https://dreamy-sprite-72ab2d.netlify.app/.netlify/functions/getMatches';

  const headers = {
    'X-Shopify-Access-Token': ADMIN_API_TOKEN,
    'Content-Type': 'application/json',
  };

  // Get all current products from Shopify
  const shopifyRes = await fetch(API_PRODUCTS_ENDPOINT, { headers });
  const { products } = await shopifyRes.json();

  // Get match list from external API
  const apiRes = await fetch(EXTERNAL_API);
  const { matches } = await apiRes.json();

  const now = new Date();

  for (const product of products) {
    const productTitle = product.title;

    // Find if match exists in API
    const match = matches.find(m => m.name === productTitle);

    let matchDate;

    if (match) {
      matchDate = new Date(match.date);
    } else {
      // Try to read metafield if match not found in API
      const metafieldsRes = await fetch(`${SHOPIFY_ADMIN_API}/products/${product.id}/metafields.json`, {
        headers,
      });
      const { metafields } = await metafieldsRes.json();
      const matchDateField = metafields.find(mf => mf.namespace === CUSTOM_MATCH_DATE_NAMESPACE && mf.key === CUSTOM_MATCH_DATE_KEY);

      if (matchDateField) {
        matchDate = new Date(matchDateField.value);
      }
    }

    // If matchDate is found and it's in the past, hide the product
    if (matchDate && matchDate < now) {
      if (product.status !== 'draft') {
        await fetch(`${SHOPIFY_ADMIN_API}/products/${product.id}.json`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ product: { id: product.id, status: 'draft' } }),
        });
        console.log(`Product '${productTitle}' hidden.`);
      }
    }
  }

  return new Response(JSON.stringify({ status: 'done' }), {
    headers: { 'Content-Type': 'application/json' },
  });
};