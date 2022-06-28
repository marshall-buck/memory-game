"use strict";

/** Memory game: find matching pairs of cards and flip both of them. */

const FOUND_MATCH_WAIT_MSECS = 1000;
// const COLORS = [
//   "red", "blue", "green", "orange", "purple",
//   "red", "blue", "green", "orange", "purple",
// ];
const NOTES = [
  "♩", "♪", "♫", "♬", "♭",
  "♮", "♯", "𝄞", "𝄡", "𝄢", "𝄪", "𝄫", "♩", "♪", "♫", "♬", "♭",
  "♮", "♯", "𝄞", "𝄡", "𝄢", "𝄪", "𝄫"
];

const notes = shuffle(NOTES);

createCards(notes);

let firstCardFlipped;
let activeCards = 0;
let gameState = { notStarted: true, inProgress: false, ended: false };

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

function createCards(colors) {
  const gameBoard = document.getElementById("game");
  let count = 0;
  for (let color of colors) {
    const card = document.createElement('div');
    card.classList = 'card off';
    card.id = count++;

    card.addEventListener('click', handleCardClick);
    gameBoard.append(card);

  }
}

/** Flip a card face-up.
 *make sure only one other card is 'on'
 */

function flipCard(card) {
  const index = card.id;
  const p = document.createElement('p');
  p.innerText = notes[index];
  card.append(p);

  card.classList.toggle('off');

  activeCards++;
}

/** Flip a card face-down.
 the only time the card is un-flipped dis when there is no match
 */

function unFlipCard(card) {
  card.classList.toggle('off');
  const p = card.firstChild;
  card.removeChild(p);
}

/** Handle clicking on a card: this could be first-card or second-card. */

function handleCardClick(evt) {
  const card = evt.target;
  if (!isCardOff(card) || activeCards === 2) {
    return;
  }
  else {
    flipCard(card);

    //  is there a currentCard ie. is this the second card flipped
    if (activeCards === 2) {

      if (notes[firstCardFlipped.id] === notes[card.id]) {
        // a match occurred
        card.classList.add('match');
        const first = document.getElementById(firstCardFlipped.id);
        first.classList.add('match');
        firstCardFlipped = undefined;

        if (isEndOfGame()) {
          setTimeout(() => {
            window.alert('You win');
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


// function returnAllCards() {
//   return document.querySelectorAll('.card');
// }

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
