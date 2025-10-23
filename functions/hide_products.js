const fetch = require("node-fetch");
const { aliasMap, normalizeTeamName } = require("./aliasMap");  // <-- DŮLEŽITÉ

const SHOPIFY_ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
const SHOPIFY_STORE = process.env.SHOPIFY_STORE;

const getMatchesUrl = "https://mellow-tiramisu-9b78f4.netlify.app/.netlify/functions/getMatches";

exports.handler = async function () {
  try {
    const debug = [];

    // 1. Načtení zápasů z API
    const matchesRes = await fetch(getMatchesUrl);
    const { matches } = await matchesRes.json();

    const matchMap = new Map();
    for (const match of matches) {
      const key = `${normalizeTeamName(match.home_team)} vs ${normalizeTeamName(match.away_team)}`;
      matchMap.set(key, new Date(match.utcDate));
    }

    // 2. Načtení všech produktů ze Shopify
    const products = await fetchAllProducts();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const product of products) {
      const title = product.title?.toLowerCase() || "";
      if (!title.includes(" vs ")) continue;
      if (product.tags && product.tags.includes("never-hide")) continue;

      const [home, away] = title.split(" vs ").map(normalizeTeamName);
      const matchKey = `${home} vs ${away}`;
      const apiMatchDate = matchMap.get(matchKey);

      let matchDate = null;
      let source = "";

      // 3. Primární zdroj: API
      if (apiMatchDate) {
        matchDate = apiMatchDate;
        source = "📡 API";
      } else {
        // 4. Sekundární zdroj: ruční metafield
        const manual = await getManualMatchDate(product.id);
        if (manual) {
          matchDate = new Date(manual);
          source = "📝 match_date";
        }
      }

      if (!matchDate) {
        debug.push(`❓ ${product.title} – žádné datum`);
        continue;
      }

      matchDate.setHours(0, 0, 0, 0);

      // 5. Porovnání s dnešním datem
      if (matchDate <= today) {
        await hideProduct(product.id);
        debug.push(`🔴 ${product.title} → archivován (${source}, ${matchDate.toISOString().split("T")[0]})`);
      } else {
        debug.push(`🟢 ${product.title} → aktivní (${source}, ${matchDate.toISOString().split("T")[0]})`);
      }
    }

    return {
      statusCode: 200,
      body: debug.join("\n")
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: `Chyba: ${error.message}`
    };
  }
};

// Pomocné funkce
async function fetchAllProducts() {
  let all = [];
  let pageInfo = null;

  while (true) {
    const url = new URL(`https://${SHOPIFY_STORE}/admin/api/2023-04/products.json`);
    url.searchParams.set("limit", "250");
    if (pageInfo) url.searchParams.set("page_info", pageInfo);

    const res = await fetch(url.toString(), {
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ADMIN_API_TOKEN,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    if (!data.products?.length) break;
    all = all.concat(data.products);

    const linkHeader = res.headers.get("link");
    if (!linkHeader || !linkHeader.includes('rel="next"')) break;

    const match = linkHeader.match(/page_info=([^&>]+)/);
    pageInfo = match ? match[1] : null;
  }

  return all;
}

async function getManualMatchDate(productId) {
  const res = await fetch(`https://${SHOPIFY_STORE}/admin/api/2023-04/products/${productId}/metafields.json`, {
    headers: {
      "X-Shopify-Access-Token": SHOPIFY_ADMIN_API_TOKEN,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  const field = data.metafields?.find(f => f.namespace === "custom" && f.key === "match_date");
  return field?.value || null;
}

async function hideProduct(productId) {
  await fetch(`https://${SHOPIFY_STORE}/admin/api/2023-04/products/${productId}.json`, {
    method: "PUT",
    headers: {
      "X-Shopify-Access-Token": SHOPIFY_ADMIN_API_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ product: { id: productId, status: "archived" } }),
  });
}