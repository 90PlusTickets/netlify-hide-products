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
    // 🔁 1. Spočítej zítřek jako YYYY-MM-DD
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0]; // "2025-10-17"

    const debugInfo = [`Zítřek (datum): ${tomorrowStr}`];

    // 📡 2. Zápasy z API
    const matchRes = await fetch(API_FUNCTION_URL);
    const matchJson = await matchRes.json();
    const matches = matchJson?.matches || [];

    const apiMatches = matches.filter((match) => {
      const dateStr = new Date(match.utcDate).toISOString().split("T")[0];
      return dateStr === tomorrowStr;
    });

    debugInfo.push(`Zápasy z API na zítřek: ${apiMatches.length}`);

    // 🛒 3. Načti všechny produkty z Shopify
    const shopifyRes = await fetch(`https://${SHOPIFY_STORE}/admin/api/2023-04/products.json?limit=250`, {
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ADMIN_API_TOKEN,
        "Content-Type": "application/json",
      },
    });

    const shopifyJson = await shopifyRes.json();
    const products = Array.isArray(shopifyJson.products) ? shopifyJson.products : [];

    const manualMatches = [];

    for (const product of products) {
      // 📦 4. Načti metafield s datem
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

      if (matchDateField?.value) {
        const matchDateStr = matchDateField.value.split("T")[0]; // "2025-10-17"
        if (matchDateStr === tomorrowStr) {
          manualMatches.push(`${product.title} (ručně zadané datum: ${matchDateField.value})`);
        }
      }
    }

    debugInfo.push(`Ručně zadané zápasy na zítřek: ${manualMatches.length}`);

    const totalMatches = [
      ...apiMatches.map(
        (m) => `${m.homeTeam.name} vs ${m.awayTeam.name} (API datum: ${new Date(m.utcDate).toLocaleString()})`
      ),
      ...manualMatches,
    ];

    if (totalMatches.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Žádné zápasy ke skrytí zítra.", debug: debugInfo }),
      };
    }

    // 📧 5. Pošli e-mail
    await transporter.sendMail({
      from: `"90PlusTickets" <${process.env.MAIL_USER}>`,
      to: TARGET_EMAIL,
      subject: "Zítřejší zápasy ke skrytí",
      text: `Zítřejší zápasy, které budou skryty:\n\n${totalMatches.join("\n")}`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, sent: totalMatches.length, debug: debugInfo }),
    };
  } catch (error) {
    console.error("Chyba při odesílání e-mailu:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};