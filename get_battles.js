// get_battles.js

// Requests the battle logs for all players within the player_tags file

// Run a local server with express
const express = require('express');
const app = express();
const port = 3000;

// Use .env to keep api key private
require('dotenv').config();
const API_KEY = process.env.API_KEY;

// Make API calls through axios
const axios = require('axios');

// fs module reads/writes to files
const fs = require('fs');

// Preparing the program

// Clear the battles_unfiltered file
fs.writeFile('./data/battles_unfiltered', '', (err) => {
    if (err) {
        console.log('Could not clear file.')
    } else {
        console.log(' -> data/battles_unfiltered file reset.')
    }
})

// Read the file synchronously
const unfilteredPlayerTags = fs.readFileSync('./data/player_tags', 'utf8');

// Split the file contents into an array of player tags
const playerTags = unfilteredPlayerTags.split('\n').filter(tag => tag.trim() !== '');

// Modify the request

// Total number of battles to request
const START_AT = 0;
const NUM_REQUESTS_TO_MAKE = 1;

const TIME_BETWEEN_REQUESTS = 800;

var count = START_AT;

// Send to device to be parsed by Insomnia
app.listen(port, () => {
    console.log(`API listening at http://localhost:${port}`)
})

app.get('/', (req, res) => {

    axios({
        method: 'get',
        url: `https://api.brawlstars.com/v1/players/%23${playerTags[0]}/battlelog`,
        headers: {
            'Authorization': `Bearer ${API_KEY}`
        }
    })
    .then(response => {
        console.log("Successfully requested one battle")
        res.send(response.data)

    }).catch(error => {
        console.log(error)
        res.send("Error requesting battle")
    });
    
});



/*
var battleRequestInterval = setInterval(function() {
    axios({
        method: 'get',
        url: `https://api.brawlstars.com/v1/players/%23${playerTags[count]}/battlelog`,
        headers: {
            'Authorization': `Bearer ${API_KEY}`
        }
    })
    .then(response => {
        console.log(`${count}`);
        console.log(response.data)
        
        fs.appendFile('data/battles_unfiltered', JSON.stringify(response), 'utf8', (err) => {
            if (err) {
                console.error(err);
                return;
            }
        });
        
        //appendDataToFile(convertBattleLogToData(response.data, '#'+playerTags[count]), './logs/roughlog.txt');

    }).catch(error => {
        console.log(error)
    });

    count++;
    if (count == START_AT+1){
        console.log("Running.");
    }
    if (count - START_AT == NUM_REQUESTS_TO_MAKE) {
        console.log("IMPORTANT -- REMEMBER TO CTRL+C AND NOT WIPE FILE");
        clearInterval(battleRequestInterval);
    }
}, TIME_BETWEEN_REQUESTS);
*/
