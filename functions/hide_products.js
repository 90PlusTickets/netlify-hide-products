const { aliasMap, TEAM_API_KEYS } = require("./aliasMap");

const SHOPIFY_ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
const SHOPIFY_STORE = String(process.env.SHOPIFY_STORE || "")
  .replace(/^https?:\/\//i, "")
  .replace(/\/$/, "");
const SHOPIFY_API_VERSION =
  process.env.SHOPIFY_API_VERSION || "2026-07";

const MATCHES_API_URL =
  process.env.MATCHES_API_URL ||
  "https://dreamy-sprite-72ab2d.netlify.app/.netlify/functions/getMatches";

const TIME_ZONE = "Europe/Prague";

/*
 * Výjimky pro názvy, které používá aktuální fotbalové API.
 * Ostatní týmy se vezmou z functions/aliasMap.js.
 */
const TEAM_API_OVERRIDES = {
  bergamo: "bergamo",
  "internazionale milano": "inter milan",
  "atalanta bergamasca calcio": "atalanta bergamasca calcio",
  "borussia dortmund": "dortmund",
  "fc bayern munchen": "bayern",
  "bayer leverkusen": "leverkusen",
  "eintracht frankfurt": "frankfurt",
  "vfb stuttgart": "stuttgart",
  "sc freiburg": "freiburg",
  "1 fc union berlin": "union",
  "hamburger sv": "hamburg",
  "sg dynamo dresden": "dresden",
  "manchester united": "man-united",
  "manchester city": "manchester-city",
  "newcastle united": "newcastle",
  "sunderland afc": "sunderland",
  "west ham united": "west-ham",
  "crystal palace": "crystal-palace",
  "leeds united": "leeds",
  "wrexham afc": "wrexham afc",
  "feyenoord rotterdam": "Feyenoord",
  "fc utrecht": "Utrecht",
  "psv": "psv eindhoven",
  "real madrid": "real madrid",
  "atletico madrid": "atl-madrid",
  "athletic club": "athletic bilbao",
  "ac sparta praha": "ac sparta praha"
};

/*
 * Doplňující aliasy pro přesné porovnání názvu produktu se zápasem z API.
 */
const MATCH_ALIASES = {
  bergamo: "atalanta bergamasca calcio",
  "fc internazionale milano": "internazionale milano",
  internazionale: "internazionale milano",
  "inter milan": "internazionale milano",
  inter: "internazionale milano",
  "real madrid cf": "real madrid",
  "club atletico de madrid": "atletico madrid",
  "atl madrid": "atletico madrid",
  "rb leipzig": "leipzig",
  "1 fc union berlin": "union berlin",
  "hamburger sv": "hamburg",
  "fc bayern munchen": "bayern munich",
  "bayern munchen": "bayern munich",
  "bayer 04 leverkusen": "bayer leverkusen",
  "afc ajax": "ajax",
  "fc barcelona": "barcelona",
  "ac sparta praha": "sparta praha"
};

exports.handler = async function (event = {}) {
  const preview = isPreviewRequest(event);
  const report = [];

  try {
    validateConfiguration();

    const products = await fetchActiveMatchProducts();
    const todayKey = dateKeyInPrague(new Date());
    const matchesCache = new Map();

    let archived = 0;
    let wouldArchive = 0;
    let active = 0;
    let withoutDate = 0;
    let skipped = 0;

    report.push(
      preview
        ? `NÁHLED – žádný produkt se nezmění. Dnes: ${todayKey}`
        : `OSTRÝ BĚH. Dnes: ${todayKey}`
    );

    for (const product of products) {
      if (hasNeverHideTag(product.tags)) {
        skipped += 1;
        report.push(`PŘESKOČENO: ${product.title} – tag never-hide`);
        continue;
      }

      const teams = splitMatchTitle(product.title);
      if (!teams) {
        skipped += 1;
        continue;
      }

      let matchDateKey = null;
      let dateSource = "";

      try {
        const teamKey = getTeamApiKey(teams.homeTeam);
        const matches = await getMatchesForHomeTeam(teamKey, matchesCache);
        const apiMatch = findExactMatch(
          matches,
          teams.homeTeam,
          teams.awayTeam
        );

        if (apiMatch) {
          matchDateKey = getApiMatchDateKey(apiMatch);
          dateSource = "API";
        }
      } catch (error) {
        report.push(
          `VAROVÁNÍ: ${product.title} – API: ${error.message}`
        );
      }

      if (!matchDateKey && product.matchDate?.value) {
        matchDateKey = parseManualDateKey(product.matchDate.value);
        dateSource = "custom.match_date";
      }

      if (!matchDateKey) {
        withoutDate += 1;
        report.push(
          `BEZ DATA: ${product.title} – produkt zůstává aktivní`
        );
        continue;
      }

      /*
       * Záměrně pouze <, nikoliv <=.
       * Produkt zůstane aktivní celý den zápasu a archivuje se až další den.
       */
      if (matchDateKey < todayKey) {
        if (preview) {
          wouldArchive += 1;
          report.push(
            `ARCHIVOVAL BY SE: ${product.title} (${matchDateKey}, ${dateSource})`
          );
        } else {
          await archiveProduct(product.id);
          archived += 1;
          report.push(
            `ARCHIVOVÁN: ${product.title} (${matchDateKey}, ${dateSource})`
          );
        }
      } else {
        active += 1;
        report.push(
          `AKTIVNÍ: ${product.title} (${matchDateKey}, ${dateSource})`
        );
      }
    }

    report.push("");
    report.push(
      preview
        ? `Souhrn: ke kontrole ${products.length}, archivovalo by se ${wouldArchive}, aktivních ${active}, bez data ${withoutDate}, přeskočeno ${skipped}.`
        : `Souhrn: ke kontrole ${products.length}, archivováno ${archived}, aktivních ${active}, bez data ${withoutDate}, přeskočeno ${skipped}.`
    );

    return makeResponse(200, report.join("\n"));
  } catch (error) {
    console.error("hide_products:", error);
    report.push(`CHYBA: ${error.message}`);
    return makeResponse(500, report.join("\n"));
  }
};

function validateConfiguration() {
  if (!SHOPIFY_ADMIN_API_TOKEN) {
    throw new Error("Chybí proměnná SHOPIFY_ADMIN_API_TOKEN.");
  }

  if (!SHOPIFY_STORE) {
    throw new Error("Chybí proměnná SHOPIFY_STORE.");
  }
}

function makeResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "text/plain; charset=utf-8"
    },
    body
  };
}

