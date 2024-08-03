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


// INFORMATION

// allDatasetInfo: an array of objects stored in data/datasets/info.json. This contains information on each dataset.
var allDatasetsInfo = JSON.parse(fs.readFileSync('data/datasets/info.json', 'utf8'))

// playerTags: an array of player tags stored in data/player_tags.json. 
const playerTags = JSON.parse(fs.readFileSync('data/player_tags.json', 'utf8'))


// const SHOULD_RESET_FILE = false;
const START_AT = 0;                 // the player tag index at which to begin requesting 
const NUM_REQUESTS_TO_MAKE = playerTags.length - START_AT;    // number of requests to make
var   timeBetweenRequests = 400;    // milliseconds between requests
const REQUEST_BETWEEN_SAVING = 500;   // how frequently to save data to the file (in case of a crash/cancellation)

// Important global variables
var battleRequestInterval;          // timed loop which sends the requests
var index = START_AT;               // index of the request
var numRequestsMade = 0;            // number of requests made during this call session
var battles = []                 // list containing data on all battles

// Write a message in the info file indicating which player tags are being requested
// appendTextToFile('* player tags ' + START_AT + ' - ' + (START_AT + NUM_REQUESTS_TO_MAKE) + '\n', './data/api_call_summary.txt');

// INFO FILE

// Create a unique file name. This keeps the dataset seperated across multiple files.
// This means if corrupted data is collected, it does not affect other healthy datasets. 
function getTimeOfCollection() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}
const TIME_OF_COLLECTION = getTimeOfCollection()
const PATH_TO_BATTLES_FILE = 'data/datasets/' + TIME_OF_COLLECTION;

// Create a file with the given name.
writeTextToFile('', PATH_TO_BATTLES_FILE)

// This will be modified.
allDatasetsInfo.push({
  filename: PATH_TO_BATTLES_FILE,
  timeOfCollection: TIME_OF_COLLECTION,
  indexOfFirstPlayerTag: START_AT
})

// updateBattleRequestInterval
// - Increment the index variables
// - Periodically save the data
// - Save the data upon completion
function updateBattleRequestInterval(){
  index++;
  numRequestsMade++;

  if (numRequestsMade % REQUEST_BETWEEN_SAVING == 0){
    writeTextToFile(JSON.stringify(battles), PATH_TO_BATTLES_FILE)


    info = allDatasetsInfo.pop()
    info['numberOfBattles'] = numRequestsMade
    allDatasetsInfo.push(info)
    writeTextToFile(JSON.stringify(allDatasetsInfo), 'data/datasets/info.json')
    
    console.log('Data saved @ index', index)
  }

  if (numRequestsMade == NUM_REQUESTS_TO_MAKE) {
    clearInterval(battleRequestInterval);
    writeTextToFile(JSON.stringify(battles), PATH_TO_BATTLES_FILE)


    info = allDatasetsInfo.pop()
    info['numberOfBattles'] = numRequestsMade
    allDatasetsInfo.push(info)
    writeTextToFile(JSON.stringify(allDatasetsInfo), 'data/datasets/info.json')

    console.log("Complete.");
  }
}



// Make the requests
battleRequestInterval = setInterval(function() {
  axios({
    method: 'get',
    url: `https://api.brawlstars.com/v1/players/%23${playerTags[index]}/battlelog`,
    headers: {
       'Authorization': `Bearer ${API_KEY}`
    }
  })
  .then(response => {
    const playerTag = '#'+playerTags[index];

    var convertedData = convertBattleLogToData(response.data, playerTag);
    battles.push(...convertedData.battles)
    appendTextToFile(convertedData.info + convertedData.messages.join('\n') + '\n', './data/api_call_summary.txt');

    updateBattleRequestInterval();

  }).catch(error => {
    //console.error(error);
    console.log('Error occured when requesting player at ' + index);
    if (error.response && error.response.data && error.response.data.reason == 'notFound'){
      console.log(`${index} not found`)
    } else if (error.response && error.response.data && error.response.data.reason == 'API at maximum capacity, request throttled.'){
      console.log(`${index} request throttled`)
    } else {
      console.error(error)
    }
    updateBattleRequestInterval();
  });
}, timeBetweenRequests);

// CONVERT BATTLE LOG TO DATA

// arguments:
//  - battlelog:           a json object representing a player's battle log.
//  - playerTag (string): the player tag of the person whose battle log we are requesting (used to identify duplicates)

// returns an object with three keys:
//  - battles (array of strings and numbers)
//  - info (string)
//  - message: array<string>


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
      match.event.mode == "paintBrawl",
      matchType != "ranked",   // Trophy ladder
      //  matchType != "soloRanked", // Power League
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
    const MAX_ACCEPTED_TROPHY_GAP = 400;
    // Ignore the match if the max trophies is too low
    const MIN_ACCEPTED_MAX_TROPHIES = 500; 

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

        teamOnLeft[0].brawler.id - 16000000,      // 4, 5, 6 - the IDs of the brawlers
        teamOnLeft[1].brawler.id - 16000000,      //           on the left team
        teamOnLeft[2].brawler.id - 16000000,

        teamOnRight[0].brawler.id - 16000000,    // 7, 8, 9 - the IDs of the brawlers
        teamOnRight[1].brawler.id - 16000000,    //           on the right team
        teamOnRight[2].brawler.id - 16000000,

        teamOnRightDidWin ? 1 : 0,               // 10 - 1 if team on right won, 0 if left team won.

        // the following bits of data are used by the model to calculate weights.
        
        teamOnLeft[0].brawler.trophies,    
        teamOnLeft[1].brawler.trophies, 
        teamOnLeft[2].brawler.trophies,

        teamOnRight[0].brawler.trophies,
        teamOnRight[1].brawler.trophies,
        teamOnRight[2].brawler.trophies,
      ]
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
      battles: battles,
      info: index + ' ' + playerTag + ': ' + battles.length + ' battles\n',
      messages: messages
    };
  }
}

function appendTextToFile(data, file){
  fs.appendFile(file, data, 'utf8', (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });
}

function writeTextToFile(text, file){
  fs.writeFile(file, text, 'utf8', (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });
}