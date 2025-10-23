// functions/getMatches.js

const fetch = require('node-fetch');

const API_KEY = process.env.FOOTBALL_API_KEY;

// Map of team names (keys) to their API-Football IDs (values)
const TEAM_IDS = {
  "ac milan": 489,
  "inter": 505,
  "atalanta": 499,
  "como": 895,
  "eintracht frankfurt": 169,
  "psv eindhoven": 197,
  "vfb stuttgart": 172
};

exports.handler = async function () {
  const allMatches = [];

  for (const [teamKey, teamId] of Object.entries(TEAM_IDS)) {
    try {
      const response = await fetch(`https://v3.football.api-sports.io/fixtures?team=${teamId}&season=2025&timezone=Europe/Prague`, {
        headers: {
          'x-apisports-key': API_KEY
        }
      });

      const data = await response.json();

      if (!data.response) continue;

      const teamMatches = data.response.map(match => ({
        home_team: match.teams.home.name,
        away_team: match.teams.away.name,
        utcDate: match.fixture.date
      }));

      allMatches.push(...teamMatches);
    } catch (error) {
      console.error(`❌ Chyba u týmu ${teamKey}:`, error);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ matches: allMatches })
  };
};