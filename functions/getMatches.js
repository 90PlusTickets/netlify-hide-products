// ✅ getMatches.js (plná verze bez ?team=, načte všechny týmy)

const fetch = require("node-fetch");

const TEAM_IDS = {
  "ac milan": 489,
  "inter": 505,
  "atalanta": 499,
  "como": 895,
  "eintracht frankfurt": 169,
  "psv eindhoven": 197,
  "vfb stuttgart": 172
};

const API_KEY = process.env.FOOTBALL_API_KEY;

exports.handler = async function () {
  // 🐞 Debug výpis
  console.log("⚙️ Načítám zápasy pro týmy:", Object.keys(TEAM_IDS));
  if (!API_KEY) {
    console.error("❌ Chybí FOOTBALL_API_KEY v prostředí!");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Missing API key" })
    };
  }

  const allMatches = [];

  for (const [teamKey, teamId] of Object.entries(TEAM_IDS)) {
    try {
      const response = await fetch(
        `https://v3.football.api-sports.io/fixtures?team=${teamId}&season=2025&timezone=Europe/Prague`,
        {
          headers: {
            "x-apisports-key": API_KEY
          }
        }
      );

      const data = await response.json();

      if (!data.response || !Array.isArray(data.response)) {
        console.error(`⚠️ Neplatná odpověď z API pro tým ${teamKey}:`, data);
        continue;
      }

      const teamMatches = data.response.map((match) => ({
        home_team: match.teams.home.name,
        away_team: match.teams.away.name,
        utcDate: match.fixture.date
      }));

      allMatches.push(...teamMatches);
    } catch (error) {
      console.error(`❌ Chyba při načítání pro tým ${teamKey}:`, error);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ matches: allMatches })
  };
};