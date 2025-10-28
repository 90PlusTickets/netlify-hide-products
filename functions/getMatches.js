// functions/getMatches.js
const fetch = require("node-fetch");
const { aliasMap } = require("./aliasMap");

const API_KEY = process.env.FOOTBALL_API_KEY;

const TEAM_IDS = {
  "ac-milan": "98",
  "inter": "108",
  "atalanta": "102",
  "como": "1907",
  "as-roma": "100",
  "ajax": "678",
  "feyenoord": "675",
  "psv": "674",
  "arsenal": "57",
  "chelsea": "61",
  "leeds": "341",
  "tottenham": "73",
  "west-ham": "563",
  "sunderland": "71",
  "newcastle": "67",
  "burnley": "328",
  "sheffield-united": "356",
  "freiburg": "17",
  "bayern": "5",
  "stuttgart": "10",
  "dortmund": "4",
  "rb-leipzig": "721",
  "frankfurt": "19",
  "girona": "298",
  "athletic-bilbao": "77",
  "atletico-madrid": "78",
  "barcelona": "81",
  "espanyol": "80",
  "psg": "524",
  "brest": "512",
  "marseille": "516",
  "lyon": "523",
  "le-havre": "533",
  "celtic": "252",
  "rangers": "257"
};

exports.handler = async function () {
  const allMatches = [];

  for (const [teamName, teamId] of Object.entries(teamIds)) {
    const url = `https://v3.football.api-sports.io/fixtures?team=${teamId}&next=10`;

    const response = await fetch(url, {
      headers: {
        "x-apisports-key": API_KEY,
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch matches for ${teamName}`);
      continue;
    }

    const data = await response.json();
    const matches = data.response.map(match => ({
      home_team: match.teams.home.name,
      away_team: match.teams.away.name,
      utcDate: match.fixture.date,
    }));

    allMatches.push(...matches);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ matches: allMatches }),
  };
};