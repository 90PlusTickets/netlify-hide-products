export default async () => {
  try {
    const apiUrl = 'https://dreamy-sprite-72ab2d.netlify.app/.netlify/functions/getMatches';
    const response = await fetch(apiUrl);
    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify({
        rawData: data
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Server error",
        details: error.message
      })
    };
  }
};