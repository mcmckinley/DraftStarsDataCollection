// player_tags.js

// Requests player tags from the top 200 clubs globally.
// - Each club has 30 players, so this program collects up to 6,000 player tags.


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

// Number of tags to request minus 1
const NUM_TAGS_TO_REQUEST = 10;

// Clear the player tag file
fs.writeFile('./data/player_tags.txt', '', (err) => {
    if (err) {
        console.log('Could not clear file.')
    } else {
        console.log('player_tags file reset.')
    }
})

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
    for (var j=0; j<200; j++){
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
                
                fs.appendFile('./data/player_tags', tag +'\n', (err) => {
                    if (err) {
                        console.log('error adding tag to file');
                    }
                });
            }
        })
        .catch(error => {
            console.log(error);
        })

        clubIndex++;        
        if (clubIndex == NUM_TAGS_TO_REQUEST){
            clearInterval(intervalID);
            console.log('Success.');
        }
    }, 500);
})
.catch(error => {
    console.log(error);
})