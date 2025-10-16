// Kompletní nový `email_upcoming_hide.js`
const fetch = require("node-fetch");
const nodemailer = require("nodemailer");

const SHOPIFY_ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const API_FUNCTION_URL = "https://dreamy-sprite-72ab2d.netlify.app/.netlify/functions/getMatches";
const TARGET_EMAIL = "90plustickets@gmail.com";

// SMTP konfigurace (např. Gmail SMTP přes Nodemailer)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

exports.handler = async function () {
  try {
    // Datum zítřka podle CET/CEST
    const tzOffset = 2 * 60; // posun od UTC v minutách (např. +2 hod = 120 min)
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    tomorrow.setUTCHours(0 - tzOffset / 60, 0, 0, 0);

    const tomorrowStart = new Date(tomorrow);
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setUTCHours(23 + tzOffset / 60, 59, 59, 999);

    let matchList = [];

    // === A) Zápasy z API ===
    const matchRes = await fetch(API_FUNCTION_URL);
    const matchJson = await matchRes.json();
    const matches = matchJson?.matches || [];

    const apiMatches = matches.filter((match) => {
      const matchDate = new Date(match.utcDate);
      return matchDate >= tomorrowStart && matchDate <= tomorrowEnd;
    });

    matchList.push(...apiMatches.map(
      (m) => `API: ${m.homeTeam.name} vs ${m.awayTeam.name} (${new Date(m.utcDate).toLocaleString()})`
    ));

    // === B) Zápasy z ručně zadaného metafieldu ===
    const productsRes = await fetch(`https://${SHOPIFY_STORE}/admin/api/2023-04/products.json?limit=250`, {
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ADMIN_API_TOKEN,
        "Content-Type": "application/json",
      },
    });

    const productsJson = await productsRes.json();
    const products = productsJson?.products || [];

    for (const product of products) {
      const metafieldsRes = await fetch(`https://${SHOPIFY_STORE}/admin/api/2023-04/products/${product.id}/metafields.json`, {
        headers: {
          "X-Shopify-Access-Token": SHOPIFY_ADMIN_API_TOKEN,
          "Content-Type": "application/json",
        },
      });

      const metafieldsJson = await metafieldsRes.json();
      const matchDateField = metafieldsJson.metafields.find(
        (f) => f.namespace === "custom" && f.key === "match_date"
      );

      const matchDate = matchDateField?.value;
      if (matchDate) {
        const matchDateObj = new Date(matchDate);
        if (matchDateObj >= tomorrowStart && matchDateObj <= tomorrowEnd) {
          matchList.push(`MANUAL: ${product.title} (${matchDateObj.toLocaleString()})`);
        }
      }
    }

    if (matchList.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Žádné zápasy ke skrytí zítra." }),
      };
    }

    await transporter.sendMail({
      from: `90PlusTickets <${process.env.MAIL_USER}>`,
      to: TARGET_EMAIL,
      subject: "Zítřejší zápasy ke skrytí",
      text: `Zítřejší zápasy, které budou skryty:\n\n${matchList.join("\n")}`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, sent: matchList.length }),
    };
  } catch (error) {
    console.error("Chyba při odesílání e-mailu:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};