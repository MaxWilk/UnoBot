var fs = require('fs');

var start = new Date();

/***** EDIT THESE VALUES *****/

var players = 2;
var stackDrawCards = true;
var accumulate = true;
var adjustCardsForFrequency = false;
var verbose = true;
var totallySilent = false;
var gamesToPlay = 1;

//TIME CONSTANTS
var secPerTurn = 5;
var secPerAccumulation = 1;

/***** END EDIT SECTION *****/

try {  

    var data = fs.readFileSync('settings.cfg', 'utf8');
    var dataStr = data.toString();

    var lines = data.split('\n');

    players = parseInt(getValueFromSettingsLine(lines[0]));
    stackDrawCards = getValueFromSettingsLine(lines[1]) == 'true';
    accumulate = getValueFromSettingsLine(lines[2]) == 'true';
    adjustCardsForFrequency = getValueFromSettingsLine(lines[3]) == 'true';
    verbose = getValueFromSettingsLine(lines[4]) == 'true';
    totallySilent = getValueFromSettingsLine(lines[5]) == 'true';
    gamesToPlay = parseInt(getValueFromSettingsLine(lines[6]));
    secPerTurn = parseFloat(getValueFromSettingsLine(lines[7]));
    secPerAccumulation = parseFloat(getValueFromSettingsLine(lines[8]));

} catch(e) {

    console.log('Error:', e.stack);

}

function getValueFromSettingsLine(line) {
    var rightOfEquals = line.split('=')[1];
    return rightOfEquals.replace(/\s/g, '');
}

class Card {
    //0=red,1=blue,2=yellow,3=green
    //0=reverse,1=skip,2=drawtwo
    //0=wild,1=drawfour
    constructor(color, value, specialType) {
        this.color = color;
        this.value = value;
        this.specialType = specialType;
        this.wildColor = -1;
    }
}

function getCardType(card) {
    var result = "number";
    if (card.color == -1 && card.value == -1) {
        if (card.specialType == 0) {
            result = "wild";
        } else {
            result = "drawfour";
        }
    }
    if (card.color != -1 && card.value == -1) {
        if (card.specialType == 0) {
            result = "reverse";
        } else if (card.specialType == 1) {
            result = "skip";
        } else {
            result = "drawtwo";
        }
    }
    return result;
}

function getCardDetails(card) {
    var result = "";
    if (card.color != -1) {
        switch (card.color) {
            case 0:
                result += "red";
                break;
            case 1:
                result += "blue";
                break;
            case 2:
                result += "yellow";
                break;
            case 3:
                result += "green";
                break;
        }
        if (card.specialType != -1) {
            switch (card.specialType) {
                case 0:
                    result += " reverse";
                    break;
                case 1:
                    result += " skip";
                    break;
                case 2:
                    result += " drawtwo";
                    break;
            }
        }
    }
    if (card.value != -1) {
        result += " " + card.value;
    }
    if (card.color == -1) {
        if (card.specialType == 0) {
            result = "wild";
        } else {
            result = "drawfour";
        }
    }

    return result;
}

function parseStringToCard(string) {
    var result = new Card(-1, -1, -1);
    var earlyBreak = false;
    if (string == "drawfour") {
        result = new Card(-1, -1, 1);
        earlyBreak = true;
    }
    if (string == "wild") {
        result = new Card(-1, -1, 0);
        earlyBreak = true;
    }
    if (earlyBreak) {
        return result;
    }
    var split = string.split(" ");
    var color = split[0];
    var value = split[1];
    switch (color) {
        case "red":
            result.color = 0;
            break;
        case "blue":
            result.color = 1;
            break;
        case "yellow":
            result.color = 2;
            break;
        case "green":
            result.color = 3;
            break;
    }
    switch (value) {
        case "reverse":
            result.specialType = 0;
            earlyBreak = true;
            break;
        case "skip":
            result.specialType = 1;
            earlyBreak = true;
            break;
        case "drawtwo":
            result.specialType = 2;
            earlyBreak = true;
            break;
    }
    if (earlyBreak) {
        return result;
    }
    var numValue = parseInt(value);
    result.value = numValue;
    return result;
}

