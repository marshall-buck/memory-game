"use strict";
// TODO:Save current game state
// TODO::Score
// TODO: End of game animation
/** Memory game: find matching pairs of cards and flip both of them. */

const FOUND_MATCH_WAIT_MSECS = 1000;
const PAINT_TIME = 60;


let currentScore = 0;
let imgSrcShuffled;

let firstCardFlipped;
let activeCards = 0;

const form = document.querySelector('#start');

document.addEventListener('DOMContentLoaded', init);


function init() {

  if (!localStorage.getItem('currentGameState')) {
    setStorage('currentGameState', {
      uiState: [],
      imgSrcShuffled: [],
      currentScore: 0,
      firstCardFlipped: undefined,
      activeCards: 0
    });
  } else {

  }
}

form.addEventListener('submit', handelFormSubmission);
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

/* Create card for every src in srcs array
    and  paint to DOM while adding event listener,
    set id to index in source to check for matches
 */

function createCards(srcs) {
  const gameBoard = document.getElementById('game');
  let uiState = [];
  for (let i = 0; i < srcs.length; i++) {
    let obj = {};
    obj[i] = 'card off';
    uiState.push(obj);
    setTimeout(() => {
      const card = document.createElement('div');
      card.classList = 'card off';
      card.id = i;
      card.addEventListener('click', handleCardClick);
      gameBoard.append(card);


    }, PAINT_TIME * i);
  }
  console.log(uiState);
  writeToGameState('uiState', uiState);
  gameBoard.style.opacity = '1';
}
// Delete cards on game restart
function deleteCards() {
  const cards = document.querySelectorAll('.card');
  let count = 0;
  for (let card of cards) {
    count++;
    setTimeout(() => {
      card.remove();
    }, PAINT_TIME * count);
  }
  writeToGameState('imgSrcShuffled', []);
  // imgSrcShuffled = [];

}

/** Flip a card face-up.
 *make sure only one other card is 'on'
 */

function flipCard(card) {
  const index = card.id;
  const img = document.createElement('img');
  img.addEventListener('error', (e) => {
    e.target.src = 'backup.png';
  });
  img.src = imgSrcShuffled[index];

  card.append(img);

  card.classList.toggle('off');
  card.classList.toggle('anim');
  // Every time a card is flipped, add 1 to activeCards
  activeCards++;
}

/** Flip a card face-down.
 the only time the card is un-flipped dis when there is no match
 */

function unFlipCard(card) {

  card.classList.toggle('off');
  const p = card.firstChild;

  card.removeChild(p);
  card.classList.toggle('anim');
}

/** Handle clicking on a card: this could be first-card or second-card. */

function handleCardClick(evt) {
  const card = evt.target;
  // if card is active or if active cards are 2 do not click
  if (!isCardOff(card) || activeCards === 2) {
    return;
  }
  // flip a card
  else {
    flipCard(card);
    //  is there a currentCard ie. is this the second card flipped
    if (activeCards === 2) {
      // a match occurred
      if (imgSrcShuffled[firstCardFlipped.id] === imgSrcShuffled[card.id]) {
        currentScore++;
        getStorage('currentScore');
        card.classList.add('match');
        card.classList.toggle('anim');
        const first = document.getElementById(firstCardFlipped.id);
        first.classList.add('match');
        card.classList.toggle('anim');
        firstCardFlipped = undefined;
        // End if game
        if (isEndOfGame()) {
          setTimeout(() => {
            console.log('end of game');
            activeCards = 0;
            firstCardFlipped = undefined;
          }, 500);

        }
        // a match occurred but not end of game
        else { firstCardFlipped = undefined; activeCards = 0; }
      }
      // No match occurred
      else {
        setTimeout(() => {
          unFlipCard(card);
          unFlipCard(firstCardFlipped);
          firstCardFlipped = undefined;
          activeCards = 0;
        }, 1000);
      }
    }
    // This is the first card flipped
    else {
      firstCardFlipped = card;
    }
  }
}


/** Handle form submission and get game data */
async function handelFormSubmission(e) {
  e.preventDefault();
  deleteCards();
  const num = form.elements.num.value;
  if (isNaN(num) || num < 1 || num > 20) {
    window.alert('Please enter a number between 1 and 20');
    return;
  }
  showLoader('Please wait while images are retrieved');
  const page = getRandomPageNumber();

  const apiLinks = await fetchApiLinks(num, page);

  const imgSrcs = await fetchImageIds(apiLinks);
  imgSrcShuffled = shuffle([...imgSrcs, ...imgSrcs]);
  createCards(imgSrcShuffled);
  writeToGameState('imgSrcShuffled', imgSrcShuffled);
  form.lastElementChild.innerText = 'Restart';
  form.reset();






}
// Card helpers
function isCardOff(card) {
  if (card.classList.contains('off')) return true;
  return false;
}


function isEndOfGame() {

  for (let card of document.querySelectorAll('.card')) {
    if (isCardOff(card)) return false;
  }
  return true;
}



// Loaders for while fetching images
function showLoader(message) {
  const container = document.querySelector('.container');
  const loadContainer = document.createElement('div');
  loadContainer.classList = 'loading';
  loadContainer.innerText = message;
  container.append(loadContainer);
  const spinner = document.createElement('div');
  spinner.classList = 'load-spin';
  loadContainer.append(spinner);
}
function removeLoader() {
  document.querySelector('.loading').remove();
}

/** API functions to retrieve images from Chicago art institute */
function getRandomPageNumber() {
  return Math.floor(Math.random() * 25 + 1);
}

async function fetchApiLinks(num, page) {
  try {
    const response = await fetch(`https://api.artic.edu/api/v1/artworks/search?query[term][is_public_domain]=true&fields=api_link,pagination&limit=${num}&page=${page}`);
    const json = await response.json();
    const results = await json;
    const apiLinks = [];
    for (const data of results.data) {
      apiLinks.push(data.api_link);
    }

    return apiLinks;
  } catch (error) {

    console.log(error);
  }


}
async function fetchImageIds(array) {
  let imgSrcs = [];
  for (const link of array) {
    try {
      const response = await fetch(`${link}/?fields=image_id`);
      const json = await response.json();
      const result = await json;

      imgSrcs.push(`https://www.artic.edu/iiif/2/${result.data.image_id}/full/200,/0/default.jpg`);
    } catch (error) {
      console.log(error);
    }
  }
  removeLoader();
  return imgSrcs;
}

// LOCAL STORAGE HELPERS

function writeToGameState(key, value) {
  const data = JSON.parse(localStorage.getItem('currentGameState'));
  data[key] = value;
  localStorage.setItem('currentGameState', JSON.stringify(data));
}

function readFromGameState(key) {
  const data = localStorage.getItem(JSON.parse('currentGameState'));
  return data[key];
}
function setStorage(string, data) {
  localStorage.setItem(string, JSON.stringify(data));
}




// }
// get list of ids, object will have an api field, use that to get image id
// https://api.artic.edu/api/v1/artworks/search?query[term][is_public_domain]=true&fields=api_link&limit=30

// get list of image ids
// https://api.artic.edu/api/v1/artworks/102611/?fields=image_id

// get image url
// https://www.artic.edu/iiif/2/4dd78841-4237-9e49-76ec-136fbfa0b0a7/full/200,/0/default.jpg