function isPreviewRequest(event) {
  if (process.env.HIDE_PRODUCTS_PREVIEW === "true") {
    return true;
  }

  if (event.queryStringParameters?.preview === "true") {
    return true;
  }

  if (event.body) {
    try {
      const body = JSON.parse(event.body);
      return body.preview === true || body.preview === "true";
    } catch (_) {
      return false;
    }
  }

  return false;
}

function normalizeTeamName(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveAlias(value) {
  const normalized = normalizeTeamName(value);
  return normalizeTeamName(aliasMap[normalized] || normalized);
}

function canonicalTeamName(value) {
  const normalized = normalizeTeamName(value);
  const direct = MATCH_ALIASES[normalized] || normalized;
  const aliased = resolveAlias(direct);
  return MATCH_ALIASES[aliased] || aliased;
}

function teamsMatch(teamA, teamB) {
  return canonicalTeamName(teamA) === canonicalTeamName(teamB);
}

function splitMatchTitle(title) {
  const parts = String(title || "").split(/\s+vs\s+/i);

  if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) {
    return null;
  }

  return {
    homeTeam: parts[0].trim(),
    awayTeam: parts[1].trim()
  };
}

function getTeamApiKey(homeTeam) {
  const canonical = resolveAlias(homeTeam);

  return (
    TEAM_API_OVERRIDES[canonical] ||
    TEAM_API_KEYS[canonical] ||
    homeTeam.trim()
  );
}

