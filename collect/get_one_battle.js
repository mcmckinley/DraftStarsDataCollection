// get_one_battle.js
// Michael McKinley

// ----
// Requests a single battle and sends it to localhost.
// This is useful for inspecting API responses.
// ----

// Run a local server with express
const express = require('express');
const app = express();
const port = 3000;

// Use .env to keep api key private
require('dotenv').config();
const API_KEY = process.env.API_KEY;

// Make API calls through axios
const axios = require('axios');
  
// Send to device to be parsed by Insomnia
app.listen(port, () => {
    console.log(`API listening at http://localhost:${port}`)
})

app.get('/', (req, res) => {

    axios({
        method: 'get',
        //url: `https://api.brawlstars.com/v1/players/%23${playerTags[0]}/battlelog`,
        url: `https://api.brawlstars.com/v1/players/%238JV0L9RU/battlelog`,
        headers: {
            'Authorization': `Bearer ${API_KEY}`
        }
    })
    .then(response => {
        console.log("Successfully requested one battle")
        // console.log(response.data.items[3].battle.teams[0].length)

        res.send(response.data)

    }).catch(error => {
        console.log(error)
        res.send("Error requesting battle")
    });
});
