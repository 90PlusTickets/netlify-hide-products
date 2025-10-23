// ✅ Finální a čistá verze `email_upcoming_hide.js`
const { aliasMap } = require("./aliasMap");
const fetch = require("node-fetch");
const nodemailer = require("nodemailer");

const SHOPIFY_ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const API_FUNCTION_URL = process.env.API_FUNCTION_URL || "https://mellow-tiramisu-9b78f4.netlify.app/.netlify/functions/getMatches";
const TARGET_EMAIL = "90plustickets@gmail.com";

function normalizeTeamName(name) {
  return aliasMap[name?.trim().toLowerCase()] || name?.trim().toLowerCase();
}

function sameDay(dateA, dateB) {
  const d1 = new Date(dateA);
  const d2 = new Date(dateB);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

exports.handler = async function (event) {
  const debug = [];
  const matchesToHideTomorrow = [];
  const now = new Date();

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  try {
    // 1. Získání zápasů z API
    const apiRes = await fetch(API_FUNCTION_URL);
    const apiJson = await apiRes.json();
    const apiMatches = apiJson.matches || [];
    debug.push(`Načteno zápasů z API: ${apiMatches.length}`);

    // 2. Získání produktů z Shopify
    const prodRes = await fetch(`https://${SHOPIFY_STORE}/admin/api/2023-04/products.json?status=active&limit=250`, {
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ADMIN_API_TOKEN,
        "Content-Type": "application/json",
      },
    });
    const products = (await prodRes.json()).products;
    debug.push(`Načteno produktů: ${products.length}`);

    for (const product of products) {
      const title = product.title || "";
      if (!title.toLowerCase().includes(" vs ")) continue;
      if (product.tags?.includes("never-hide")) continue;

      const [home, away] = title.toLowerCase().split(" vs ");
      const normTitle = `${normalizeTeamName(home)} vs ${normalizeTeamName(away)}`;

      let matchDate = null;

      // 3. Zkusit najít v API
      for (const match of apiMatches) {
        if (!match.utcDate) continue;
        const matchTitle = `${normalizeTeamName(match.home_team)} vs ${normalizeTeamName(match.away_team)}`;
        if (matchTitle === normTitle) {
          matchDate = new Date(match.utcDate);
          break;
        }
      }

      // 4. Pokud nenalezeno, zkusit ruční match_date
      if (!matchDate) {
        const mfRes = await fetch(`https://${SHOPIFY_STORE}/admin/api/2023-04/products/${product.id}/metafields.json`, {
          headers: {
            "X-Shopify-Access-Token": SHOPIFY_ADMIN_API_TOKEN,
            "Content-Type": "application/json",
          },
        });

        const metafields = (await mfRes.json()).metafields;
        const field = metafields.find(f => f.namespace === "custom" && f.key === "match_date");
        if (field) {
          matchDate = new Date(field.value);
          debug.push(`Metafield datum: ${field.value} u ${product.title}`);
        }
      }

      // 5. Pokud se hraje zítra, přidej do seznamu
      if (matchDate && sameDay(matchDate, tomorrow)) {
        matchesToHideTomorrow.push(`${product.title} (${matchDate.toLocaleDateString("cs-CZ")})`);
      }
    }

    // 6. Odeslat email, pokud je co
    if (matchesToHideTomorrow.length > 0) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: `"90PlusTickets" <${process.env.MAIL_USER}>`,
        to: TARGET_EMAIL,
        subject: "Zápasy ke skrytí zítra",
        text: `Zítra se skryje ${matchesToHideTomorrow.length} zápas(\u016f):\n\n${matchesToHideTomorrow.join("\n")}`,
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Zápasů ke skrytí zítra: ${matchesToHideTomorrow.length}`,
        list: matchesToHideTomorrow,
        debug: event.queryStringParameters?.debug === "true" ? debug : undefined,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: `Chyba: ${err.message}`,
    };
  }
};