function hasNeverHideTag(tags) {
  return (
    Array.isArray(tags) &&
    tags.some(
      (tag) => String(tag).trim().toLowerCase() === "never-hide"
    )
  );
}

async function getMatchesForHomeTeam(teamKey, cache) {
  const cacheKey = normalizeTeamName(teamKey);

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const requestUrl = new URL(MATCHES_API_URL);
  requestUrl.searchParams.set("teamKey", teamKey);
  requestUrl.searchParams.set("venue", "HOME");

  const res = await fetch(requestUrl.toString(), {
    headers: { Accept: "application/json" }
  });

  if (!res.ok) {
    throw new Error(`zdroj zápasů vrátil HTTP ${res.status}`);
  }

  const data = await res.json();
  const matches = Array.isArray(data.matches) ? data.matches : [];
  cache.set(cacheKey, matches);
  return matches;
}

function findExactMatch(matches, homeTeam, awayTeam) {
  return matches.find((match) => {
    const apiHome = match.homeTeam || match.home_team;
    const apiAway = match.awayTeam || match.away_team;

    return teamsMatch(apiHome, homeTeam) && teamsMatch(apiAway, awayTeam);
  });
}

function getApiMatchDateKey(match) {
  const localDate = String(match.dateLocal || "").trim();
  const localMatch = localDate.match(
    /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/
  );

  if (localMatch) {
    return `${localMatch[3]}-${localMatch[2].padStart(2, "0")}-${localMatch[1].padStart(2, "0")}`;
  }

  return dateKeyInPrague(match.utcDate || match.date);
}

function parseManualDateKey(value) {
  const text = String(value || "").trim();
  const isoDate = text.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (isoDate) {
    return `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`;
  }

  const czechDate = text.match(
    /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/
  );

  if (czechDate) {
    return `${czechDate[3]}-${czechDate[2].padStart(2, "0")}-${czechDate[1].padStart(2, "0")}`;
  }

  return dateKeyInPrague(text);
}

function dateKeyInPrague(value) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

async function shopifyGraphQL(query, variables = {}) {
  const res = await fetch(
    `https://${SHOPIFY_STORE}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ADMIN_API_TOKEN,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query, variables })
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      `Shopify vrátil HTTP ${res.status}: ${JSON.stringify(data)}`
    );
  }

  if (data.errors?.length) {
    throw new Error(
      `Shopify GraphQL: ${data.errors
        .map((item) => item.message)
        .join("; ")}`
    );
  }

  return data.data;
}

async function fetchActiveMatchProducts() {
  const query = `
    query ActiveProducts($cursor: String) {
      products(first: 100, after: $cursor, query: "status:active") {
        nodes {
          id
          title
          tags
          matchDate: metafield(namespace: "custom", key: "match_date") {
            value
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  const products = [];
  let cursor = null;

  do {
    const data = await shopifyGraphQL(query, { cursor });
    const connection = data.products;
    products.push(...connection.nodes);
    cursor = connection.pageInfo.hasNextPage
      ? connection.pageInfo.endCursor
      : null;
  } while (cursor);

  return products.filter((product) => splitMatchTitle(product.title));
}

async function archiveProduct(productId) {
  const mutation = `
    mutation ArchiveProduct($productId: ID!, $status: ProductStatus!) {
      productChangeStatus(productId: $productId, status: $status) {
        product {
          id
          status
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const data = await shopifyGraphQL(mutation, {
    productId,
    status: "ARCHIVED"
  });

  const result = data.productChangeStatus;

  if (result.userErrors?.length) {
    throw new Error(
      result.userErrors.map((item) => item.message).join("; ")
    );
  }

  if (result.product?.status !== "ARCHIVED") {
    throw new Error("Shopify nepotvrdil archivaci produktu.");
  }
}
