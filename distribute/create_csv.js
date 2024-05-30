// create_csv.js
// Michael McKinley

// ----- 
// The objective of this program is to take the data we have and make it interpretable for a nueral network.
// It creates a CSV file which pytorch can read.
// -----

class Battle {
    constructor(arr){

    }
}

// Use this to mark time between two points.
var startOfInterval = new Date();

function printCheckpoint(message){
    const endOfInterval = new Date();
    const durationOfInterval = ((endOfInterval-startOfInterval)/1000).toFixed(3);

    console.log(message, durationOfInterval, "s")
    startOfInterval = endOfInterval;
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
    var currentString = '';
    var currentArray = [];
    var battleList = [];
    while (index < data.length) {
      if (data[index] != ',' && data[index] != '\n') {
        currentString += data[index];
      } else {
        currentArray.push(currentString);
        currentString = '';
        if (currentArray.length == 11) { 
          battleList.push(currentArray);
          currentArray = [];
        }
      }
    index++;
    }
    
    return battleList;
}