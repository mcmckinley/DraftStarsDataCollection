// create_csv.js
// Michael McKinley

// -----
// Reads data/battles.json and converts it into a csv file
//    to be used as input to a pytorch neural network.
// -----

const fs = require("fs"); // file i/o




// I. Helper functions and variables

const cutoff = {
  year: 2024,
  month: 6, 
  day: 25
}
numBattlesBeforeCutoffDate = 0;

// removeDuplicates
//    Input: array<array<string>>
//    Return: the input array, free of duplicates
function removeDuplicates(array) {
  const uniqueStrings = new Set(
    array.map((subArray) => JSON.stringify(subArray)),
  );
  return Array.from(uniqueStrings).map((str) => JSON.parse(str));
}

// printCheckpoint
//    Input: message
//    Output: prints the message along with the elapsed time since last checkpoint.
var startOfInterval = new Date();

function printCheckpoint(message) {
  const endOfInterval = new Date();
  const durationOfInterval = ((endOfInterval - startOfInterval) / 1000).toFixed(3);

  console.log(message + ' in ' + durationOfInterval + 's');
  startOfInterval = endOfInterval;
}


// II. Reading the datafile

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
    var gameTime = battle[0];
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

    // Ignore games that happen before the cutoff date (the game's most recent update)
    var year = Number(gameTime.substring(0, 4))
    var month = Number(gameTime.substring(4, 6))
    var day = Number(gameTime.substring(6, 8))

    gameHappensBeforeCutoff = year < cutoff.year || (year == cutoff.year && (month < cutoff.month || (month == cutoff.month && day < cutoff.day)))
    if (gameHappensBeforeCutoff) {
        numBattlesBeforeCutoffDate += 1
        continue;
    }

    
    battleDataArray.push(
      map, a1, a2, a3, b1, b2, b3,        // add map and brawler names
      teamThatWon,                        // specify who won
      a1_t, a2_t, a3_t, b1_t, b2_t, b3_t  // add trophy counts for each player
    );

    allBattleArrays.push('"' + battleDataArray.join('","') + '"');
  }

  appendTextToFile(allBattleArrays.join('\n'), 'data/battles.csv')

  console.log(numBattlesBeforeCutoffDate + ' battles removed due to cutoff date')
  printCheckpoint(battleList.length - numBattlesBeforeCutoffDate + ' battles written to data/battles.csv');
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
