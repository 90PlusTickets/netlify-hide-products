const fetch = require("node-fetch");

const TEAM_IDS = {
  "ac milan": 489,
  "inter": 505,
  "atalanta": 499,
  "como": 895,
  "eintracht frankfurt": 169,
  "psv eindhoven": 197,
  "vfb stuttgart": 172,
};

const API_KEY = process.env.FOOTBALL_API_KEY;

exports.handler = async function () {
  try {
    const allMatches = [];

    for (const [teamKey, teamId] of Object.entries(TEAM_IDS)) {
      const response = await fetch(
        `https://v3.football.api-sports.io/fixtures?team=${teamId}&season=2025&timezone=Europe/Prague`,
        {
          headers: {
            "x-apisports-key": API_KEY,
          },
        }
      );

      const data = await response.json();

      const teamMatches = data.response.map((match) => ({
        home_team: match.teams.home.name,
        away_team: match.teams.away.name,
        utcDate: match.fixture.date,
      }));

      allMatches.push(...teamMatches);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ matches: allMatches }),
    };
  } catch (error) {
    console.error("Chyba v getMatches:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error" }),
    };
  }
};

