"use strict";

const FOUND_MATCH_WAIT_MSECS = 1000;
const PAINT_TIME = 60;
let currentGameState = {
  uiState: [],
  imgSrcShuffled: [],
  currentScore: 0,
  firstCardFlipped: undefined,
  activeCards: 0,
};

let runningStats = {

  totalMatched: 0,
  highScore: 0,
};


const form = document.querySelector("#start");
// EVENT LISTENERS
window.addEventListener("DOMContentLoaded", init);
window.addEventListener("beforeunload", closingWindow);
form.addEventListener("submit", handelFormSubmission);

// EVENT HANDLERS

// Initialize game, load for storage if possible
function init() {
  // no game state in localStorage, so set it
  if (!localStorage.getItem("currentGameState")) {
    setStorage("currentGameState", currentGameState);
  } //there is localSTorage so load cards from previous game state
  else {
    currentGameState = JSON.parse(localStorage.getItem("currentGameState"));
    createCards(currentGameState.imgSrcShuffled);

  }
  // no running stats in local
  if
    (!localStorage.getItem("runningStats")) {
    setStorage("runningStats", runningStats);
  } else {
    runningStats = JSON.parse(localStorage.getItem("runningStats"));
  }
  //


  // whether there is localStorage or not, scores need to be added
  setScores(runningStats.highScore, ".high-score > h2:last-child");
  setScores(currentGameState.currentScore, '.current-score > h2:last-child');
  setScores(runningStats.totalMatched, '.total-matched > h2:last-child');

}
// /save game data before window closes
function closingWindow() {
  const currentUi = () => {
    let out = [];
    const cards = document.querySelectorAll(".card");
    for (let card of cards) {
      let obj = {};
      obj[card.id] = card.className;
      out.push(obj);
    }
    return out;
  };
  currentGameState.uiState = currentUi();
  setStorage("currentGameState", currentGameState);
  setStorage("runningStats", runningStats);
}

/** Handle form submission and get game data from api */
async function handelFormSubmission(e) {
  e.preventDefault();
  deleteCards();
  const num = form.elements.num.value;
  if (isNaN(num) || num < 1 || num > 30) {
    window.alert("Please enter a number between 1 and 30");
    return;
  }
  showLoader("Please wait while images are retrieved");
  const page = getRandomPageNumber();
  const apiLinks = await fetchApiLinks(num, page);
  const imgSrcs = await fetchImageIds(apiLinks);
  currentGameState.imgSrcShuffled = shuffle([...imgSrcs, ...imgSrcs]);
  createCards(currentGameState.imgSrcShuffled);

  form.reset();
}

/** Handle clicking on a card: this could be first-card or second-card. */

function handleCardClick(evt) {
  const card = evt.currentTarget;
  // if card is active or if active cards are 2 do not click
  if (!isCardOff(card) || currentGameState.activeCards === 2) {
    return;
  }
  // flip a card
  else {
    flipCard(card);
    //  is there a currentCard ie. is this the second card flipped
    if (currentGameState.activeCards === 2) {
      // a match occurred
      if (
        currentGameState.imgSrcShuffled[
        currentGameState.firstCardFlipped.id
        ] === currentGameState.imgSrcShuffled[card.id]
      ) {
        cardsMatch(card);
      }
      // No match occurred
      else {
        setTimeout(() => {
          unFlipCard(card);
          unFlipCard(currentGameState.firstCardFlipped);
          currentGameState.firstCardFlipped = undefined;

        }, 1000);
      }
    }
    // This is the first card flipped
    else {
      currentGameState.firstCardFlipped = card;

    }
  }
}

// CARD HELPERS
/**
 Create card either from saved game state or new game
 */
function createCards(srcs) {
  const gameBoard = document.getElementById("game");
  const uiState = currentGameState.uiState;
  for (let i = 0; i < srcs.length; i++) {
    setTimeout(() => {
      const card = document.createElement("div");
      card.id = i;
      const img = document.createElement("img");
      img.src = 'kindpng_3222475.png';
      card.classList = 'card off';


      if (uiState.length > 0) {
        const obj = uiState[i];
        card.classList = obj[i];
        //  If card is a match load the proper image
        if (card.classList.contains('match') || card.classList.contains('end-game')) {
          img.src = currentGameState.imgSrcShuffled[i];
        }
      }


      img.addEventListener("error", (e) => {
        e.target.src = "backup.png";

        // console.log(e.target);
      });
      card.append(img);
      card.addEventListener("click", handleCardClick);
      gameBoard.append(card);
    }, PAINT_TIME * i);
  }
  gameBoard.style.opacity = "1";
  form.lastElementChild.innerText = "New Game";
}
// Delete cards on game restart, reset local game state, reset current score to 0
function deleteCards() {
  const cards = document.querySelectorAll(".card");
  currentGameState = {
    uiState: [],
    imgSrcShuffled: [],
    currentScore: 0,
    firstCardFlipped: undefined,
    activeCards: 0,
  };
  setStorage('currentGameState', currentGameState);
  let count = 0;
  for (let card of cards) {
    count++;
    setTimeout(() => {
      card.remove();
    }, PAINT_TIME * count);
  }
  setScores(currentGameState.currentScore, '.current-score > h2:last-child');

}

