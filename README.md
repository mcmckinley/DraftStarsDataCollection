# Brawl Stars Data Collection
### Michael McKinley
Summer 2024

This program collects and parses data from Brawl Stars matches. The data will be used to train an AI model whose goal is to predict the outcome of matches in Brawl Stars.

The program does the following:
    - Collect a list of player tags (collect/get_player_tags.js)
    - Request battle logs (info on the 25 most recent games) of the players specified above (collect/get_battles.js)
    - Create a CSV file to be interpreted by the AI model (clean/csv.js)

# How to use:

1. Create an API key

Go to https://developer.brawlstars.com/#/, create an account and an API key.

Add the API key into the `.env` file. It should look like API_KEY="123abc". 


2. Collect player tags
```
node collect/get_player_tags.js
```

3. Collect battle data
```
node collect/get_battles.js
```

4. Convert the data from JSON to CSV
```
node clean/csv.js
```