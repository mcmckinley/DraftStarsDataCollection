// collect/get_battles.js
// Michael McKinley

const axios = require('axios'); // API calls
const fs = require('fs');       // File reading

// .env to keep API key private
require('dotenv').config();
const API_KEY = process.env.API_KEY;


// 1. 
// Clear the battles_unfiltered file
fs.writeFile('./data/battles_unfiltered', '', (err) => {
    if (err) {
        console.log('Could not clear file.')
    } else {
        console.log('data/battles_unfiltered file reset.')
    }
})


// Read the player tags file synchronously
const unfilteredPlayerTags = fs.readFileSync('./data/player_tags', 'utf8');

// Split the file contents into an array of player tags
const playerTags = unfilteredPlayerTags.split('\n').filter(tag => tag.trim() !== '');

// Modify the requests

const START_AT = 0;              // the player tag index at which ti begin requesting 
const NUM_REQUESTS_TO_MAKE = 1;  // number of requests to make
const MS_BETWEEN_REQUESTS = 1000; // milliseconds between requests

var index = START_AT;
var numRequestsMade = 0;

var battleRequestInterval = setInterval(function() {
   axios({
      method: 'get',
      url: `https://api.brawlstars.com/v1/players/%23${playerTags[index]}/battlelog`,
      headers: {
         'Authorization': `Bearer ${API_KEY}`
      }
   })
   .then(response => {
      console.log(`${index}`);

      const currentPlayerTag = '#'+playerTags[index];

      // console.log("Reading battle log for player ", currentPlayerTag);
        
      appendDataToFile(convertBattleLogToData(response.data, currentPlayerTag), './data/battles_unfiltered');
        
      index++;
      numRequestsMade++;

      if (numRequestsMade == NUM_REQUESTS_TO_MAKE) {
         console.log("Complete.");
         clearInterval(battleRequestInterval);
      }

   }).catch(error => {
      console.log("Aborting due to error in requesting data:")
      console.log(error.response.data)
      clearInterval(battleRequestInterval);
   }); 
}, MS_BETWEEN_REQUESTS);



// Take a battleLog object and narrow it down into just the necessary data.

// battlelog - a JSON object that contains information on the battle
// player - the tag of the player who's battle log we are requesting. this is used to identify duplicate battles.

function convertBattleLogToData(battlelog, player) {
   console.log('in function: ', player)
  // this full string will be returned.
  var string = "";

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
    //console.log(typeof match.battle.teams)

    // Sometimes the teams property is undefined. Not sure why. Either way,
    //    this match is irrelevant to us.
    // Also, ignore any modes that aren't 3v3
    if (!match.battle.teams || match.battle.teams[0].length != 3) {
      continue;
    }

    //response.data.items[3].battle.teams[0].length

    var fail = false;

    for (var f = 0; f < failConditions.length; f++) {
      if (failConditions[f] == true) {
        fail = true;
      }
    }

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
        //console.log(`battle ${i} insufficient trophies`);
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
    const playerIsOnRight = (teamOnRight[0].tag == player || teamOnRight[1].tag == player || teamOnRight[2].tag == player);

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

        teamOnRightDidWin ? 1 : 0,      // 10 - 0 if the left team won.
                                        //      1 if the right team won.
      ].join(",")
    ); 
  }

  // Once all the battles are added, join them with newlines
  if (battles.length == 0) {
    return "";
  } else {
    return battles.join("\n") + "\n";
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
