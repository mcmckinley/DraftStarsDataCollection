// collect/get_player_tags.js
// Michael McKinley

// ----
//  Creates a list of player tags.
//      a) requests the club leaderboard (tags of top 200 clubs)
//      b) requests member lists from all clubs (200 clubs * ~30 players == ~6000 players)
//  ----


// I. Config variables


// Don't set this above 200
const NUM_CLUBS_TO_REQUEST_FROM = 200;
const MS_BETWEEN_REQUESTS = 500;


// Use .env to keep api key private
require('dotenv').config();
const API_KEY = process.env.API_KEY;

// Make API calls through axios
const axios = require('axios');

// fs module reads/writes to files
const fs = require('fs');


// II. Import existing player tags, if possible.


// Array of club tags
var clubTags = [];

// Array of player tags
// We first take the existing player tags, add the new list of tags,
// then remove duplicates. So we are essentially updating the list.
var playerTags;

try {
    const data = fs.readFileSync('data/input-datasets/player_tags.json', 'utf8');
    playerTags = data.trim() ? JSON.parse(data) : [];
    console.log('Player tags have read')
} catch (err) {
    console.log('Could not find player_tags.json; will create a new one')
    playerTags = [];
}

const oldLength = playerTags.length;


// III. Request club leaderboard


axios({
    method: 'get',
    url: `https://api.brawlstars.com/v1/rankings/global/clubs`,
    headers: {
      'Authorization': `Bearer ${API_KEY}`
    }
})
.then(leaderboardResponse => {
    console.log('Requested club leaderboard. Will begin requesting player tags. This may take some time.')


    // IV. Create array of club tags
    

    var leaderboard = leaderboardResponse.data;
    for (var j = 0; j < 200; j++){
        clubTags.push(leaderboard.items[j].tag);
    }

    
    // V. Request members' tags from each club
    

    var clubIndex = 0;
    var intervalID = setInterval(function() {
        axios({
            method: 'get',
            url: `https://api.brawlstars.com/v1/clubs/%23${clubTags[clubIndex].slice(1)}/members`,
            headers: {
              'Authorization': `Bearer ${API_KEY}`
            }
        })
        .then(response => {
            // Get the tags
            var data = response.data; 
            for (var i = 0; i < data.items.length; i++){
                const tag = data.items[i].tag.slice(1);
                playerTags.push(tag)
            }
        })
        .catch(error => {
            console.log(error);
        })
        
        if (clubIndex == NUM_CLUBS_TO_REQUEST_FROM){
            clearInterval(intervalID);
            
            // Remove duplicates

            playerTags = [...new Set(playerTags)];

            // Convert to JSON
            var playerTagsJSON = JSON.stringify(playerTags)
            
            // Write the data to the file
            fs.writeFileSync('./data/input-datasets/player_tags.json', playerTagsJSON +'\n', (err) => {
                if (err) {
                    console.error(err);
                }
            });
            
            console.log(`${playerTags.length - oldLength} NEW player tags were added to data/input-datasets/player_tags.json`);
            console.log(`${playerTags.length} total player tags`);
        }
        clubIndex++;
    }, MS_BETWEEN_REQUESTS);
})
.catch(error => {
    console.log(error);
})