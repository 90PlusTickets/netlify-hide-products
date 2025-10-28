const aliasMap = {
  // IT
  "ac milan":"ac milan","milan":"ac milan",
  "inter milan":"internazionale milano","inter":"internazionale milano",
  "atalanta":"atalanta bergamasca calcio","atalanta bergamo":"atalanta bergamasca calcio","atalanta bc":"atalanta bergamasca calcio",

  // NL
  "ajax":"ajax","afc ajax":"ajax","ajax amsterdam":"ajax",
  "az":"az alkmaar","az alkmaar":"az alkmaar",
  "pec zwolle":"pec zwolle","zwolle":"pec zwolle",
  "nac breda":"nac breda","breda":"nac breda",
  "fc groningen":"fc groningen","groningen":"fc groningen",
  "heracles almelo":"heracles almelo","heracles":"heracles almelo",
  "sc heerenveen":"sc heerenveen","heerenveen":"sc heerenveen","heerenveren":"sc heerenveen",
  "sbv excelsior":"sbv excelsior","excelsior":"sbv excelsior","excelsior rotterdam":"sbv excelsior",
  "telstar 1963":"telstar 1963","telstar":"telstar 1963","sc telstar":"telstar 1963",
  "feyenoord":"feyenoord rotterdam","feyenoord rotterdam":"feyenoord rotterdam",
  "psv":"psv","psv eindhoven":"psv",
  "utrecht":"fc utrecht","fc utrecht":"fc utrecht",
  "nec":"nec nijmegen","nijmegen":"nec nijmegen","nec nijmegen":"nec nijmegen",
  "go ahead eagles":"go ahead eagles","g a eagles":"go ahead eagles","g a eagels":"go ahead eagles","go-ahead eagles":"go ahead eagles",

  // DE
  "bayer leverkusen":"bayer leverkusen","bayer 04 leverkusen":"bayer leverkusen","leverkusen":"bayer leverkusen",
  "borussia dortmund":"borussia dortmund","dortmund":"borussia dortmund","bvb":"borussia dortmund",
  "1 fc union berlin":"1 fc union berlin","1. fc union berlin":"1 fc union berlin","union berlin":"1 fc union berlin",
  "sc freiburg":"sc freiburg","freiburg":"sc freiburg","sport-club freiburg":"sc freiburg",
  "vfb stuttgart":"vfb stuttgart","stuttgart":"vfb stuttgart",
  "eintracht frankfurt":"eintracht frankfurt","frankfurt":"eintracht frankfurt",
  "fc bayern munchen":"fc bayern munchen","bayern":"fc bayern munchen","bayern munich":"fc bayern munchen","bayern münchen":"fc bayern munchen","fc bayern":"fc bayern munchen",
  "sg dynamo dresden":"sg dynamo dresden","dynamo dresden":"sg dynamo dresden","dresden":"sg dynamo dresden",
  "fc augsburg":"fc augsburg","augsburg":"fc augsburg",
  "1. fsv mainz 05":"1. fsv mainz 05","1 fsv mainz 05":"1. fsv mainz 05","mainz":"1. fsv mainz 05",
  "tsg 1899 hoffenheim":"tsg 1899 hoffenheim","tsg hoffenheim":"tsg 1899 hoffenheim","hoffenheim":"tsg 1899 hoffenheim",
  // Bayern
"bayern": "fc bayern munchen",
"bayern munchen": "fc bayern munchen",
"bayern munich": "fc bayern munchen",
"fc bayern": "fc bayern munchen",
"fc bayern munich": "fc bayern munchen",
"fc bayern munchen": "fc bayern munchen",

// Hamburg
"hamburg": "hamburger sv",
"hamburg sv": "hamburger sv",
"hamburger sv": "hamburger sv",
"hamburger sport verein": "hamburger sv",
"hamburger sport-verein": "hamburger sv",

  // ES
  "athletic club":"athletic club","ath bilbao":"athletic club","athletic bilbao":"athletic club","athletic club bilbao":"athletic club","bilbao":"athletic club",

  // ENG
  "everton fc":"everton fc","everton":"everton fc",
  "nottingham forest fc":"nottingham forest fc","nottingham forest":"nottingham forest fc","nottingham":"nottingham forest fc","forest":"nottingham forest fc",
  "tottenham hotspur":"tottenham hotspur","tottenham":"tottenham hotspur","tottenham hotspurs":"tottenham hotspur","spurs":"tottenham hotspur",
  "manchester united":"manchester united","manchester utd":"manchester united","man utd":"manchester united","man united":"manchester united",
  "arsenal fc":"arsenal fc","arsenal":"arsenal fc",
  "chelsea fc":"chelsea fc","chelsea":"chelsea fc",
  "leeds united":"leeds united","leeds":"leeds united","leeds utd":"leeds united",
  "burnley":"burnley",
  "aston villa fc":"aston villa fc","aston villa":"aston villa fc","villa":"aston villa fc",
  "sunderland afc":"sunderland afc","sunderland":"sunderland afc",
  "wrexham afc":"wrexham afc","wrexham":"wrexham afc",
  "liverpool fc":"liverpool fc","liverpool":"liverpool fc",
  "newcastle united":"newcastle united","newcastle":"newcastle united","newcastle utd":"newcastle united",
  "manchester city":"manchester city","man city":"manchester city",
  "west ham united":"west ham united","west ham":"west ham united","westham":"west ham united",
  "wolverhampton wanderers":"wolverhampton wanderers","wolves":"wolverhampton wanderers","wolverhampton":"wolverhampton wanderers",
  "brighton & hove albion":"brighton & hove albion","brighton":"brighton & hove albion","brighton and hove":"brighton & hove albion",
  "brentford fc":"brentford fc","brentford":"brentford fc",
  "afc bournemouth":"afc bournemouth","bournemouth":"afc bournemouth",
  "fulham fc":"fulham fc","fulham":"fulham fc",
  "crystal palace":"crystal palace",

  // SCO
  "celtic fc":"celtic fc","celtic":"celtic fc",
  "rangers fc":"rangers fc","rangers":"rangers fc",

  // CZ/SK
  "ac sparta praha":"ac sparta praha","sparta praha":"ac sparta praha",
  "sk slavia praha":"sk slavia praha","slavia praha":"sk slavia praha",

  // TR (evropské poháry)
  "fenerbahce":"fenerbahce","fenerbahçe":"fenerbahce",

  // NT (rezerva pro ruční věci)
  "germany":"germany","slovakia":"slovakia","ceska republika":"czech republic","czech republic":"czech republic"
};

