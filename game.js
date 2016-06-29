// This has a lot of work to be done. Working on it in phases.
// One of the phases will be cleaning it all up and making it stylistically pleasing
/*
 * Phase 1: Get basic game engine working (complete)
 *    -  1.1: Be able to play country cards
 *    -  1.2: Be able to play bonus cards
 *    -  1.3: Be able to go home and score points (unless you have grey cards)
 *    -  1.4: Debug UI
 * Phase 2: Setup multiplayer platform
 *    -  2.1: Have one game instance players can join
 *    -  2.2: Have players be able to play in that instance
 *    -  2.3: Build the player UI
 * 
 * Phase 3: Add in the rest of the cards
 *    -  3.1: Bad advice cards
 *    -  3.2: Good advice cards
 *    -  3.3: Pink cards (except Under the Influence)
 *    -  3.4: Orange cards
 *    -  3.5: Yellow cards (except Near Miss and Follow the Trail)
 *    -  3.6: Near Miss, Follow the train
 *    -  3.7: Under the influence
 * 
 * Currently working on: 2.1
 */



////////////////// Class/Constants Definitions ///////////////////
const CONTINENTS = {
  NORTHAMERICA: 0,
  ASIA: 1,
  AFRICA: 2,
  SOUTHAMERICA: 3,
  ISLANDS: 4,
  ANTARCTICA: 5,
}

const BONUSES = {
  BEACH: "Beach Bonus",
  CULTURE: "Culture Bonus",
  WILDLIFE: "Wildlife Bonus",
  TREKKING: "Trekking Bonus",
}

const PLAYER_ACTIONS = {
  GO_HOME: 0,
  PLAY_CARD: 1,
  DISCARD: 2,
}

const HAND_SIZE = 5;

// Creates a card with a title, type, and play function
// playFunc should be formatted as playFunc(gamestate, sourceId, targetId) and returns
//   true if the card was successfully played, false otherwise
function Card(title, playFunc) {
  this.title = title;
  
  if (playFunc === undefined) {
      this.play = function() {
        alert("Playing " + this.title);
      };
  } else {
    this.play = playFunc;
  }
}

// Default should be to not pass in a playFunc
function CountryCard(title, value, continent, bonuses, playFunc) {
  this.continent = continent;
  this.bonuses = bonuses;
  this.value = value;

  if (!playFunc) {
    playFunc = function(gamestate, playerId) {
      var player = gamestate.players[playerId];
      for (var i = 0; i < player.presentPile.length; i++) {
        if (player.presentPile[i].continent == this.continent) {
          invalidUserAction("Cannot play two countries of the same continent");
          return false;
        }
      }
      player.presentPile.push(player.hand.splice(player.hand.indexOf(this), 1)[0]);
      return true;
    }
  }
  Card.call(this, title, playFunc);
} 
CountryCard.prototype = Object.create(Card.prototype);
CountryCard.prototype.constructor = CountryCard;

function BonusCard(type, playFunc) {
  this.bonusType = type;

  if (!playFunc) {
    playFunc = function(gamestate, playerId) {
      var player = gamestate.players[playerId];
      // Find the country on the top of the pile
      for (var i = player.presentPile.length - 1; i >= 0; i--) {
        if (player.presentPile[i] instanceof CountryCard) {
          // We've found the top country. Before we push the bonus, ensure the country
          // supports this bonus type
          if (player.presentPile[i].bonuses.indexOf(this.bonusType) >= 0) {
            player.presentPile.push(player.hand.splice(player.hand.indexOf(this), 1)[0]);
            return true;
          } else {
            invalidUserAction("Country must support this type of bonus");
            return false;
          }
        }
      }
      invalidUserAction("No country cards in present pile");
      return false;
    }
  }
  Card.call(this, type + "", playFunc);
}
BonusCard.prototype = Object.create(Card.prototype);
BonusCard.prototype.constructor = BonusCard;

function GreyCard(title, playFunc) {
  Card.call(this, title, playFunc);
}
GreyCard.prototype = Object.create(Card.prototype);
GreyCard.prototype.constructor = GreyCard;

// Represents what the play is doing during a turn. Essentially just a wrapper
// card and target are optional parameters
function PlayerAction(action, card, target) {
  this.action = action;
  this.card = card;
  this.target = target;
}

// Represents one player
function Player(startHand, id) {
  this.id = id;
  this.points = 0;
  this.hand = startHand;
  this.presentPile = [];
}
Player.prototype.addCardToHand = function(card) {
	if (card === undefined) {
		Console.error("Card being pushed to player " + id + " is undefined");
	}
	this.hand.push(card);
}

