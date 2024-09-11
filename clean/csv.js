// create_csv.js
// Michael McKinley

// -----
// Reads data/battles.json and converts it into a csv file
//    to be used as input to a pytorch neural network.
// -----

const fs = require("fs"); // file i/o


// I. Helper functions and variables


const outputFile = 'data/battles.csv'

// Battles collected ON or BEFORE this date will be ignored.
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


// II. Read the datafiles

// The info file contains the paths to each dataset.
// Read each path to get the battles, and append it to battleListUnfiltered

info = JSON.parse(fs.readFileSync('data/metadata/info.json'));
battleListUnfiltered = []
for (dataset of info){
  const timeOfCollection = dataset.timeOfCollection
  // Ignore games that happen before the cutoff date (the game's most recent update)
  var year = Number(timeOfCollection.substring(0, 4))
  var month = Number(timeOfCollection.substring(5, 7))
  var day = Number(timeOfCollection.substring(8, 10))
  if (year < cutoff.year || (year == cutoff.year && (month < cutoff.month || (month == cutoff.month && day < cutoff.day)))) {
      continue;
  }

  battles = JSON.parse(fs.readFileSync(dataset['filename']))
  battleListUnfiltered = battleListUnfiltered.concat(battles)
}

printCheckpoint(`${battleListUnfiltered.length} battles found`);


// III. Remove duplicates

var battleList = removeDuplicates(battleListUnfiltered);
printCheckpoint(`${battleListUnfiltered.length - battleList.length} duplicates removed`);


// IV. Convert the battles to strings


var allBattleStrings = [];
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
  var teamThatWon = battle[10] == 1 ? 0 : 1; // flip it for the model
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

  // Turn the battle into a string
  allBattleStrings.push('"' + battleDataArray.join('","') + '"');
}


// V. Write the data to the file


const csvHeader = '"map","a1","a2","a3","b1","b2","b3","did_blue_team_win","a1_t","a2_t","a3_t","b1_t","b2_t","b3_t"\n';

fs.writeFileSync(outputFile, csvHeader + allBattleStrings.join('\n'))

console.log(numBattlesBeforeCutoffDate + ' battles removed due to cutoff date: ' + cutoff.month + '/' + cutoff.day + '/' + cutoff.year)
printCheckpoint(battleList.length - numBattlesBeforeCutoffDate + ' battles written to ' + outputFile);
