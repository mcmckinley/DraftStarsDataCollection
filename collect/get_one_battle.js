// get_one_battle.js
// Michael McKinley

// ----
// Requests a single battle.
// Useful for inspecting API responses.
// ----

// The unique ID of the player we are requesting 
const TAG_TO_REQUEST = 'RQPCRGGGQ'

require('dotenv').config();
const API_KEY = process.env.API_KEY;

const axios = require('axios');


axios({
    method: 'get',
    url: `https://api.brawlstars.com/v1/players/%23${TAG_TO_REQUEST}/battlelog`,
    headers: {
        'Authorization': `Bearer ${API_KEY}`
    }
})
.then(response => {
    console.log(response.data)
}).catch(error => {
    console.log(error)
});
