const fetch = require("node-fetch");
const nodemailer = require("nodemailer");

const SHOPIFY_ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const API_FUNCTION_URL = "https://dreamy-sprite-72ab2d.netlify.app/.netlify/functions/getMatches";
const TARGET_EMAIL = "90plustickets@gmail.com";

// SMTP konfigurace (např. Gmail)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

exports.handler = async function () {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    // --- 1. Zápasy z API ---
    const matchRes = await fetch(API_FUNCTION_URL);
    const matchJson = await matchRes.json();
    const matches = matchJson?.matches || [];

    const matchesFromAPI = matches.filter((match) => {
      const matchDate = new Date(match.utcDate);
      return matchDate >= tomorrow && matchDate <= tomorrowEnd;
    });

    const matchListFromAPI = matchesFromAPI.map(
      (m) => `API: ${m.homeTeam.name} vs ${m.awayTeam.name} (${new Date(m.utcDate).toLocaleString()})`
    );

    // --- 2. Produkty s ručním datem ---
    const productRes = await fetch(`https://${SHOPIFY_STORE}/admin/api/2023-04/products.json?limit=250`, {
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ADMIN_API_TOKEN,
        "Content-Type": "application/json",
      },
    });

    const productJson = await productRes.json();
    const products = productJson.products || [];

    const manualMatches = [];

    for (const product of products) {
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
        const matchDateObj = new Date(matchDateField.value);
        if (matchDateObj >= tomorrow && matchDateObj <= tomorrowEnd) {
          manualMatches.push(`Manuál: ${product.title} (${matchDateObj.toLocaleString()})`);
        }
      }
    }

    // --- 3. Sloučit API a ruční zápasy ---
    const allMatches = [...matchListFromAPI, ...manualMatches];

    if (allMatches.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Žádné zápasy ke skrytí zítra." }),
      };
    }

    // --- 4. Odeslat e-mail ---
    await transporter.sendMail({
      from: `"90PlusTickets" <${process.env.MAIL_USER}>`,
      to: TARGET_EMAIL,
      subject: "Zítřejší zápasy ke skrytí",
      text: `Zítřejší zápasy, které budou skryty:\n\n${allMatches.join("\n")}`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, sent: allMatches.length }),
    };
  } catch (error) {
    console.error("Chyba při odesílání e-mailu:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};