function GameState(numPlayers) {
  this.numPlayers = numPlayers;
  this.players = [];
  this.futurePile = [];
  this.pastPile = [];
  this.currentPlayer = 0; //TODO: Randomize
  
  // TODO: Init the futurePile based off a configuration file containing cards
  this.futurePile = getExampleCards();
  shuffle(this.futurePile);

  // Initialize players
  for (var i = 0; i < this.numPlayers; i++) {
    var player = new Player(draw(this.futurePile, HAND_SIZE), i);
    this.players.push(player);
  }
}
GameState.prototype.getCurrPlayersCardAt = function(cardIndex) {
	return this.players[this.currentPlayer].hand[cardIndex];
}
GameState.prototype.playerMove = function(playerAction) {
	if (this.nextPlayerTurn(playerAction)) {
		var player = this.players[this.currentPlayer];
		// Make sure they end their turn with 5 cards
		if (player.hand.length > 5) {
			handleError("Player " + this.currentPlayer + " has too many cards");
		} else {
			var newCards = draw(this.futurePile, 5 - player.hand.length);
			player.hand = player.hand.concat(newCards);
		}
		// It's now the next player turn
		this.currentPlayer++;
		if (this.currentPlayer == this.numPlayers) {
			this.currentPlayer = 0;
		}

		if (this.futurePile.length === 0) {
			console.log("Game over!");
			// TODO: Game over
		}
	}
}
GameState.prototype.nextPlayerTurn = function(playerAction) {
	var player = this.players[this.currentPlayer];
	if (playerAction.action == PLAYER_ACTIONS.GO_HOME) {
		// Ensure the player has no grey cards in their hand
		for (var i = 0; i < player.hand.length; i++) {
			if (player.hand[i] instanceof GreyCard) {
				invalidUserAction("Cannot go home with Grey cards in your hand");
				return false;
			}
		}
		// We know they can go home. Tally up their points
		var continents = new Set();
		var points = 0;
		var lastCountryVal = 0;
		for (var j = 0; j < player.presentPile.length; j++) {
			var card = player.presentPile[j];
			if (card instanceof CountryCard) {
				continents.add(card.continent);
				points += card.value;
				lastCountryVal = card.value;
			} else if (card instanceof BonusCard) {
				points += lastCountryVal;
			} else {
				handleError("Invalid card found at index " + j + 
										"in present pile of player " + player.id)
				return false;
			}
		}
		if (continents.size >= 5) {
			points += 200;
		}
		// Update player object
		player.points += points;
		this.pastPile = this.pastPile.concat(player.presentPile);
		player.presentPile = [];
	} else if (playerAction.action == PLAYER_ACTIONS.PLAY_CARD) {
		return playerAction.card.play(this, player.id, playerAction.target);
	} else if (playerAction.action == PLAYER_ACTIONS.DISCARD) {
		if (playerAction.card instanceof GreyCard) {
			invalidUserAction("Cannot discard grey cards");
			return false;
		}
		// Discard the played card
		this.pastpile.push(player.hand.splice(player.hand.indexOf(playerAction.card),1)[0]);
	} else {
		handleError("Unrecognized user action");
		return false;
	}
	return true;
}


////////////////// Game Setup ///////////////////

// TODO: This needs to be protected so people can't cheat by bringing it up
function updateDebugView(gamestate) {
  $("#debug_view").html("");
  $("#debug_view").append($("<h3>Debug View</h3>"));
  $("#debug_view").append(getCardsDebugElem("Past Pile", gamestate.pastPile));
  $("#debug_view").append(getCardsDebugElem("Future Pile", gamestate.futurePile));
  $("#debug_view").append($("<div>Current Player's Id: " + gamestate.currentPlayer + "</div>"));
  for (var i = 0; i < gamestate.players.length; i++) {
    var playerDiv = $("<div>");
    playerDiv.append("<h5>Player " + gamestate.players[i].id + "</h5>");
    playerDiv.append(getCardsDebugElem("Hand", gamestate.players[i].hand));
    playerDiv.append(getCardsDebugElem("Present Pile", gamestate.players[i].presentPile));
    playerDiv.append("<div>Points: " + gamestate.players[i].points);
    $("#debug_view").append(playerDiv);
  }

}

// Gets the element used to show these cards in the debug view
function getCardsDebugElem(title, cards) {
  var innerHtml = title + ": ";
  for (var j = 0; j < cards.length; j++) {
    innerHtml += "[" + cards[j].title + "]";
  }
  return $("<div>").html(innerHtml);
}

window.onload = function() {
	var masterGameState = new GameState(3);
	
  $("#go_home").click(function() {
    masterGameState.playerMove(new PlayerAction(PLAYER_ACTIONS.GO_HOME));
    updateDebugView(masterGameState);
  });

  $("#play_card").click(function() {
    masterGameState.playerMove(new PlayerAction(PLAYER_ACTIONS.PLAY_CARD, 
                            masterGameState.getCurrPlayersCardAt($("#card_select").val())));
    updateDebugView(masterGameState);
  });

  updateDebugView(masterGameState);
}