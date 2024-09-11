// get_one_battle.js
// Michael McKinley

// ----
// Requests a single battle.
// Useful for inspecting API responses.
// ----

require('dotenv').config();
const API_KEY = process.env.API_KEY;
const axios = require('axios');

const playerTag = 'RQPCRGGGQ'

axios({
    method: 'get',
    url: `https://api.brawlstars.com/v1/players/%23${playerTag}/battlelog`,
    headers: {
        'Authorization': `Bearer ${API_KEY}`
    }
})
.then(response => {
    console.log(response.data)
}).catch(error => {
    console.log(error)
});
