// clean/old_csv.js
// Michael McKinley


// This is outdated. Please use clean/csv.js instead.

// This is not updated to work with the new distributed file system.
// It worked when all battles were added to a single file.
// Now battles are distributed across multiple files. 


// -----
// Reads data/battles.json and converts it into a csv file
//    to be used as input to a pytorch neural network.
// -----

const fs = require("fs"); // file i/o

const inputFile = 'data/battles.json'
const outputFile = 'data/battles.csv'


console.log('Input file:', inputFile)
console.log('Output file:',outputFile)
// I. Helper functions and variables

// battles ON or BEFORE this date will be ignored.
const cutoff = {
  year: 2024,
  month: 8, 
  day: 29
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

  console.log(message + ' - ' + durationOfInterval + 's');
  startOfInterval = endOfInterval;
}


// II. Reading the datafile

// 1. Clear the CSV file
fs.writeFile(outputFile, '', (err) => {
  if (err) {
    console.error(err);
    return;
  }
});

fs.readFile(inputFile, "utf8", (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  printCheckpoint("File read");

  // 1. Organize the rougb data into an array.
  var battleListUnfiltered = JSON.parse(data)
  printCheckpoint("Data sorted");

  // 2. Remove duplicates from the array.
  var battleList = removeDuplicates(battleListUnfiltered);
  printCheckpoint(`Removed ${battleListUnfiltered.length - battleList.length} duplicates`);

  // 3. Write the CSV header

  const csvHeader = '"map","a1","a2","a3","b1","b2","b3","did_team_b_win","a1_t","a2_t","a3_t","b1_t","b2_t","b3_t"\n';
  appendTextToFile(csvHeader, outputFile);

  var allBattleArrays = [];

  for (const battle of battleList) {
    
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
    
    const battleDataArray = [
      map, a1, a2, a3, b1, b2, b3,        // add map and brawler names
      teamThatWon,                        // specify who won
      a1_t, a2_t, a3_t, b1_t, b2_t, b3_t  // add trophy counts for each player
    ];

    allBattleArrays.push('"' + battleDataArray.join('","') + '"');
  }

  appendTextToFile(allBattleArrays.join('\n'), outputFile)

  console.log(numBattlesBeforeCutoffDate + ' battles removed due to cutoff date: ' + cutoff.month + '/' + cutoff.day + '/' + cutoff.year)
  printCheckpoint(battleList.length - numBattlesBeforeCutoffDate + ' battles written to ' + outputFile);
});

function appendTextToFile(data, file){
  fs.appendFile(file, data, 'utf8', (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });
}