function getCardFrequency(card) {
    if (card.color != -1 && card.specialType != -1 && card.value == -1) {
        return 2;
    }
    if (card.color == -1) {
        return 4;
    }
    if (card.color != -1 && card.specialType == -1 && card.value != 0) {
        return 2;
    }
    if (card.color != -1 && card.specialType == -1 && card.value == 0) {
        return 1;
    }
    return 1;
}

var eternalDeck = [];

//iterate colors
for (var i = 0; i < 4; i++) {
    //special types
    for (var j = 0; j < 3; j++) {
        eternalDeck.push(new Card(i, -1, j));
        eternalDeck.push(new Card(i, -1, j));
    }
}

//wilds + drawfours
for (var i = 0; i < 4; i++) {
    eternalDeck.push(new Card(-1, -1, 0));
    eternalDeck.push(new Card(-1, -1, 1));
}

//iterate values
for (var i = 0; i < 10; i++) {
    //colors
    for (var j = 0; j < 4; j++) {
        //2 of each
        for (var k = 0; k < 2; k++) {
            eternalDeck.push(new Card(j, i, -1));
            if (i == 0) {
                break;
            }
        }
    }
}

function shuffle(a, times) {
    for (var s = 0; s < times; s++) {
        var j, x, i;
        for (i = a.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = a[i];
            a[i] = a[j];
            a[j] = x;
        }
        return a;
    }
}

function deepCopyDeck(toCopy) {
    var result = [];
    for (var i = 0; i < toCopy.length; i++) {
        var fromCard = toCopy[i];
        result.push(new Card(fromCard.color, fromCard.value, fromCard.specialType));
    }
    return result;
}

function deal() {
    for (var i = 0; i < 7; i++) {
        for (var j = 0; j < players; j++) {
            if (hands[j] == null) {
                hands[j] = [];
            }
            hands[j].push(deck.pop());
        }
    }
}

var hands = [];

var curCard = null;
var discardPile = [];
var reversed = false;
var curPlayer = 0;

var gameOver = false;

var turnCounter = 0;

var curDrawStack = 0;

var curAccumulations = 0;

var totalTurns = 0;
var longestGame = 0;
var shortestGame = Infinity;
var cardsThatEndedAccumulation = [];
var totalWildsPlayed = 0;
var totalDrawFoursPlayed = 0;
var totalAccumulations = 0;

console.log("");

for (var i = 0; i < gamesToPlay; i++) {
    resetAndPlayGame();
}

var cardNameAmountDict = {};

var firstPlace = 0;
var secondPlace = 0;

var firstPlaceName;
var secondPlaceName;

//if (accumulate) {
tallyAccumulationCards();
//}

console.log("");

var averageTurnsPerGame = totalTurns / gamesToPlay;
var totalSec = (totalAccumulations * secPerAccumulation) + (totalTurns * secPerTurn);
var avgSecPerTurn = totalSec / totalTurns;
var avgSecPerGame = avgSecPerTurn * averageTurnsPerGame;
var avgMinPerGame = avgSecPerGame / 60;

