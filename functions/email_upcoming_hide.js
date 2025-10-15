const fetch = require("node-fetch");
const nodemailer = require("nodemailer");

const SHOPIFY_ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const API_FUNCTION_URL = "https://dreamy-sprite-72ab2d.netlify.app/.netlify/functions/getMatches";
const TARGET_EMAIL = "90plustickets@gmail.com";

// SMTP konfigurace (používáme Gmail SMTP přes Nodemailer)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

exports.handler = async function () {
  try {
    const matchRes = await fetch(API_FUNCTION_URL);
    const matchJson = await matchRes.json();
    const matches = matchJson?.matches || [];

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const tomorrowMatches = matches.filter((match) => {
      const matchDate = new Date(match.utcDate);
      return matchDate.toDateString() === tomorrow.toDateString();
    });

    if (tomorrowMatches.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Žádné zápasy ke skrytí zítra." }),
      };
    }

    const matchList = tomorrowMatches.map(
      (m) => `${m.homeTeam.name} vs ${m.awayTeam.name} (${new Date(m.utcDate).toLocaleString()})`
    ).join("\n");

    await transporter.sendMail({
      from: `"90PlusTickets" <${process.env.MAIL_USER}>`,
      to: TARGET_EMAIL,
      subject: "Zítřejší zápasy ke skrytí",
      text: `Zítřejší zápasy, které budou skryty:\n\n${matchList}`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, sent: tomorrowMatches.length }),
    };
  } catch (error) {
    console.error("Chyba při odesílání e-mailu:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};