export default async () => {
  try {
    const apiUrl = 'https://dreamy-sprite-72ab2d.netlify.app/.netlify/functions/getMatches';
    const response = await fetch(apiUrl);
    const data = await response.json();

    return new Response(
      JSON.stringify({ rawData: data }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Server error", details: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
};