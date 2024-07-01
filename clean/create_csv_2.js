// create_csv_2.js
// Michael McKinley

// -----
// This is version 2. It is interpretable for a GPT.
// Encodes a text file containing battles into a csv.
// -----

// BEFORE USING:
// Make sure to run:
//    $ node clean/distribute.js



const fs = require("fs"); // file i/o

// I. Index functions


// 1  - Arrays of brawlers and maps
var brawlers = ['SHELLY', 'COLT', 'BULL', 'BROCK', 'RICO', 'SPIKE', 'BARLEY', 'JESSIE', 'NITA', 'DYNAMIKE', 'EL PRIMO', 'MORTIS', 'CROW', 'POCO', 'BO', 'PIPER', 'PAM', 'TARA', 'DARRYL', 'PENNY', 'FRANK', 'GENE', 'TICK', 'LEON', 'ROSA', 'CARL', 'BIBI', '8-BIT', 'SANDY', 'BEA', 'EMZ', 'MR. P', 'MAX', 'JACKY', 'GALE', 'NANI', 'SPROUT', 'SURGE', 'COLETTE', 'AMBER', 'LOU', 'BYRON', 'EDGAR', 'RUFFS', 'STU', 'BELLE', 'SQUEAK', 'GROM', 'BUZZ', 'GRIFF', 'ASH', 'MEG', 'LOLA', 'FANG', 'EVE', 'JANET', 'BONNIE', 'OTIS', 'SAM', 'GUS', 'BUSTER', 'CHESTER', 'GRAY', 'MANDY', 'R-T', 'WILLOW', 'MAISIE', 'HANK', 'CORDELIUS', 'DOUG', 'PEARL', 'CHUCK', 'CHARLIE', 'MICO', 'KIT', 'LARRY & LAWRIE', 'MELODIE', 'ANGELO', 'DRACO', 'LILY']
var maps = []; 

// 2 - Dictionaries of brawlers and maps
var brawlerToIndex = {};
var mapToIndex = {};

// 3.1 - Populating the brawlers dictionary is easy
brawlers.forEach((brawler, index) => {
  brawlerToIndex[brawler] = index;
});

// 3.2 - Populating the maps dictionary is a little harder: we have to 
//        read the maps in first. For this we use the battles_info file.
fs.readFile("data/battles_info.txt", "utf8", (err, data) => {
  if (err) {
    console.error(err);
    return;
  }

  var index = 0;
  var currentString = "";

  while (index < data.length) {
    if (data[index] == "-") {         // find dash character
      index += 2;                     // ignore the space that follows
      while (data[index] != ":") {
        currentString += data[index]; // add the string
        index++;
      }
      maps.push(currentString);
      currentString = '';
    }
    index++;
  }

  maps.forEach((map, index) => {
    mapToIndex[map] = index;
  });

});

// 4 - Index functions

// input: (string) a brawler name, or a map name
// return: (integer) the index in the final array (what the neural network takes as input) 
//                   that the brawler or map corresponds to.
function getBrawlerIndex(name) {
  return brawlerToIndex[name];
}

function getMapIndex(name) {
  return mapToIndex[name];
}


// II. Helper functions


// remove duplicates
// Takes an array of string arrays
// Removes duplicates and returns
function removeDuplicates(array) {
  const uniqueStrings = new Set(
    array.map((subArray) => JSON.stringify(subArray)),
  );
  return Array.from(uniqueStrings).map((str) => JSON.parse(str));
}

// print checkpoint
// Marks how long it took to preform a specific action. 
// Each time you printCheckpoint, it resets the timer.
var startOfInterval = new Date();

function printCheckpoint(message) {
  const endOfInterval = new Date();
  const durationOfInterval = ((endOfInterval - startOfInterval) / 1000).toFixed(3);

  console.log(message + ' in ' + durationOfInterval + 's');
  startOfInterval = endOfInterval;
}


// III. Reading the datafile

// 1. Clear the CSV file
fs.writeFile('data/battles.csv', '', (err) => {
  if (err) {
    console.error(err);
    return;
  }
});

fs.readFile("data/battles.txt", "utf8", (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  printCheckpoint("File read");

  // 1. Organize the rougb data into an array.
  var battleListUnfiltered = turnDataToArray(data);
  printCheckpoint("Data sorted");

  // console.log(`${battleListUnfiltered.length} total battles`)

  // 2. Remove duplicates from the array.
  var battleList = removeDuplicates(battleListUnfiltered);
  printCheckpoint("Removed duplicates");

  // 3. Write the CSV header

  const csvHeader = '"map","a1","a2","a3","b1","b2","b3","did_team_b_win","a1_t","a2_t","a3_t","b1_t","b2_t","b3_t"\n';
  appendTextToFile(csvHeader, 'data/battles.csv');

  var allBattleArrays = [];

  for (const battle of battleList) {
    var battleDataArray = [];

    // 2. Modfy the bool array: 1's where the value is true

    var a1 =  battle[4];
    var a2 =  battle[5];
    var a3 =  battle[6];
    var b1 = battle[7];
    var b2 = battle[8];
    var b3 = battle[9];
    var map = battle[3];
    var teamThatWon = battle[10];
    var a1_t = battle[11];
    var a2_t = battle[12];
    var a3_t = battle[13];
    var b1_t = battle[14];
    var b2_t = battle[15];
    var b3_t = battle[16];
    
    battleDataArray.push(
      map, a1, a2, a3, b1, b2, b3,        // add map and brawler names
      teamThatWon == 'right' ? 1 : 0,     // specify who won
      a1_t, a2_t, a3_t, b1_t, b2_t, b3_t  // add trophy counts for each player
    );

    allBattleArrays.push('"' + battleDataArray.join('","') + '"');
  }

  fs.appendFile('data/battles.csv', allBattleArrays.join('\n'), (err) => {
    if (err) {
      console.error(err); 
      return;
    }
  })
  
  printCheckpoint(battleList.length + ' battles written to data/battles.csv');
});

function appendTextToFile(data, file){
  fs.appendFile(file, data, 'utf8', (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });
}


// takes a battle log (unfiltered string) and parses it into a 2d array.
// this function returns battleList (array of string arrays), where each index is a battle.

//  each battle (array of strings) contains the following values at each index:
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
  var currentString = "";
  var currentArray = [];
  var battleList = [];
  while (index < data.length) {
    if (data[index] != "," && data[index] != "\n") {
      currentString += data[index];
    } else {
      currentArray.push(currentString);
      currentString = "";
      if (currentArray.length == /*11*/ 17) {
        battleList.push(currentArray);
        currentArray = [];
      }
    }
    index++;
  }

  return battleList;
}
