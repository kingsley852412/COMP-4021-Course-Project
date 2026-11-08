**_Overview_**

- this game imitates the game <a href = "https://store.steampowered.com/app/398710/Timberman/">Timberman</a>
- This Project is a 2 player pvp game, competing to cut 100 trunk (safely)
- this game is a Combination of Lab05 and Lab06. Mostly Based on Lab05

**_==============================================================_**

**_Game Rules_**

- cutting tree in the wrong side immediately loses
- leaving mid-game immediately loses
- cutting trunk gives a **bomb** with random probability
- a bomb removes some trunks
- cutting/bombing trunks gives scores
- finish cutting the tree wins the game 

**_==============================================================_**

**_Sockets API:_**

**Browser Recieves:**
- join_error
- join_success
- game_start
- game_state_update
- game_end

**Server Recieves:**
- join
- disconnect
- left_key
- right_key
- spacebar
- cheat_key (which is the "b" key)