console.log("settings - players: " + players + ", accumulate: " + accumulate + ", games: " + gamesToPlay + ".")
console.log("**************************************************************");
console.log("total turns: " + totalTurns + ".")
console.log("average game lasted " + averageTurnsPerGame + " turns, or " + avgMinPerGame + " mins.");
console.log("that's ~" + (averageTurnsPerGame / players) + " rounds.");
console.log("longest game: " + longestGame + " turns (" + ((avgSecPerTurn * longestGame) / 60) + " mins), ~" + (longestGame / players) + " rounds.");
console.log("shortest game: " + shortestGame + " turns, ~" + (shortestGame / players) + " rounds.");
//if (accumulate) {
console.log("most common card to end accumulation was " + firstPlaceName + " at " + firstPlace + " cards." + (adjustCardsForFrequency ? " (adjusted for frequency)" : ""));
console.log("second most common card to end accumulation was " + secondPlaceName + " at " + secondPlace + " cards." + (adjustCardsForFrequency ? " (adjusted for frequency)" : ""));
//}
console.log("total draw 4's played: " + totalDrawFoursPlayed + ".");
console.log("total wilds played: " + totalWildsPlayed + ".");
var end = new Date() - start;
console.info('Execution time: %dms', end);
console.log("**************************************************************");
console.log("");

function tallyAccumulationCards() {
    for (var i = 0; i < cardsThatEndedAccumulation.length; i++) {
        var type = getCardDetails(cardsThatEndedAccumulation[i]);
        if (cardNameAmountDict[type] != undefined) {
            cardNameAmountDict[type]++;
        } else {
            cardNameAmountDict[type] = 1;
        }
    }
    for (var key in cardNameAmountDict) {
        var amount = cardNameAmountDict[key];
        if (adjustCardsForFrequency) {
            amount /= getCardFrequency(parseStringToCard(key));
        }
        //console.log(amount);
        if (amount > firstPlace) {
            firstPlace = amount;
            firstPlaceName = key;
        }
        if (amount < firstPlace && amount > secondPlace) {
            secondPlace = amount;
            secondPlaceName = key;
        }
    }
}

function resetAndPlayGame() {

    if (totallySilent) {
        verbose = false;
    }

    if (verbose) {
        totallySilent = false;
    }

    deck = deepCopyDeck(eternalDeck);
    deck = shuffle(deck, 7);

    hands = [];

    deal();

    curCard = null;
    discardPile = [];
    discardPile.push(deck.pop());
    setCurCard();
    reversed = false;
    curPlayer = 0;

    gameOver = false;

    turnCounter = 0;

    curAccumulations = 0;

    while (!gameOver) {
        playTurn();
        turnCounter++;

        if (turnCounter >= 10000) {
            break;
        }

    }

    if (!totallySilent) {
        console.log("winner: " + curPlayer);
        console.log("game lasted " + turnCounter + " turns, or ~" + (turnCounter / players) + " rounds.")
        console.log("at " + secPerTurn + " sec/turn, that's " + (((secPerAccumulation * curAccumulations) + (secPerTurn * turnCounter)) / 60) + " mins.");
        console.log("");
    }

    if (turnCounter > longestGame) {
        longestGame = turnCounter;
    }

    if (turnCounter < shortestGame) {
        shortestGame = turnCounter;
    }

    totalTurns += turnCounter;

}

//0=red,1=blue,2=yellow,3=green
//0=reverse,1=skip,2=drawtwo
//0=wild,1=drawfour

function playTurn() {

    curDrawStack = 0;

    curPlayer = getNextPlayer(curPlayer);

    hands[curPlayer] = shuffle(hands[curPlayer], 2);

    if (verbose) {
        console.log("player " + curPlayer + " is up, starting with " + hands[curPlayer].length + " cards!");
        console.log("current card is a " + getCardDetails(curCard) + ".");
    }

    var match = getMatchingCard();

    if (match != -1) {

        var card = hands[curPlayer][match];

        if (card.color == -1) {
            if (card.specialType == 0) {
                totalWildsPlayed++;
            } else {
                totalDrawFoursPlayed++;
            }
        }

        playCard(match);

        if (hands[curPlayer].length == 0) {
            //end game
            gameOver = true;
        }

    } else {

        if (accumulate) {

            while (match == -1) {

                if (verbose) {
                    console.log("player " + curPlayer + " is accumulating...");
                }

                drawCards(1);
                curAccumulations++;
                totalAccumulations++;
                match = getMatchingCard();

            }

            cardsThatEndedAccumulation.push(hands[curPlayer][match]);
            //console.log(cardsThatEndedAccumulation.length);
            playCard(match);

        } else {

            if (verbose) {
                console.log("player " + curPlayer + " is drawing...");
            }

            drawCards(1);
            curAccumulations++;
            totalAccumulations++;
            match = getMatchingCard();

            if (match != -1) {
                cardsThatEndedAccumulation.push(hands[curPlayer][match]);
                playCard(match);
            } else {
                if (verbose) {
                    console.log("player " + curPlayer + " is ending their turn with " + hands[curPlayer].length + " cards.");
                    console.log("");
                }
            }

        }

    }

}

