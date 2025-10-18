const fetch = require("node-fetch");
const nodemailer = require("nodemailer");

const SHOPIFY_ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const API_FUNCTION_URL = "https://dreamy-sprite-72ab2d.netlify.app/.netlify/functions/getMatches";
const TARGET_EMAIL = "90plustickets@gmail.com";

const ALIASES = {
  "Sunderland": "Sunderland AFC",
  "Wolves": "Wolverhampton Wanderers",
  "Nottingham": "Nottingham Forest",
  "Man United": "Manchester United",
  "Man City": "Manchester City",
  // Přidej další podle potřeby
};

// Pomocná funkce pro nahrazení aliasů
function applyAliases(name) {
  return ALIASES[name.trim()] || name.trim();
}

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
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const tomorrowMatches = matches.filter((match) => {
      const matchDate = new Date(match.utcDate).toISOString().split("T")[0];
      return matchDate === tomorrowStr;
    });

    const matchList = tomorrowMatches.map((match) => {
      const home = match.homeTeam.name;
      const away = match.awayTeam.name;
      const date = new Date(match.utcDate).toLocaleString();
      return `${home} vs ${away} (${date})`;
    });

    if (matchList.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Žádné zápasy ke skrytí zítra.",
          debug: [`Zítřek (datum): ${tomorrowStr}`, "Zápasy z API na zítřek: 0"],
        }),
      };
    }

    await transporter.sendMail({
      from: `"90PlusTickets" <${process.env.MAIL_USER}>`,
      to: TARGET_EMAIL,
      subject: "Zítřejší zápasy ke skrytí",
      text: `Zítřejší zápasy:\n\n${matchList.join("\n")}`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        sent: matchList.length,
        debug: [`Zítřek (datum): ${tomorrowStr}`, `Zápasy z API na zítřek: ${matchList.length}`],
      }),
    };
  } catch (error) {
    console.error("Chyba:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};