// collect/get_battles.js
// Michael McKinley

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

const SHOULD_RESET_FILE = true;
const START_AT = 0;              // the player tag index at which ti begin requesting 
const NUM_REQUESTS_TO_MAKE = 5;  // number of requests to make
const MS_BETWEEN_REQUESTS = 700; // milliseconds between requests

var index = START_AT - 1;
var numRequestsMade = 0;

if (SHOULD_RESET_FILE) {
  fs.writeFile('./data/battles_unfiltered.txt', '', (err) => {
    if (err) { console.log(err) }
  })
  fs.writeFile('./data/battle_log_information.txt', '', (err) => {
    if (err) { console.log(err) }
  })
  console.log('Dataset cleared.')
}

var battleRequestInterval = setInterval(function() {
  index++;
  numRequestsMade++;

  if (numRequestsMade == NUM_REQUESTS_TO_MAKE) {
    console.log("Complete.");
    clearInterval(battleRequestInterval);
  }

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
    appendDataToFile(convertedData.battles, './data/battles_unfiltered.txt');
    appendDataToFile(convertedData.info, './data/battle_log_information.txt');

      
  }).catch(error => {
    console.log("ERROR");
    console.error(error);
    clearInterval(battleRequestInterval);
  }); 
}, MS_BETWEEN_REQUESTS);



// CONVERT BATTLE LOG TO DATA

// arguments:
//  - battlelog:           a json object representing a player's battle log.
//  - playerTag (string): the player tag of the person whose battle log we are requesting (used to identify duplicates)

// returns an object with two keys:
//  - battles (string):  
//  - info (strings)

function convertBattleLogToData(battlelog, playerTag) {
  var battles = [];

  // the first or second match may have no star player, due to the nature of power league.
  //     we will have to skip these matches.
  // note: this condition is activated more than intended: it is also triggered for modes with no star player like showdown, boss fight etc
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
      matchType != "ranked" &&
        matchType != "soloRanked" &&
        matchType != "teamRanked",
      !match.battle.mode,
      !match.event.map,
      match.battle.result == "draw",
    ];

    // Sometimes the teams property is undefined. Not sure why. Either way,
    //    this match is irrelevant to us.
    // Also, ignore any modes that aren't 3v3
    if (!match.battle.teams || match.battle.teams[0].length != 3) {
      continue;
    }

    // if any of the conditions fail, skip to the next battle
    var fail = failConditions.some(condition => condition === true);

    if (fail) {
      continue;
    }


    // Ignore the match if it is too low trophies.
    if (matchType == "ranked") {
      var highestTrophies = 0;
      for (var j = 0; j < 2; j++) {
        for (var k = 0; k < 3; k++) {
          const playerTrophies = match.battle.teams[j][k].brawler.trophies;

          if (playerTrophies > highestTrophies) {
            highestTrophies = playerTrophies;
          }
        }
      }

      if (highestTrophies < 600) {
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

    var teamOnRightDidWin = (playerDidWin == playerIsOnRight);
    
   //  console.log(' - ', teamOnRight[0].tag, ' ', teamOnRight[1].tag, ' ', teamOnRight[2].tag);
   //  console.log(' - ', teamOnRight[0].brawler.name, ' ', teamOnRight[1].brawler.name, ' ', teamOnRight[2].brawler.name);

   //  console.log(' - ', playerIsOnRight ? 'right' : 'left');


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
      ].join(",")
    ); 
  }
  
  if (battles.length == 0) {
    return {
      battles: '',
      info: index + ' ' + playerTag + ': 0 battles\n'
    };
  } else {
    return { 
      battles: battles.join('\n') + '\n',
      info: index + ' ' + playerTag + ': ' + battles.length + ' battles\n'
    };
  }
}



function appendDataToFile(data, file){
  fs.appendFile(file, data, 'utf8', (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });
}
