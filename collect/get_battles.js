// collect/get_battles.js
// Michael McKinley

// ----
// Collects a list of battles.
// Requires the data/player_tags.txt file to be populated by collect/get_battles.txt
// ----

const axios = require('axios'); // API calls
const fs = require('fs');       // File reading

// .env to keep API key private
require('dotenv').config();
const API_KEY = process.env.API_KEY;


// Read the player tags file synchronously
const unfilteredPlayerTags = fs.readFileSync('data/player_tags.txt', 'utf8');

// Split the file contents into an array of player tags
const playerTags = unfilteredPlayerTags.split('\n').filter(tag => tag.trim() !== '');

// Modify the requests

const SHOULD_RESET_FILE = false;
const START_AT = 0;                 // the player tag index at which to begin requesting 
const NUM_REQUESTS_TO_MAKE = 5950;  // number of requests to make
const MS_BETWEEN_REQUESTS = 400;    // milliseconds between requests


if (SHOULD_RESET_FILE) {
  fs.writeFile('./data/battles.txt', '', (err) => {
    if (err) { console.log(err) }
  })
  fs.writeFile('./data/api_call_summary.txt', '', (err) => {
    if (err) { console.log(err) }
  })
  console.log('Dataset cleared.')
}

// Write a message in the info file indicating which player tags are being requested
appendTextToFile('* player tags ' + START_AT + ' - ' + (START_AT + NUM_REQUESTS_TO_MAKE) + '\n', './data/api_call_summary.txt');

var battleRequestInterval;
var index = START_AT;
var numRequestsMade = 0;

function updateBattleRequestInterval(){
  index++;
  numRequestsMade++;

  if (numRequestsMade == NUM_REQUESTS_TO_MAKE) {
    console.log("Complete.");
    clearInterval(battleRequestInterval);
  }
}

battleRequestInterval = setInterval(function() {
  axios({
    method: 'get',
    url: `https://api.brawlstars.com/v1/players/%23${playerTags[index]}/battlelog`,
    headers: {
       'Authorization': `Bearer ${API_KEY}`
    }
  })
  .then(response => {
    //console.log(`${index}`);
    const playerTag = '#'+playerTags[index];

    var convertedData = convertBattleLogToData(response.data, playerTag);
    appendTextToFile(convertedData.battles, './data/battles.txt');
    //appendTextToFile(convertedData.info + convertedData.messages.join('\n') + '\n', './data/api_call_summary.txt');

    updateBattleRequestInterval();

  }).catch(error => {
    console.error(error);
    console.log('Error when requesting player at ' + index);
    // appendTextToFile('ERROR\n', './data/api_call_summary.txt');
    updateBattleRequestInterval();

    // clearInterval(battleRequestInterval);
  }); 
}, MS_BETWEEN_REQUESTS);



// CONVERT BATTLE LOG TO DATA

// arguments:
//  - battlelog:           a json object representing a player's battle log.
//  - playerTag (string): the player tag of the person whose battle log we are requesting (used to identify duplicates)

// returns an object with three keys:
//  - battles (string)
//  - info (string)
//  - message: array<string>

// functionalities:
//    - Assigns weights to each battle which indicate the statistical important of each battle.
//          we expect high trophy players to beat low trophy players.
//          thus, when a low trophy player beats a high trophy player, we consider that datapoint
//          to be highly meaningful.