function playCard(cardIndex) {

    var matchCard = hands[curPlayer][cardIndex];
    hands[curPlayer].splice(cardIndex, 1)
    discardPile.push(matchCard);
    setCurCard();

    if (curCard.color == -1) {
        curCard.wildColor = getWildColor();
    } else {
        curCard.wildColor = -1;
    }

    if (verbose) {
        console.log("player " + curPlayer + " plays a " + getCardDetails(curCard) + ".");
        console.log("player " + curPlayer + " is ending their turn with " + hands[curPlayer].length + " cards.");
        console.log("");
    }

    if (curCard.specialType == 0 && curCard.color != -1) {
        reversed = !reversed;
    }

    if (curCard.specialType == 1 && curCard.color == -1) {
        curPlayer = getNextPlayer(curPlayer);
        if (stackDrawCards) {
            var drawCard = playerHasDrawCard(curPlayer, 4);
            if (drawCard != -1) {
                if (verbose) {
                    console.log("player " + curPlayer + " is up, starting with " + hands[curPlayer].length + " cards!");
                    console.log("player " + curPlayer + " is stacking a draw 4!");
                }
                curDrawStack += 4;
                playCard(drawCard);
                return;
            }
        }
        if (verbose) {
            console.log("player " + curPlayer + " is up, starting with " + hands[curPlayer].length + " cards!");
            console.log("player " + curPlayer + " is drawing " + (4 + curDrawStack) + "...");
            if (stackDrawCards) {
                console.log("(" + ((curDrawStack / 4) + 1) + " draw 4's.)");
            }
        }
        drawCards(4 + curDrawStack);
        if (verbose) {
            console.log("player " + curPlayer + " is ending their turn with " + hands[curPlayer].length + " cards.");
            console.log("");
        }
    } else if (curCard.specialType == 2 && curCard.color != -1) {
        curPlayer = getNextPlayer(curPlayer);
        if (stackDrawCards) {
            var drawCard = playerHasDrawCard(curPlayer, 2);
            if (drawCard != -1) {
                if (verbose) {
                    console.log("player " + curPlayer + " is up, starting with " + hands[curPlayer].length + " cards!");
                    console.log("player " + curPlayer + " is stacking a draw 2!");
                }
                curDrawStack += 2;
                playCard(drawCard);
                return;
            }
        }
        if (verbose) {
            console.log("player " + curPlayer + " is up, starting with " + hands[curPlayer].length + " cards!");
            console.log("player " + curPlayer + " is drawing " + (2 + curDrawStack) + "...");
            if (stackDrawCards) {
                console.log("(" + ((curDrawStack / 2) + 1) + " draw 2's.)");
            }
        }
        drawCards(2 + curDrawStack);
        if (verbose) {
            console.log("player " + curPlayer + " is ending their turn with " + hands[curPlayer].length + " cards.");
            console.log("");
        }
    }

    if (curCard.specialType == 1 && curCard.color != -1) {
        curPlayer = getNextPlayer(curPlayer);
    }
}

function drawCards(amount) {
    for (var i = 0; i < amount; i++) {
        if (deck.length > 0) {
            hands[curPlayer].push(deck.pop());
        } else {
            var topCard = discardPile.pop();
            deck = shuffle(discardPile, 7);
            discardPile = [topCard];
            hands[curPlayer].push(deck.pop());
        }
    }
}

