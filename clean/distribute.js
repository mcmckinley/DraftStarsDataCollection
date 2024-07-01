// distribute.js

// ----
// Takes data from data/battles.txt and seperates it into files, sorted by map and game mode.
// Makes the data readable.
// ----

// ----
// How to use: 
//  - delete existing filtered data
//      $ rm -r data/battles/* 
//  -  run:
//      $ node clean/distribute.js
// ----

const fs = require('fs');       // file i/o
const path = require('path');   // formatting paths

const pathToBattleLog = 'data/battles.txt';

// Use this to mark time between two points.
var startOfInterval = new Date();

function printCheckpoint(message){
    const endOfInterval = new Date();
    const durationOfInterval = ((endOfInterval-startOfInterval)/1000).toFixed(3);

    console.log(message, durationOfInterval, "s")
    startOfInterval = endOfInterval;
}

var numberOfMaps = 0;

// clear the info file
fs.writeFile('data/battles_info.txt', '', (err) => {});

fs.readFile(pathToBattleLog, 'utf8', (err, data) => {
    if (err){
        console.error(err);
        return;
    }
    printCheckpoint("File has been read");


    // 1. Organize the rougb data into an array.
    const allBattles = turnDataToArray(data);
    printCheckpoint("Data sorted into array");


    // 2. Turn the array into an object.
    var modes = {};
    
    for (var i = 0; i < allBattles.length; i++){
        const battle = allBattles[i];

        // I made it this way so that it is easy to debug and modify data.

        var gameTime     = battle[0];
        var starPlayer   = battle[1];
        var mode         = battle[2];
        var map          = battle[3];
        var brawler1     = battle[4];
        var brawler2     = battle[5];
        var brawler3     = battle[6];
        var brawler4     = battle[7];
        var brawler5     = battle[8];
        var brawler6     = battle[9];
        var whichTeamWon = battle[10];
        var left0        = battle[11];
        var left1        = battle[12];
        var left2        = battle[13];
        var right0       = battle[14];
        var right1       = battle[15];
        var right2       = battle[16];

        // If a key hasn't been created for a given mode or map, then create it
        if (!modes[mode]){
            modes[mode] = {};
        } 
        if (!modes[mode][map]){
            modes[mode][map] = [];
        }
        
        modes[mode][map].push(
            [
                gameTime,
                starPlayer,
                brawler1,
                brawler2,
                brawler3,
                brawler4,
                brawler5,
                brawler6,
                whichTeamWon
            ].join(',')
        );
    }

    printCheckpoint("Data sorted into objects for distribution");

    const mainDirectory = "data/battles";

    // this is added to data/battles_info.txt. this file tells you how many battles are logged for each map.
    var battleInfoText = '';

    // 3. Write the data to the files
    for (mode in modes){
        if (modes.hasOwnProperty(mode)){
            const subdirectory = path.join(mainDirectory, mode);
            // if the directory doesn't exist, create one
            fs.mkdirSync(subdirectory, (err) => {
                if (err && err.code != 'EEXIST') {
                    console.error(err);
                }
            });

            battleInfoText += mode + '\n';

            for (map in modes[mode]){
                if (modes[mode].hasOwnProperty(map)){
                    numberOfMaps += 1

                    const file = path.join(subdirectory, map);

                    fs.writeFile(file, modes[mode][map].join('\n'), (err) => {});

                    var numBattlesForMap = modes[mode][map].length;

                    battleInfoText += ' - ' + map + ': ' + numBattlesForMap + '\n';
                }
            }
        }
    }
    appendTextToFile(battleInfoText, 'data/battles_info.txt')
    console.log('Number of maps:', numberOfMaps)
})

function appendTextToFile(data, file){
  fs.appendFile(file, data, 'utf8', (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });
}

// takes a battle log (unfiltered string) and parses it into a 2d array.
// this function returns battleList, where each index is a battle.
//  each battle contains the following values at each index:
//       0 - the battle time
//       1 - the star player's id
//       2 - game mode
//       3 - map
//       4, 5, 6 - the names of the brawlers on the left team

//       7, 8, 9 - the names of the brawlers on the right team
//       10 - which team won  (left or right)


function turnDataToArray(data) {
    // 1. Read the raw data and produce arrays to represent it.
    var index = 0;
    var currentString = '';
    var currentArray = [];
    var battleList = [];
    while (index < data.length) {
      if (data[index] != ',' && data[index] != '\n') {
        currentString += data[index];
      } else {
        currentArray.push(currentString);
        currentString = '';
        if (currentArray.length == 17) { 
          battleList.push(currentArray);
          currentArray = [];
        }
      }
    index++;
    }
    
    return battleList;
}

function removeEmptyArrays(array){
    var newArray = [];
    for (var a = 0; a < array.length; a++){
      if (array[a].length > 0){
        newArray.push(array[a]);
      }
    }
    return newArray;
}