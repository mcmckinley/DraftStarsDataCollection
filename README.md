# Brawl Stars Data Collection
### Michael McKinley
Summer 2024

This program collects and parses data from Brawl Stars matches. The data will be used to train an AI model whose goal is to predict the outcome of matches in Brawl Stars.

The program does the following:
    - Collect a list of 6000 player tags (collect/get_player_tags.js)
    - Request battle logs (info on their most recent 25 battles) of the players specified above (collect/get_battles.js)
    - Seperate the data into folders/files by game mode/map (distribute/distribute.js)
    - Create a CSV file which can be interpreted by a neural network (distribute/create_csv.js)


# File Overview

# How to use:

1. Collect battle data
```
node get_battles.js
```

