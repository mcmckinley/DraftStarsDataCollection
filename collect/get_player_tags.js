// collect/player_tags.js
// Michael McKinley

// ----
//  Creates a list of player tags.
//  a) requests the club leaderboard (tags of top 200 clubs)
//  b) requests member lists from all clubs (200 clubs * 30 players == 6000 players)
//  ----


// Run a local server with express
const express = require('express');
const app = express();

// Use .env to keep api key private
require('dotenv').config();
const API_KEY = process.env.API_KEY;

// Make API calls through axios
const axios = require('axios');

// fs module reads/writes to files
const fs = require('fs');

// Array of club tags
var clubTags = [];

// Array of player tags
// We first take the existing player tags, add the new list of tags,
// then remove duplicates. So we are essentially updating the list.
var playerTags = JSON.parse(fs.readFileSync('data/player_tags.json', 'utf8'))

// MAX 6000
const NUM_CLUBS_TO_REQUEST_FROM = 200;

// Clear the player tag file
// fs.writeFile('./data/player_tags.json', '', (err) => {
//     if (err) {
//         console.log('Could not clear file.')
//     } else {
//         console.log('player_tags file reset.')
//     }
// })

// 1: Request club leaderboard

axios({
    method: 'get',
    url: `https://api.brawlstars.com/v1/rankings/global/clubs`,
    headers: {
      'Authorization': `Bearer ${API_KEY}`
    }
})
.then(response => {

    // 2: Create array of club tags
    
    var leaderboard = response.data;
    for (var j = 0; j < 200; j++){
        clubTags.push(leaderboard.items[j].tag);
    }
    
    // 3: Request members' tags from each club
    
    var clubIndex = 0;
    var intervalID = setInterval(function() {
        axios({
            method: 'get',
            url: `https://api.brawlstars.com/v1/clubs/%23${clubTags[clubIndex].slice(1)}/members`,
            headers: {
              'Authorization': `Bearer ${API_KEY}`
            }
        })

        // 4. Write members' tags to the data/player_tags file

        .then(response => {
            var data = response.data; 
            for (var i = 0; i < data.items.length; i++){
                const tag = data.items[i].tag.slice(1);
                playerTags.push(tag)
            }
        })
        .catch(error => {
            console.log(error);
        })

        clubIndex++;        
        if (clubIndex == NUM_CLUBS_TO_REQUEST_FROM){
            clearInterval(intervalID);
            
            // Remove duplicates
            playerTags = [...new Set(playerTags)];
            // Convert to JSON
            var playerTagsJSON = JSON.stringify(playerTags)
            // Clear the file
            fs.writeFile('./data/player_tags.json', '', (err) => {if (err) {console.error(err);}});
            // Write the data to the file
            fs.appendFile('./data/player_tags.json', playerTagsJSON +'\n', (err) => {if (err) {console.error(err)}});
            
            console.log(`${playerTags.length} player tags saved to data/player_tags.json`);
        }
    }, 500);
})
.catch(error => {
    console.log(error);
})