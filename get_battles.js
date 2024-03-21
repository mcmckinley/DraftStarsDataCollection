// get_battles.js

// Requests the battle logs for all players within the player_tags file

// Run a local server with express
const express = require('express');
const app = express();
const port = 3000;

// Use .env to keep api key private
require('dotenv').config();
const API_KEY = process.env.API_KEY;

// Make API calls through axios
const axios = require('axios');

// fs module reads/writes to files
const fs = require('fs');

// Preparing the program

// Clear the battles_unfiltered file
fs.writeFile('./data/battles_unfiltered', '', (err) => {
    if (err) {
        console.log('Could not clear file.')
    } else {
        console.log(' -> data/battles_unfiltered file reset.')
    }
})

// Read the file synchronously
const unfilteredPlayerTags = fs.readFileSync('./data/player_tags', 'utf8');

// Split the file contents into an array of player tags
const playerTags = unfilteredPlayerTags.split('\n').filter(tag => tag.trim() !== '');

// Modify the request

// Total number of battles to request
const START_AT = 0;
const NUM_REQUESTS_TO_MAKE = 1;

const TIME_BETWEEN_REQUESTS = 800;

var count = START_AT;

var battleRequestInterval = setInterval(function() {
    axios({
        method: 'get',
        url: `https://api.brawlstars.com/v1/players/%23${playerTags[count]}/battlelog`,
        headers: {
            'Authorization': `Bearer ${API_KEY}`
        }
    })
    .then(response => {
        console.log(`${count}`);
        
        appendDataToFile(convertBattleLogToData(response.data, '#'+playerTags[count]), './data/battles_unfiltered');

    }).catch(error => {
        console.log(error)
    });

    count++;
    if (count == START_AT+1){
        console.log("Running.");
    }
    if (count - START_AT == NUM_REQUESTS_TO_MAKE) {
        console.log("IMPORTANT -- REMEMBER TO CTRL+C AND NOT WIPE FILE");
        clearInterval(battleRequestInterval);
    }
}, TIME_BETWEEN_REQUESTS);


function convertBattleLogToData(battlelog, player){
    // necessary to later identify duplicate battles. these have to carry over 
    // between iterations, because not all battles have star players (ranked mode.)
    var starPlayer;
  
    // this full string will be added to the data file.
    var string = '';

    var battles = [];
    
    // the first or second match may have no star player, due to the nature of power league.
    // we will have to skip these matches
    // note: this condition is activated far more than intended: it is also triggered for showdown, boss fight etc. this creates no problems because those modes are skipped anwyays.
  
    var startIndex = 0;
    if (battlelog.items[0].battle.starPlayer == null) {
      startIndex++;
      if (battlelog.items[1].battle.starPlayer == null) {
        startIndex++;
      }
    }
  
    for (var i=startIndex; i<battlelog.items.length;i++){
      // 1 - the type must be ranked, soloRanked, teamRanked
      const match = battlelog.items[i];
  
      const matchType = match.battle.type;

      var failConditions = [
        match.event.mode == "soloShowdown",
        match.event.mode == "duoShowdown",
        match.event.mode == "duels",
        match.event.mode == "unknown",
        matchType != "ranked" && matchType != "soloRanked" && matchType != "teamRanked",
        !match.battle.mode,
        !match.event.map,
        match.battle.result == 'draw'
      ];

      var fail = false;

      for (var f = 0; f < failConditions.length; f++){
        if (failConditions[f] == true){
            fail = true;
        }
      }
      
      if (fail) {
        continue;
      }
      
      // Ignore the match if it is too low trophies.
      if (matchType == "ranked") {
        var highestTrophies = 0;
        for (var j=0;j<2;j++){
          for (var k=0;k<3;k++){
            const playerTrophies = match.battle.teams[j][k].brawler.trophies;

            if (playerTrophies > highestTrophies){
              highestTrophies = playerTrophies;
            }
          }
        }

        if (highestTrophies < 600){
          //console.log(`battle ${i} insufficient trophies`);
          continue;
        }
      }

      // Determine star player (same as previous if null)
      if (match.battle.starPlayer) {
        starPlayer = match.battle.starPlayer.tag;
      }
      
      // Determine wether or not the team on the right won
      const teamOnLeft = match.battle.teams[0];
      const teamOnRight = match.battle.teams[1];

      const playerDidWin = match.battle.result == 'victory';
      const playerIsOnRight = (teamOnRight[0].tag == player ||
                               teamOnRight[1].tag == player ||
                               teamOnRight[2].tag == player);

      var teamOnRightDidWin;

      if (playerDidWin && playerIsOnRight){
        teamOnRightDidWin = true;
      } else {
        teamOnRightDidWin = false;
      }

      // Finally, add the battle to the battles array
      battles.push([
        match.battleTime,               // 0 - the battle time
        starPlayer,                     // 1 - the star player's id 
        match.event.mode,               // 2 - game mode
        match.event.map,                // 3 - map

        teamOnLeft[0].brawler.name,     // 4, 5, 6 - the names of the brawlers 
        teamOnLeft[1].brawler.name,     //           on the left team 
        teamOnLeft[2].brawler.name,

        teamOnRight[0].brawler.name,    // 7, 8, 9 - the names of the brawlers 
        teamOnRight[1].brawler.name,    //           on the right team
        teamOnRight[2].brawler.name,

        teamOnRightDidWin ? 1 : 0       // 10 - 0 if the left team won.
                                        //      1 if the right team won. 
      ].join(',')) // join the array with commas
    }

    // Once all the battles are added, join them with newlines
    return battles.join('\n');
  }



  function appendDataToFile(data, file){
    fs.appendFile(file, data, 'utf8', (err) => {
      if (err) {
        console.error(err);
        return;
      }
    });
  }



  /*
// Send to device to be parsed by Insomnia
app.listen(port, () => {
    console.log(`API listening at http://localhost:${port}`)
})

app.get('/', (req, res) => {

    axios({
        method: 'get',
        url: `https://api.brawlstars.com/v1/players/%23${playerTags[0]}/battlelog`,
        headers: {
            'Authorization': `Bearer ${API_KEY}`
        }
    })
    .then(response => {
        console.log("Successfully requested one battle")
        res.send(response.data)

    }).catch(error => {
        console.log(error)
        res.send("Error requesting battle")
    });
    
});
*/