/************** API KEYS (hezké názvy, co API očekává) **************/
const TEAM_API_KEYS = {
  // NL
  "ajax":"Ajax","az alkmaar":"AZ Alkmaar","pec zwolle":"PEC Zwolle","nac breda":"NAC Breda",
  "fc groningen":"FC Groningen","heracles almelo":"Heracles Almelo","sc heerenveen":"SC Heerenveen",
  "sbv excelsior":"SBV Excelsior","telstar 1963":"Telstar 1963","feyenoord rotterdam":"Feyenoord",
  "psv eindhoven":"PSV Eindhoven","fc utrecht":"FC Utrecht","nec nijmegen":"NEC","go ahead eagles":"Go Ahead Eagles",

  // DE
  "bayer leverkusen":"Bayer 04 Leverkusen","1 fc union berlin":"1. FC Union Berlin","sc freiburg":"SC Freiburg",
  "vfb stuttgart":"VfB Stuttgart","eintracht frankfurt":"Eintracht Frankfurt","fc bayern munchen":"FC Bayern München",
  "sg dynamo dresden":"SG Dynamo Dresden","fc augsburg":"FC Augsburg","1. fsv mainz 05":"1. FSV Mainz 05","tsg 1899 hoffenheim":"TSG 1899 Hoffenheim",
"hamburger sv": "Hamburger SV",

  // ES / SCO
  "athletic club":"Athletic Club","celtic fc":"Celtic","rangers fc":"Rangers",

  // ENG
  "everton fc":"Everton","nottingham forest fc":"Nottingham Forest","tottenham hotspur":"Tottenham Hotspur",
  "manchester united":"Manchester United","arsenal fc":"Arsenal","chelsea fc":"Chelsea","leeds united":"Leeds United",
  "burnley":"Burnley","aston villa fc":"Aston Villa","sunderland afc":"Sunderland","wrexham afc":"Wrexham",
  "liverpool fc":"Liverpool","newcastle united":"Newcastle United","manchester city":"Manchester City",
  "west ham united":"West Ham United","wolverhampton wanderers":"Wolverhampton Wanderers","brighton & hove albion":"Brighton & Hove Albion",
  "brentford fc":"Brentford","afc bournemouth":"AFC Bournemouth","fulham fc":"Fulham","crystal palace":"Crystal Palace",

  // CZ
  "ac sparta praha":"AC Sparta Praha","sk slavia praha":"SK Slavia Praha",

  // TR
  "fenerbahce":"Fenerbahçe",

  // NT
  "germany":"Germany","slovakia":"Slovakia","czech republic":"Czech Republic"
};

function buildTeamKeyVariants_(rawName) {
  const aliased = applyAlias(rawName);           // kanonický tvar
  const pretty  = TEAM_API_KEYS[aliased] || toTitleCase_(aliased);

  function stripPrefixes(s) {
    return String(s)
      .replace(/^\s*1\.\s*/i, '')   // 1. FC ...
      .replace(/^\s*fc\s+/i, '')    // FC ...
      .replace(/^\s*vfb\s+/i, '')   // VfB ...
      .replace(/^\s*sc\s+/i, '')    // SC ...
      .trim();
  }

  const extras = {
    "fc bayern munchen": "Bayern Munich",
    "vfb stuttgart": "Stuttgart",
    "leeds united": "Leeds",
    "sc freiburg": "Freiburg",
    "tsg 1899 hoffenheim": "Hoffenheim",
    "tottenham hotspur": "Tottenham"
  };

  const variants = [
    pretty,
    rawName,
    aliased,
    stripPrefixes(pretty),
    stripPrefixes(aliased),
    extras[aliased] || null
  ].filter((v, i, a) => v && a.indexOf(v) === i);

  return variants;
}

function normalizeTeamName(name) {
  return aliasMap[name.trim().toLowerCase()] || name.trim().toLowerCase();
}

module.exports = { aliasMap, normalizeTeamName, TEAM_API_KEYS };