function convertBattleLogToData(battlelog, playerTag) {
  var battles = [];
  var messages = [];

  // the first or second match may have no star player, due to the nature of power league.
  //     we will have to skip these matches.
  // note: this condition is inadvertently activated for modes with no star player like showdown, boss fight etc
  //    however, this creates no problems because those modes are skipped anwyays.
  var startIndex = 0;
  if (battlelog.items[0].battle.starPlayer == null) {
    startIndex++;
    if (battlelog.items[1].battle.starPlayer == null) {
      startIndex++;
    }
  }

  // iterate over each match in the battle log
  for (var i = startIndex; i < battlelog.items.length; i++) {
    // 1 - the type must be ranked, soloRanked, teamRanked
    const match = battlelog.items[i];

    const matchType = match.battle.type;

    var failConditions = [
      match.event.mode == "soloShowdown",
      match.event.mode == "duoShowdown",
      match.event.mode == "duels",
      match.event.mode == "unknown",
      matchType != "ranked", // &&
      //  matchType != "soloRanked" &&      Because ranked modifiers produce such unpredictable outcomes, we must 
      //  matchType != "teamRanked",        sadly disregard ranked games.
      !match.battle.mode,
      !match.event.map,
      match.battle.result == "draw",
    ];

    // Sometimes the teams property is undefined. Not sure why. Either way,
    //    this match is irrelevant to us.
    // Also, ignore any modes that aren't 3v3
    if (!match.battle.teams || match.battle.teams[0].length != 3) {
      messages.push('    ' + i + ': teams undefined (5v5/duels)')
      continue;
    }

    // if any of the conditions fail, skip to the next battle
    var fail = failConditions.some(condition => condition === true);

    if (fail) {
      messages.push('    ' + i + ': invalid mode/map/match results')
      continue;
    }


    // Ignore the match if the difference in trophies between highest and lowest is too great.
    const MAX_ACCEPTED_TROPHY_GAP = 250;
    // Ignore the match if the max trophies is too low
    const MIN_ACCEPTED_MAX_TROPHIES = 600; 

    if (matchType == "ranked") {
      var leftTeam = match.battle.teams[0];
      var rightTeam = match.battle.teams[1];
      var leftTeamHighest = 0;
      var rightTeamHighest = 0

      for (var k = 0; k < 3; k++) {
        if (leftTeamHighest < leftTeam[k].brawler.trophies) {
          leftTeamHighest = leftTeam[k].brawler.trophies;
        }
        if (rightTeamHighest < rightTeam[k].brawler.trophies) {
          rightTeamHighest  = rightTeam[k].brawler.trophies;
        }
      }

      if (Math.abs(leftTeamHighest - rightTeamHighest) > MAX_ACCEPTED_TROPHY_GAP) {
        messages.push('    ' + i + `: SKIP - trophy gap too great (${leftTeamHighest} - ${rightTeamHighest})`);
        continue;
      } else if (leftTeamHighest < MIN_ACCEPTED_MAX_TROPHIES || rightTeamHighest < MIN_ACCEPTED_MAX_TROPHIES) {
        messages.push('    ' + i + `: SKIP - trophies too low (${leftTeamHighest} / ${rightTeamHighest})`);
        continue;
      }
    }

    // necessary to later identify duplicate battles. these have to carry over
    // between iterations, because not all battles have star players (ranked mode.)
    var starPlayer;
    // Determine star player (same as previous if null)
    if (match.battle.starPlayer) {
      starPlayer = match.battle.starPlayer.tag;
    }

    // Determine wether or not the team on the right won
    const teamOnLeft = match.battle.teams[0];
    const teamOnRight = match.battle.teams[1];

    const playerDidWin = (match.battle.result == "victory");
    const playerIsOnRight = (teamOnRight[0].tag == playerTag || teamOnRight[1].tag == playerTag || teamOnRight[2].tag == playerTag);

    const teamOnRightDidWin = (playerDidWin == playerIsOnRight);

    // Finally, add the battle to the battles array
    battles.push(
      [
        match.battleTime,               // 0 - the battle time
        starPlayer,                     // 1 - the star player's id
        match.event.mode,               // 2 - game mode
        match.event.map,                // 3 - map

        teamOnLeft[0].brawler.name,      // 4, 5, 6 - the names of the brawlers
        teamOnLeft[1].brawler.name,      //           on the left team
        teamOnLeft[2].brawler.name,

        teamOnRight[0].brawler.name,    // 7, 8, 9 - the names of the brawlers
        teamOnRight[1].brawler.name,    //           on the right team
        teamOnRight[2].brawler.name,

        teamOnRightDidWin ? 'right' : 'left',   // 10 - whether left or right won.

        // the following bits of data are used by the model to calculate weights.
        
        teamOnLeft[0].brawler.trophies,    
        teamOnLeft[1].brawler.trophies, 
        teamOnLeft[2].brawler.trophies,

        teamOnRight[0].brawler.trophies,
        teamOnRight[1].brawler.trophies,
        teamOnRight[2].brawler.trophies,
      ].join(",")
    ); 
    messages.push('    ' + i + ': ok')
  }
  
  if (battles.length == 0) {
    return {
      battles: '',
      info: index + ' ' + playerTag + ': 0 battles\n',
      messages: messages
    };
  } else {
    return { 
      battles: battles.join('\n') + '\n',
      info: index + ' ' + playerTag + ': ' + battles.length + ' battles\n',
      messages: messages
    };
  }
}

function calculateMatchWeight () {

}

function appendTextToFile(data, file){
  fs.appendFile(file, data, 'utf8', (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });
}
