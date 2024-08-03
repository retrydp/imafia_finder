const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const playersPerTable = 10; //default mafia players count
const urlBase = (id) => `https://imafia.org/tournament/${id}`;
const tournamentId = '740'; //'703';

const selector =
  '#tournament-results > div > div > div > div > div.games_item_content > div > div > a:not(:empty)';

const urlTail = '#tournament-info';

/**
 * Fetches HTML content from a given URL.
 * @param {string} url - The URL to fetch.
 * @returns {Promise<string>} - The HTML content.
 */
const getHtml = async (url) => {
  const response = await fetch(url);
  if (response.ok) {
    return await response.text();
  } else throw new Error('Fetch error: ' + response?.status);
};

/**
 * Parses HTML content and returns elements matching the selector.
 * @param {string} html - The HTML content.
 * @param {string} selector - The CSS selector.
 * @returns {NodeList} - The matched elements.
 */
const getDom = (response, selector) => {
  const dom = new JSDOM(response);
  const items = dom.window.document.querySelectorAll(selector);

  return items;
};

/**
 * Retrieves raw player data from the tournament page.
 * @returns {Promise<NodeList>} - The raw player data.
 */
const getPlaysRawData = async () => {
  const url = urlBase(tournamentId) + urlTail;
  const response = await getHtml(url);
  const gamesItem = getDom(response, selector);

  return gamesItem;
};

/**
 * Generates the state of games based on player names, games count, and tables count.
 * @param {string[]} namesArray - The array of player names.
 * @param {number} gamesCount - The number of games.
 * @param {number} tablesCount - The number of tables.
 * @returns {Object[]} - The generated games state.
 */
const generateGamesState = (namesArray, gamesCount, tablesCount) => {
  const gamesState = Array.from(
    { length: gamesCount * tablesCount },
    (_, idx) => {
      const players = namesArray.slice(
        idx * playersPerTable,
        idx * playersPerTable + playersPerTable
      );
      const game = Math.floor(((idx / tablesCount) % gamesCount) + 1);
      const table = (idx % tablesCount) + 1;

      return { game, table, players };
    }
  );

  return gamesState;
};

/**
 * Initializes the tournament state by fetching and processing player data.
 * @returns {Promise<Object>} - The initialized state containing player and game information.
 */
const initState = async () => {
  const playsRawData = await getPlaysRawData();
  const participantsNames = Array.from(
    playsRawData,
    ({ textContent }) => textContent
  );
  const participants = [...new Set(participantsNames)];
  const playersCount = participants.length;
  const tablesCount = playersCount / playersPerTable;
  const gamesCount = participantsNames.length / playersPerTable;
  const participantsSorted = participants.toSorted((a, b) =>
    a.localeCompare(b)
  );
  const games = generateGamesState(participantsNames, gamesCount, tablesCount);

  return {
    playersCount,
    tablesCount,
    gamesCount,
    participants: participantsSorted,
    games,
  };
};

/**
 * Retrieves the games and tables a specific player participated in.
 * @param {string} player - The name of the player.
 * @returns {Promise<Object[]>} - The games and tables the player participated in.
 */
const getSpecificPlayerGames = async (player) => {
  const state = await initState();
  const playerGames = state.games
    .filter(({ players }) => players.includes(player))
    .map(({ game, table }) => ({ game, table }));

  return playerGames;
};

// getSpecificPlayerGames('Medved').then(console.log);
initState().then((data) => console.dir(data, { depth: null }));
