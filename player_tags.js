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

var clubTags = [];

// STEP 1. REQUEST CLUB LEADERBOARD LIST
axios({
    method: 'get',
    url: `https://api.brawlstars.com/v1/rankings/global/clubs`,
    headers: {
      'Authorization': `Bearer ${API_KEY}`
    }
})
.then(response => {
    console.log("success");
        
    // 2. REQUEST MEMBER NAMES FROM CLUB
    var leaderboard = response.data;
    for (var j=0; j<200; j++){
        clubTags.push(leaderboard.items[j].tag);
    }

    console.log(clubTags);
})
.catch(error => {
    // Handle error
    console.log(error);
})