function getNextPlayer(whoseTurn) {
    if (!reversed) {
        if (whoseTurn == players - 1) {
            return 0;
        } else {
            return whoseTurn + 1;
        }
    } else {
        if (whoseTurn == 0) {
            return players - 1;
        } else {
            return whoseTurn - 1;
        }
    }
}

function getMatchingCard() {

    var matchTo = new Card(curCard.color, curCard.value, curCard.specialType);
    matchTo.wildColor = curCard.wildColor;

    if (matchTo.wildColor != -1) {

        matchTo.color = matchTo.wildColor;
        matchTo.specialType = -1;

        var colStr = "";
        switch (matchTo.color) {
            case 0:
                colStr += "red";
                break;
            case 1:
                colStr += "blue";
                break;
            case 2:
                colStr += "yellow";
                break;
            case 3:
                colStr += "green";
                break;
        }

        if (verbose) {
            console.log("wild is acting as " + colStr + ".");
        }

    }

    var result = -1;
    var matches = [];
    for (var i = 0; i < hands[curPlayer].length; i++) {
        var playerCard = hands[curPlayer][i];
        if (playerCard.color == -1) {
            matches.push(i);
        } else if (playerCard.color == matchTo.color) {
            matches.push(i);
        } else if (playerCard.value == matchTo.value && playerCard.value != -1) {
            matches.push(i);
        } else if (playerCard.specialType == matchTo.specialType && matchTo.specialType != -1) {
            matches.push(i);
        }
    }

    var specs = [];
    var wilds = [];
    var regs = [];

    for (var i = 0; i < matches.length; i++) {
        var card = hands[curPlayer][matches[i]];
        if (card.color == -1) {
            wilds.push(matches[i]);
        } else if (card.specialType != -1) {
            specs.push(matches[i]);
        } else {
            regs.push(matches[i]);
        }
    }

    var ran = Math.random();

    if (ran < 0.4) {
        if (wilds.length > 0 && regs.length <= 1) {
            result = wilds[0];
        } else if (specs.length > 0) {
            result = specs[0];
        } else if (regs.length >= 2) {
            result = regs[0];
        } else if (wilds.length > 0 && regs.length > 1) {
            result = wilds[0];
        } else if (regs.length > 0) {
            result = regs[0];
        }
    } else if (ran >= 0.4 && ran < 0.7) {
        if (specs.length > 0) {
            result = specs[0];
        } else if (wilds.length > 0) {
            result = wilds[0];
        } else if (regs.length > 0) {
            result = regs[0];
        }
    } else {
        if (regs.length > 0) {
            result = regs[0];
        } else if (wilds.length > 0) {
            result = wilds[0];
        } else if (specs.length > 0) {
            result = specs[0];
        }
    }

    return result;
}

function getWildColor() {
    var colorCounts = [];
    for (var i = 0; i < hands[curPlayer].length; i++) {
        var card = hands[curPlayer][i];
        if (card.color != -1) {
            colorCounts[card.color]++;
        }
    }

    var winningColor = Math.floor(Math.random() * 4);
    var highestCount = -1;
    for (var i = 0; i < colorCounts.length; i++) {
        if (colorCounts[i] > highestCount) {
            winningColor = i;
            highestCount = colorCounts[i];
        }
    }

    return winningColor;
}

function setCurCard() {
    curCard = discardPile[discardPile.length - 1];
}

function playerHasDrawCard(player, drawType) {
    var result = -1;
    if (drawType == 2) {
        for (var i = 0; i < hands[player].length; i++) {
            var c = hands[player][i];
            if (c.specialType == 2 && c.color != -1) {
                result = i;
            }
        }
    } else {
        for (var i = 0; i < hands[player].length; i++) {
            var c = hands[player][i];
            if (c.specialType == 1 && c.color == -1) {
                result = i;
            }
        }
    }
    return result;
}
