"use strict";

/** Memory game: find matching pairs of cards and flip both of them. */

const FOUND_MATCH_WAIT_MSECS = 1000;
const PAINT_TIME = 20;



let imgSrcs = [];
let imgSrcShuffled;




let firstCardFlipped;
let activeCards = 0;
let gameState = { inProgress: false, fetching: false };
const form = document.querySelector('#start');



form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const num = form.elements.num.value;
  if (isNaN(num) || num < 1 || num > 50) {
    window.alert('Please enter a number between 1 and 50');
    return;
  }

  const page = await getRandomPageNumber();

  const apiLinks = await fetchApiLinks(num, page);

  const srcs = await fetchImageIds(apiLinks);
  imgSrcs = [...srcs, ...srcs];




  if (gameState.inProgress === false) {
    imgSrcShuffled = shuffle(imgSrcs);
    createCards(imgSrcShuffled);
    gameState.inProgress = true;
    form.lastElementChild.innerText = "Restart";
    form.reset();


  } else {
    resetBoard();
    setTimeout(() => {
      imgSrcShuffled = shuffle(imgSrcs);
      createCards(imgSrcShuffled);
    }, 800);

  }



});
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

/** Create card for every color in colors (each will appear twice)
 *
 * Each div DOM element will have:
 * - a class with the value of the color
 * - a click event listener for each card to handleCardClick
 */

function createCards(srcs) {
  const gameBoard = document.getElementById("game");
  let count = 0;
  for (let i = 0; i < srcs.length; i++) {

    setTimeout(() => {
      const card = document.createElement('div');
      card.classList = 'card off';
      card.id = i;
      card.addEventListener('click', handleCardClick);
      gameBoard.append(card);
    }, PAINT_TIME * i);



  }
  gameBoard.style.opacity = '1';
}

/** Flip a card face-up.
 *make sure only one other card is 'on'
 */

function flipCard(card) {
  const index = card.id;
  // const p = document.createElement('p');
  // p.innerText = imgSrcShuffled[index];
  // card.append(p);
  const img = document.createElement('img');
  img.src = imgSrcShuffled[index];
  card.append(img);

  card.classList.toggle('off');

  card.classList.toggle('anim');

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
  if (gameState.inProgress === false) return;
  const card = evt.target;
  if (!isCardOff(card) || activeCards === 2) {
    return;
  }
  else {
    flipCard(card);

    //  is there a currentCard ie. is this the second card flipped
    if (activeCards === 2) {

      if (imgSrcShuffled[firstCardFlipped.id] === imgSrcShuffled[card.id]) {
        // a match occurred
        card.classList.add('match');
        card.classList.toggle('anim');
        const first = document.getElementById(firstCardFlipped.id);
        first.classList.add('match');
        card.classList.toggle('anim');
        firstCardFlipped = undefined;

        if (isEndOfGame()) {
          setTimeout(() => {
            form.innerText = 'Start';
            gameState.inProgress = false;
          }, 500);

        } else { firstCardFlipped = undefined; activeCards = 0; }
      } else {
        setTimeout(() => {
          unFlipCard(card);
          unFlipCard(firstCardFlipped);
          firstCardFlipped = undefined;
          activeCards = 0;

        }, 1000);

        return;
      }

    } else {

      firstCardFlipped = card;

    }
  }


}




function isCardOff(card) {
  if (card.classList.contains('off')) return true;
  return false;
}


function isEndOfGame() {

  for (let card of document.querySelectorAll('.card')) {
    if (card.classList.contains('off')) return false;
  }
  return true;
}

function resetBoard() {
  const cards = document.querySelectorAll('.card');
  let count = 0;
  for (let card of cards) {
    count++;
    setTimeout(() => {
      card.remove();
    }, PAINT_TIME * count);
  }

}
// returns a randompage number to retrieve images from
async function getRandomPageNumber() {
  return Math.floor(Math.random() * (90 - 1) + 1);
}

async function fetchApiLinks(num, page) {
  gameState.fetching = true;

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
    gameState.fetching = false;
    console.log(error);
  }


}
async function fetchImageIds(array) {
  let outPut = [];
  for (const link of array) {
    try {
      const response = await fetch(`${link}/?fields=image_id`);
      const json = await response.json();
      const result = await json;

      outPut.push(`https://www.artic.edu/iiif/2/${result.data.image_id}/full/200,/0/default.jpg`);
    } catch (error) {
      console.log(error);
      gameState.fetching = false;
    }


  }
  gameState.fetching = false;
  return outPut;
}



// }
// get list of ids, object will have an api field, uae that to get image id
// https://api.artic.edu/api/v1/artworks/search?query[term][is_public_domain]=true&fields=api_link&limit=30

// get list of image ids
// https://api.artic.edu/api/v1/artworks/102611/?fields=image_id

// get image url
// https://www.artic.edu/iiif/2/4dd78841-4237-9e49-76ec-136fbfa0b0a7/full/200,/0/default.jpg
