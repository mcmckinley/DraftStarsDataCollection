# Draft Stars Data Collection

This program collects and parses data from Brawl Stars matches.

Its functionalities include:
* Collecting a list of player tags (collect/get_player_tags.js)
* Requesting battle logs of the players specified above (collect/get_battles.js)
* Converting the data to CSV (clean/csv.js)

# How to use:

1. Create an API key

Go to https://developer.brawlstars.com/#/, create an account and generate an API key.

Add the API key into the `.env-example` file, and rename the file to `.env`.

2. Install packages
```
npm install
```

3. Collect player tags
```
node collect/get_player_tags.js
```

4. Collect battle data
```
node collect/get_battles.js
```

5. Convert the data from JSON to CSV
```
node clean/csv.js
```
