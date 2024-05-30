// create_csv.js
// Michael McKinley


// BEFORE USING:
// Make sure to run:
//    $ node clean/distribute.js

// -----
// The objective of this program is to take the data we have and make it interpretable for a nueral network.
// It creates a CSV file which pytorch can read.
// -----


const fs = require("fs"); // file i/o


// I. Index functions


// 1  - Arrays of brawlers and maps
var brawlers = ['SHELLY', 'COLT', 'BULL', 'BROCK', 'RICO', 'SPIKE', 'BARLEY', 'JESSIE', 'NITA', 'DYNAMIKE', 'EL PRIMO', 'MORTIS', 'CROW', 'POCO', 'BO', 'PIPER', 'PAM', 'TARA', 'DARRYL', 'PENNY', 'FRANK', 'GENE', 'TICK', 'LEON', 'ROSA', 'CARL', 'BIBI', '8-BIT', 'SANDY', 'BEA', 'EMZ', 'MR. P', 'MAX', 'JACKY', 'GALE', 'NANI', 'SPROUT', 'SURGE', 'COLETTE', 'AMBER', 'LOU', 'BYRON', 'EDGAR', 'RUFFS', 'STU', 'BELLE', 'SQUEAK', 'GROM', 'BUZZ', 'GRIFF', 'ASH', 'MEG', 'LOLA', 'FANG', 'EVE', 'JANET', 'BONNIE', 'OTIS', 'SAM', 'GUS', 'BUSTER', 'CHESTER', 'GRAY', 'MANDY', 'R-T', 'WILLOW', 'MAISIE', 'HANK', 'CORDELIUS', 'DOUG', 'PEARL', 'CHUCK', 'CHARLIE', 'MICO', 'KIT', 'LARRY & LAWRIE', 'MELODY', 'ANGELO', 'DRACO', 'LILY']
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

  console.log(message, durationOfInterval, "s");
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
  printCheckpoint("File has been read");

  // 1. Organize the rougb data into an array.
  var allBattlesUnfiltered = turnDataToArray(data);
  printCheckpoint("Data sorted into array");

  // console.log(`${allBattlesUnfiltered.length} total battles`)

  // 2. Remove duplicates from the array.
  var allBattles = removeDuplicates(allBattlesUnfiltered);
  printCheckpoint("Removed duplicates");
  console.log(`${allBattles.length} unique battles`);

  // 3. Write the CSV header
  var fileHeader = '';
  // left brawlers
  for (var i = 0; i < brawlers.length; i++){
    fileHeader += '"' + brawlers[i] + '_LEFT",';
  }
  // right brawlers
  for (var i = 0; i < brawlers.length; i++){
    fileHeader += '"' + brawlers[i] + '_RIGHT",';
  }
  // maps
  for (var i = 0; i < maps.length; i++){
    fileHeader += '"' + maps[i] + '",';
  }
  fileHeader += '"DID TEAM ON RIGHT WIN?"\n';
  appendTextToFile(fileHeader, 'data/battles.csv');

  // initialize blank data array
  const lengthOfDataArray = (brawlers.length * 2) + maps.length + 1;
  const emptyDataArray = new Array(lengthOfDataArray).fill(0);

  // for (var i = 0; i < allBattles.length; i++) {
  for (var i = 0; i < 1; i++) {

    // 1. Boolean array
    const battle = allBattles[i];

    var battleDataArray = emptyDataArray.slice();

    // console.log(mapToIndex);

    // console.log('EMPTY DATA ARR:')
    // console.log(battleDataArray.join(','))

    // 2. Modfy the bool array: 1's where the value is true

    var leftBrawler1 =  battle[4];
    var leftBrawler2 =  battle[5];
    var leftBrawler3 =  battle[6];
    var rightBrawler1 = battle[7];
    var rightBrawler2 = battle[8];
    var rightBrawler3 = battle[9];
    var map = battle[3];
    var teamThatWon =   battle[10];
    
    battleDataArray[getBrawlerIndex(leftBrawler1)] = 1;
    battleDataArray[getBrawlerIndex(leftBrawler2)] = 1;
    battleDataArray[getBrawlerIndex(leftBrawler3)] = 1;

    battleDataArray[getBrawlerIndex(rightBrawler1) + brawlers.length] = 1;
    battleDataArray[getBrawlerIndex(rightBrawler2) + brawlers.length] = 1;
    battleDataArray[getBrawlerIndex(rightBrawler3) + brawlers.length] = 1;

    // console.log(leftBrawler1 + ' at index ' +  getBrawlerIndex(leftBrawler1));
    // console.log(leftBrawler2 + ' at index ' +  getBrawlerIndex(leftBrawler2));
    // console.log(leftBrawler3 + ' at index ' +  getBrawlerIndex(leftBrawler3));
    // console.log(rightBrawler1 + ' at index ' +  getBrawlerIndex(rightBrawler1));
    // console.log(rightBrawler2 + ' at index ' +  getBrawlerIndex(rightBrawler2));
    // console.log(rightBrawler3 + ' at index ' +  getBrawlerIndex(rightBrawler3));
    // console.log( map + ' at index ' + getMapIndex(map));

    battleDataArray[getMapIndex(map) + brawlers.length * 2] = 1;
    battleDataArray[battleDataArray.length - 1] = (teamThatWon == 'right' ? 1 : 0);

    // console.log('POPULATED DATA ARR:')
    // console.log(battleDataArray.join(','))

    appendTextToFile('"' + battleDataArray.join('","') + '"\n', 'data/battles.csv')

  }
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
      if (currentArray.length == 11) {
        battleList.push(currentArray);
        currentArray = [];
      }
    }
    index++;
  }

  return battleList;
}
