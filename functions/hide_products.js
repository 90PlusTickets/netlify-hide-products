export default async (req, res) => {
  try {
    const apiUrl = 'https://dreamy-sprite-72ab2d.netlify.app/.netlify/functions/getMatches';
    const response = await fetch(apiUrl);
    const data = await response.json();

    // Zde vrátíme celý objekt pro kontrolu
    return res.status(200).json({
      rawData: data
    });
  } catch (error) {
    return res.status(500).json({
      error: "Server error",
      details: error.message
    });
  }
};