exports.handler = async function (event) {
  const teamParam = event.queryStringParameters?.team;

  return {
    statusCode: 200,
    body: JSON.stringify({ debug: teamParam })
  };
};

// functions/getMatches.js
const fetch = require('node-fetch');

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

exports.handler = async function (event) {
  const teamParam = event.queryStringParameters?.team;
  const teamsToFetch = [];

  if (teamParam) {
    // Převod "ac-milan" → "ac milan"
    const normalizedTeam = teamParam.toLowerCase().trim().replace(/-/g, " ");
    const teamId = TEAM_IDS[normalizedTeam];

    if (!teamId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing teamId or unknown teamKey" })
      };
    }

    teamsToFetch.push([normalizedTeam, teamId]);
  } else {
    teamsToFetch.push(...Object.entries(TEAM_IDS));
  }

  const allMatches = [];

  for (const [teamKey, teamId] of teamsToFetch) {
    try {
      const response = await fetch(`https://v3.football.api-sports.io/fixtures?team=${teamId}&season=2025&timezone=Europe/Prague`, {
        headers: {
          'x-apisports-key': API_KEY
        }
      });

      const data = await response.json();
      const teamMatches = data.response
        .filter(match => match.teams.home.id === teamId)
        .map(match => ({
          home_team: match.teams.home.name,
          away_team: match.teams.away.name,
          utcDate: match.fixture.date
        }));

      allMatches.push(...teamMatches);
    } catch (error) {
      console.error(`Chyba při získávání zápasů pro tým ${teamKey}:`, error);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ matches: allMatches })
  };
};