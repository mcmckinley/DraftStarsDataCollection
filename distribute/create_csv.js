// create_csv.js
// Michael McKinley

// ----- 
// The objective of this program is to take the data we have and make it interpretable for a nueral network.
// It creates a CSV file which pytorch can read.
// -----

const fs = require('fs');       // file i/o

function createBrawlerIDMap(){
    const brawlerIDMap = new Map([
        ['SHELLY',0],
        ['COLT',1],
        ['BULL',2],
        ['BROCK',3],
        ['RICO',4],
        ['SPIKE',5],
        ['BARLEY',6],
        ['JESSIE',7],
        ['NITA',8],
        ['DYNAMIKE',9],
        ['EL PRIMO',10],
        ['MORTIS',11],
        ['CROW',12],
        ['POCO',13],
        ['BO',14],
        ['PIPER',15],
        ['PAM',16],
        ['TARA',17],
        ['DARRYL',18],
        ['PENNY',19],
        ['FRANK',20],
        ['GENE',21],
        ['TICK',22],
        ['LEON',23],
        ['ROSA',24],
        ['CARL',25],
        ['BIBI',26],
        ['8-BIT',27],
        ['SANDY',28],
        ['BEA',29],
        ['EMZ',30],
        ['MR. P',31],
        ['MAX',32],
        ['JACKY',33],
        ['GALE',34],
        ['NANI',35],
        ['SPROUT',36],
        ['SURGE',37],
        ['COLETTE',38],
        ['AMBER',39],
        ['LOU',40],
        ['BYRON',41],
        ['EDGAR',42],
        ['RUFFS',43],
        ['STU',44],
        ['BELLE',45],
        ['SQUEAK',46],
        ['GROM',47],
        ['BUZZ',48],
        ['GRIFF',49],
        ['ASH',50],
        ['MEG',51],
        ['LOLA',52],
        ['FANG',53],
        ['EVE',54],
        ['JANET',55],
        ['BONNIE',56],
        ['OTIS',57],
        ['SAM',58],
        ['GUS',59],
        ['BUSTER',60],
        ['CHESTER',61],
        ['GRAY',62],
        ['MANDY',63],
        ['R-T',64],
        ['WILLOW',65],
        ['MAISIE',66],
        ['HANK',67],
        ['CORDELIUS',68],
        ['DOUG',69],
        ['PEARL',70],
        ['CHUCK',71],
        ['CHARLIE',72],
        ['MICO',73],
        ['KIT',74],
        ['LARRY & LAWRIE',75],
        ['MELODY',76],
        ['ANGELO',77],
        ['DRACO',78],
        ['LILY',79]
    ]);
    return brawlerIDMap;
}

const brawlerIDMap = createBrawlerIDMap();

// Input a brawler name, return its index, 
// e.g. 'SHELLY' returns 0, 'COLT' returns 1... 
function nameToIndex(name){
    return brawlerIDMap.get(name);
}


// pass in an array of string arrays
function removeDuplicates(array) {
    const uniqueStrings = new Set(array.map(subArray => JSON.stringify(subArray)));
    return Array.from(uniqueStrings).map(str => JSON.parse(str));
}

// Use this to mark time between two points.
var startOfInterval = new Date();

function printCheckpoint(message){
    const endOfInterval = new Date();
    const durationOfInterval = ((endOfInterval-startOfInterval)/1000).toFixed(3);

    console.log(message, durationOfInterval, "s")
    startOfInterval = endOfInterval;
}

var pathToBattleLog = 'data/battles.txt';

fs.readFile(pathToBattleLog, 'utf8', (err, data) => {
    if (err){
        console.error(err);
        return;
    }
    printCheckpoint('File has been read');

    // 1. Organize the rougb data into an array.
    var allBattlesUnfiltered = turnDataToArray(data);
    printCheckpoint('Data sorted into array');

    console.log(` - before removing dupes: ${allBattlesUnfiltered.length} battles`)

    // 2. Remove duplicates from the array.
    var allBattles = removeDuplicates(allBattlesUnfiltered);
    printCheckpoint('Removed duplicates')
    console.log(` - after removing dupes: ${allBattles.length} battles`)

    // 3. 


});

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