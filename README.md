# UnoPlayingBot
REQUIRES NODE.JS - https://nodejs.org/

simple node.js program to play Uno and gather stats

Rapidly plays Uno, prints out some metrics about the games played when finished, also prints turns while they happen if "verbose" is true

# to use:

simply put all of the files in the same directory, edit the settings to your liking, and run run.bat

# settings:

players - number of players

stackDrawCards - allows players to play a "draw two" or "draw four" on top of another, next player must stack another or draw 2 * card amount

accumulate - if true, will pick up cards until a player can go when they don't have a move, rather than just one

adjustCardsForFrequency - will divide relevant numbers of cards by how many cards of that type are in the deck in the output

verbose - if true, will log all moves to the console & set totallySilent to false

totallySilent - if false, will log end of game info to the console after every game

gamesToPlay - number of games to play

secPerTurn - how many seconds a turn take for reasons of tracking how long games take in the output

secPerAccumulation - how many seconds it takes to "accumulate" one card, will add time if higher
