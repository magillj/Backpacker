// Draws x cards from the top of cards and returns the list of those cards
// If there are less than x cards, logs error and returns all cards
function draw(cards, x) {
  var outCards = [];
  if (cards.length < x) {
    console.error("Trying to draw " + x + " cards, only " + cards.length);
    outCards = cards.slice();
    cards = [];
  } else {
    for (var i = 0; i < x; i++) {
      outCards.push(cards.pop());
    }
  }
  return outCards;
}

// [TEMPORARY] Returns a sample of cards that could be used
function getExampleCards() {
  var cards = [];
  for (var i = 0; i < 10; i++) {
    cards.push(new CountryCard("PLACEHOLDER",40,CONTINENTS.ANTARCTICA,[BONUSES.TREKKING]));
  }
  cards.push(new CountryCard("Mongolia", 100, CONTINENTS.ASIA,
                           [BONUSES.CULTURE, BONUSES.WILDLIFE]));
	cards.push(new CountryCard("Egypt", 100, CONTINENTS.AFRICA, 
                             [BONUSES.CULTURE, BONUSES.WILDLIFE]));
	cards.push(new CountryCard("Vietnam", 40, CONTINENTS.ASIA, 
                           [BONUSES.CULTURE, BONUSES.WILDLIFE]));
  cards.push(new CountryCard("Peru", 80, CONTINENTS.SOUTHAMERICA, 
                           [BONUSES.CULTURE, BONUSES.TREKKING]));
  cards.push(new CountryCard("USA", 20, CONTINENTS.NORTHAMERICA, 
                           [BONUSES.CULTURE, BONUSES.BEACH]));
  cards.push(new BonusCard(BONUSES.CULTURE));
  cards.push(new BonusCard(BONUSES.BEACH));
  cards.push(new BonusCard(BONUSES.WILDLIFE));
  cards.push(new BonusCard(BONUSES.TREKKING));
  return cards;
}

// Returns a random integer between min (included) and max (excluded)
// Using Math.round() will give you a non-uniform distribution!
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

// Handles errors that users shouldn't be able to create
function handleError(message) {
  console.error("[Error] " + message);
}

// Takes a list of cards and puts them in random order
function shuffle(cards) {
  var j, x, i;
    for (i = cards.length; i; i -= 1) {
        j = Math.floor(Math.random() * i);
        x = cards[i - 1];
        cards[i - 1] = cards[j];
        cards[j] = x;
    }
}

// Informs the user of an action that they cannot perform
function invalidUserAction(message) {
  // TODO: Have a place in the DOM for error text like this
  alert(message);
}