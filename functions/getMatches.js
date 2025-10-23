exports.handler = async function () {
  try {
    const matches = [
      {
        home_team: "AC Milan",
        away_team: "Juventus",
        utcDate: "2025-10-21T19:00:00Z",
      },
      {
        home_team: "Eintracht Frankfurt",
        away_team: "Liverpool",
        utcDate: "2025-10-22T18:00:00Z",
      },
      {
        home_team: "PSV",
        away_team: "Napoli",
        utcDate: "2025-10-24T20:00:00Z",
      },
    ];

    return {
      statusCode: 200,
      body: JSON.stringify({ matches }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};