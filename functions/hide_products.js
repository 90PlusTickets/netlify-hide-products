cexports.handler = async function () {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Funkce funguje správně ✅" })
  };
};