/** Flip a card face-up.

 */

function flipCard(card) {
  const index = card.id;

  const img = card.firstChild;

  img.src = currentGameState.imgSrcShuffled[index];
  // card.append(img);
  card.classList = 'card flip';

  // Every time a card is flipped, add 1 to activeCards
  currentGameState.activeCards++;
}

/** Flip a card face-down.
 the only time the card is un-flipped is when there is no match
 */

function unFlipCard(card) {
  card.classList = 'card off';
  const img = card.firstChild;
  img.src = 'kindpng_3222475.png';
  // Every time a card is un-flipped, subtract 1 to activeCards
  currentGameState.activeCards--;

}


// Check if card is off
function isCardOff(card) {
  if (card.classList.contains("off")) return true;
  return false;
}
// Run on matched cards
function cardsMatch(card) {
  currentGameState.currentScore++;
  runningStats.totalMatched++;
  const first = document.getElementById(currentGameState.firstCardFlipped.id);
  card.classList = 'card match';
  first.classList = 'card match';
  currentGameState.firstCardFlipped = undefined;
  setScores(currentGameState.currentScore, '.current-score > h2:last-child');
  setScores(runningStats.totalMatched, '.total-matched > h2:last-child');
  // End if game
  if (isEndOfGame()) {

    endOfGame();
  }
  // a match occurred but not end of game
  else {
    currentGameState.firstCardFlipped = undefined;
    currentGameState.activeCards = 0;
  }
}

// Checks if all cards are flipped
function isEndOfGame() {
  for (let card of document.querySelectorAll(".card")) {
    if (isCardOff(card)) return false;
  }
  return true;
}
// Run at end of game
function endOfGame() {
  const cards = document.querySelectorAll('.card');
  for (const card of cards) {
    card.classList = 'end-game card';
  }


  if (currentGameState.currentScore > runningStats.highScore) {
    runningStats.highScore = currentGameState.currentScore;
    setScores(runningStats.highScore, '.high-score > h2:last-child');
  }

}





/** API FUNCTIONS to retrieve images from Chicago art institute */
function getRandomPageNumber() {
  return Math.floor(Math.random() * 25 + 1);
}

async function fetchApiLinks(num, page) {
  // get list of ids, object will have an api field, use that to get image id
  // https://api.artic.edu/api/v1/artworks/search?query[term][is_public_domain]=true&fields=api_link&limit=30
  try {
    const response = await fetch(
      `https://api.artic.edu/api/v1/artworks/search?query[term][is_public_domain]=true&fields=api_link,pagination&limit=${num}&page=${page}`
    );
    const json = await response.json();
    const results = await json;
    const apiLinks = [];
    // console.log(results);
    for (const data of results.data) {
      apiLinks.push(data.api_link);
    }

    return apiLinks;
  } catch (error) {
    console.log(error);
    showLoader(`${error.message}, please try again later`);
  }
}
async function fetchImageIds(array) {
  // get list of image ids
  // https://api.artic.edu/api/v1/artworks/102611/?fields=image_id
  let imgSrcs = [];
  for (const link of array) {
    try {
      const response = await fetch(`${link}/?fields=image_id`);
      const json = await response.json();
      const result = await json;
      // get image url
      // https://www.artic.edu/iiif/2/4dd78841-4237-9e49-76ec-136fbfa0b0a7/full/200,/0/default.jpg
      imgSrcs.push(
        `https://www.artic.edu/iiif/2/${result.data.image_id}/full/200,/0/default.jpg`
      );
    } catch (error) {
      console.log(error);
      showLoader(`${error.message}, please try again later`);
    }
  }
  removeLoader();
  return imgSrcs;
}



// APP HELPERS
function setStorage(string, data) {
  localStorage.setItem(string, JSON.stringify(data));
}

/** Shuffle array items in-place and return shuffled array. */
function shuffle(items) {
  // This algorithm does a "perfect shuffle", where there won't be any
  // statistical bias in the shuffle (many naive attempts to shuffle end up not
  // be a fair shuffle). This is called the Fisher-Yates shuffle algorithm; if
  // you're interested, you can learn about it, but it's not important.

  for (let i = items.length - 1; i > 0; i--) {
    // generate a random index between 0 and i
    let j = Math.floor(Math.random() * i);
    // swap item at i <-> item at j
    [items[i], items[j]] = [items[j], items[i]];
  }

  return items;
}

function setScores(int, str) {
  const ele = document.querySelector(str);
  ele.innerText = int;
}

// Loaders for while fetching images
function showLoader(message) {
  const container = document.querySelector(".container");
  const loadContainer = document.createElement("div");
  loadContainer.classList = "loading";
  loadContainer.innerText = message;
  container.append(loadContainer);
  const spinner = document.createElement("div");
  spinner.classList = "load-spin";
  loadContainer.append(spinner);
}
function removeLoader() {
  document.querySelector(".loading").remove();
}

