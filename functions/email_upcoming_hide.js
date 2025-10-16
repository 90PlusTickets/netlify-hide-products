const fetch = require("node-fetch");
const nodemailer = require("nodemailer");

const SHOPIFY_ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const API_FUNCTION_URL = "https://dreamy-sprite-72ab2d.netlify.app/.netlify/functions/getMatches";
const TARGET_EMAIL = "90plustickets@gmail.com";

// SMTP transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

exports.handler = async function () {
  try {
    const debugInfo = [];

    const now = new Date();
    const tomorrowStart = new Date(now);
    tomorrowStart.setDate(now.getDate() + 1);
    tomorrowStart.setHours(0, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setHours(23, 59, 59, 999);

    debugInfo.push(`Zítřek je od ${tomorrowStart.toISOString()} do ${tomorrowEnd.toISOString()}`);

    // 1. Z API
    const matchRes = await fetch(API_FUNCTION_URL);
    const matchJson = await matchRes.json();
    const matches = matchJson?.matches || [];

    const apiMatches = matches.filter((match) => {
      const matchDate = new Date(match.utcDate);
      return matchDate >= tomorrowStart && matchDate <= tomorrowEnd;
    });

    debugInfo.push(`Zápasy z API na zítřek: ${apiMatches.length}`);
    for (const match of apiMatches) {
      debugInfo.push(`API: ${match.homeTeam.name} vs ${match.awayTeam.name} - ${match.utcDate}`);
    }

    // 2. Z Shopify produktů
    const shopifyRes = await fetch(`https://${SHOPIFY_STORE}/admin/api/2023-04/products.json?limit=250`, {
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ADMIN_API_TOKEN,
        "Content-Type": "application/json",
      },
    });

    const shopifyJson = await shopifyRes.json();
    const products = shopifyJson.products || [];

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
        const matchDate = new Date(matchDateField.value);
        if (matchDate >= tomorrowStart && matchDate <= tomorrowEnd) {
          manualMatches.push({
            title: product.title,
            date: matchDate.toISOString(),
          });
        }
      }
    }

    debugInfo.push(`Manuální zápasy na zítřek: ${manualMatches.length}`);
    for (const m of manualMatches) {
      debugInfo.push(`Manuál: ${m.title} - ${m.date}`);
    }

    // Spojení
    const totalMatches = [
      ...apiMatches.map((m) => `${m.homeTeam.name} vs ${m.awayTeam.name} (${m.utcDate})`),
      ...manualMatches.map((m) => `${m.title} (${m.date})`),
    ];

    if (totalMatches.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Žádné zápasy ke skrytí zítra.", debug: debugInfo }),
      };
    }

    await transporter.sendMail({
      from: `"90PlusTickets" <${process.env.MAIL_USER}>`,
      to: TARGET_EMAIL,
      subject: "Zítřejší zápasy ke skrytí",
      text: `Zítřejší zápasy:\n\n${totalMatches.join("\n")}\n\nDebug:\n${debugInfo.join("\n")}`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, matches: totalMatches.length, debug: debugInfo }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};