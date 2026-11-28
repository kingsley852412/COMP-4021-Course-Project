const express = require("express");

// Additional packages for handling authentication
const argon2 = require("argon2");
const fs = require("fs");
const session = require("express-session");
const { stringify } = require("querystring");
// io sockets
const { createServer } = require("http");
const { Server } = require("socket.io");

// Create the Express app
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Use the session middleware to maintain sessions
const gameSession = session({
    secret: "game",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: { maxAge: 300000 }
});
app.use(gameSession);
// Use the json middleware to parse JSON data
app.use(express.json());

// Use the 'public' folder to serve static files
app.use(express.static("public"));

io.engine.use(gameSession)


// ============= variables ==============
// ============= variables ==============

const score_per_trunk = 10;
const get_bomb_probability = 0.05;

// A JavaScript object storing the players IN THE MATCH (from Lab06, Hand-Game)
let players = {}

// Indicate whether a MATCH has started (from Lab06, Hand-Game)
let gameStarted = false;

// ======================================
// ======================================


// This helper function checks whether the text only contains word characters
function containWordCharsOnly(text) {
    return /^\w+$/.test(text);
}

// treeGenerator(total_length, MIN_GAP = 2, MAX_GAP = 3)
//   -> string of EXACTLY total_length characters.
//      Contains l/r branches separated by MIN_GAP..MAX_GAP 'n's.
//      The tail may be padded with a few extra 'n's to hit the target length.
function treeGenerator(total_length = 100, MIN_GAP = 2, MAX_GAP = 3) {
    if (!Number.isInteger(total_length) || total_length <= 0) return "";

    // leading gap so the first branch doesn't sit at the very bottom
    const leadingGap = Math.min(
        MIN_GAP + Math.floor(Math.random() * (MAX_GAP - MIN_GAP + 1)),
        total_length
    );
    let tree = "n".repeat(leadingGap);

    const MAX_SAME_SIDE_RUN = 2;
    let lastSide = null;
    let sameSideRun = 0;

    while (tree.length < total_length) {
        const remaining = total_length - tree.length;

        // Not enough room for a branch + minimum gap after it -> pad & stop
        if (remaining < 1 + MIN_GAP) {
            tree += "n".repeat(remaining);
            break;
        }

        // Pick a side, forcing a switch if we've been on one side too long
        let side = Math.random() < 0.5 ? "l" : "r";
        if (side === lastSide && sameSideRun >= MAX_SAME_SIDE_RUN) {
            side = side === "l" ? "r" : "l";
        }
        if (side === lastSide) sameSideRun++;
        else { sameSideRun = 1; lastSide = side; }

        tree += side;

        // Gap after this branch, clamped so we never overshoot total_length
        const gap = MIN_GAP + Math.floor(Math.random() * (MAX_GAP - MIN_GAP + 1));
        const room = total_length - tree.length;
        tree += "n".repeat(Math.min(gap, room));
    }

    return tree;
}

// Handle the /register endpoint
app.post("/register", async (req, res) => {
    //
    // C. Reading the json input
    //

    // Get the JSON data from the body
    const { username, avatar, name, password } = req.body;

    //
    // D. Reading the users.json file
    //

    // Add your code here
    let users = JSON.parse(fs.readFileSync("data/users.json"));
    
    //
    // E. Checking for the user data correctness
    //
    
    // Add your code here
    if (username == "" || avatar == "" || name == "" || password == ""){
        res.json({ error: "Username/avatar/name/password cannot be empty." });
        return;
    }

    if (!containWordCharsOnly(username)){
        res.json({ error: "The username can only contain underscores, letters, or numbers" });
        return;
    }

    // console.log(users[username])
    if (users[username]){
        res.json({ error: "The username must not exist in the current list of users" });
        return;
    }

    //
    // G. Adding the new user account
    //

    // Hash the password
    const hash = await argon2.hash(password);

    // Add your code here
    users[username] = {
        "avatar" : avatar, 
        "name" : name,
        "password" : hash,
    };

    console.log(users);

    //
    // H. Saving the users.json file
    //

    // Add your code here
    let json_indent_spaces = 4

    fs.writeFileSync("data/users.json", JSON.stringify(users, null, json_indent_spaces));

    //
    // I. Sending a success response to the browser
    //
    res.json({ success: true });

    // res.json({ error: "Not implemented!" });
});

// Handle the /signin endpoint
app.post("/signin", async (req, res) => {
    // Get the JSON data from the body
    const { username, password } = req.body;

    //
    // D. Reading the users.json file
    //

    // Add your code here
    let users = JSON.parse(fs.readFileSync("data/users.json"));

    //
    // E. Checking for username/password
    //

    // Add your code here
    if (!users[username]){
        res.json({ error: "user not exist." });
        return;
    }

    // REPLACE THIS CODE WITH YOUR CODE
    const user = users[username];

    // If password is incorrect, return an error
    const verified = await argon2.verify(user.password, password);
    if (!verified) {
        res.json({ error: "Incorrect username/password." });
        return;
    }

    //
    // G. Sending a success response with the user account
    //
    req.session.user = {
        username : username, 
        avatar : users[username].avatar, 
        name : users[username].name,    
    }

    // Add your code here
    res.json({"user": req.session.user})
 
    // res.json({ error: "Not implemented!" });
});

// Handle the /validate endpoint
app.get("/validate", (req, res) => {

    //
    // B. Getting req.session.user
    //

    // Add your code here
    const user = req.session.user
    // console.log(user)

    //
    // D. Sending a success response with the user account
    //
    if (!user){
        res.json({ error: "Session not signed in!" });
        return;
    }

    res.json({"user": req.session.user})

    // res.json({ error: "Not implemented!" });
});

// Handle the /signout endpoint
app.get("/signout", (req, res) => {

    //
    // Deleting req.session.user
    //

    // Delete the session information
    if (req.session.user) {
        delete req.session.user;
    }

    //
    // Sending a success response
    //

    res.json({ success: true });
});



" ================ Sockets Below ================ "

// Handle the web socket connection
io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);

    // Wait for a player to join the game
    socket.on("join", () => {
        //
        // Handle the three error cases
        //
        let user = socket.request.session.user;
        let username = user.username

        // Add your code here
        if (gameStarted){
            socket.emit("join_error", "Game has Already Started!");
            return;
        }
        if (Object.keys(players).length >= 2){
            socket.emit("join_error", "2 Players are already in the Game!");
            return;
        }
        for (const key in players){
            if (players[key].username == username){
                socket.emit("join_error", "This Username Already Entered!");
                return;
            }
        }

        console.log("socket.join success!")

        // Put the player in the players object
        players[socket.id] = {
            username, 
            is_winner: false,        // set to false by default
            have_bomb: false, 
            remaining_tree: treeGenerator(),       // a string representing the Tree
            scores: 0,
			dir: 0,
			status: 0
        };

        //
        // Send a success response to the browser
        //
        socket.emit("join_success")

        // Start the Game when there are 2 players
        // also Broadcast to 2 player-browsers
        if (Object.keys(players).length == 2) startGame();

        console.log("Current players -", players); // DON'T DELETE - FOR MARKING
    });

    const startGame = function() {
        //
        // Tell the browsers to start the game
        //
        for (const key in players){
            //init ALL player, resetting their Scores/Winning status/etc...
            const player = players[key];
            player.is_winner =  false
            player.have_bomb =  false
            player.remaining_tree =  treeGenerator()
            player.scores = 0
			player.dir = 0
			player.status = 0;
        }

        gameStarted = true;
        io.emit("game_start", players);      // although all browser recieves signal, only player in match will start game.
    };

    const finishGame = function(winner_socket_id) {
        //
        // Tell the browsers the game has finished
        //
        if (winner_socket_id && players[winner_socket_id]) {
            players[winner_socket_id].is_winner = true;
        }
        else
            console.log("finishGame Error: winner socket id not specified, or not in \"player\"!");

        // Add your code here
        io.emit('game_end', players);

        // Reset the game
        players = {};
        gameStarted = false;
    };

    // In case a player is disconnected from the game
    socket.on("disconnect", () => {
        // Remove the player from the game
        if (!players[socket.id]) return;       // do NOTHING is you are NOT in Match

        if (gameStarted) {              // if there is currently a MATCH
            const opponentId = Object.keys(players).find(id => id !== socket.id);
            finishGame(opponentId);     // announce opponent as Winner
        }

        delete players[socket.id];      // remove u from the MATCH
    });
	
	const handleIdle = function (){
		if (!gameStarted) return;
        if (!players[socket.id]) return;
		const player = players[socket.id];
		player.status = 0;
		io.emit("game_state_update", players);
	}

    // ── shared chop logic ─────────────────────────────────
    const handleChop = function (side) {           // side is "l" or "r"
        if (!gameStarted) return;
        if (!players[socket.id]) return;

        if (side != 'l' && side != 'r'){
            console.log("error in handleChop(): invalid input parameter!");
            return;
        }

        const player = players[socket.id];

        // Defensive: shouldn't happen during normal play
        if (player.remaining_tree.length <= 0) {
            const opponentId = Object.keys(players).find(id => id !== socket.id);
            finishGame(opponentId);
            return;
        }

        const current_trunk = player.remaining_tree[0];   // timberman's current level
        const next_trunk    = player.remaining_tree[1];   // the one directly above (may be undefined)
		
		if (side === 'l') player.dir = 1;
		else player.dir = 2;
		player.status = 1;
		socket.emit("play_sfx", { sound: "chop" });

        // ── DEATH CHECK ──
        // e.g. Pressing left when the NEXT trunk has a left branch (or right/right) = hit it
        if (next_trunk === side) {
            const opponentId = Object.keys(players).find(id => id !== socket.id);
            finishGame(opponentId);
            return;
        }

        // ── SUCCESS ──
        // Consume the current trunk (timberman moves up)
        player.remaining_tree = player.remaining_tree.slice(1);
        player.scores += score_per_trunk;
		
		

        // 5% chance to gain a bomb
        if (Math.random() < get_bomb_probability) {
            player.have_bomb = true;
			socket.emit("play_sfx", { sound: "bomb_pickup" });
        }

        // Sync both browsers
        io.emit("game_state_update", players);

        // If the tree is now empty, this player cleared it → they win
        if (player.remaining_tree.length === 0) {
            finishGame(socket.id);
        }
    };

    // ── wire up both keys ────────────────────────────────
    socket.on("left_key",  () => handleChop("l"));
    socket.on("right_key", () => handleChop("r"));
	
	socket.on("key_up", () => handleIdle());

    socket.on("spacebar", () => {
        if (!gameStarted) return;
        if (!players[socket.id]) return;

        const player = players[socket.id];

        // No bomb → nothing happens (safest UX: ignore the press)
        if (!player.have_bomb) return;

        // Consume the bomb
        player.have_bomb = false;
		player.status = 2;
		socket.emit("play_sfx", { sound: "bomb" });

        // Clear up to 10 trunks from the front of the tree.
        // Math.min handles the "fewer than 10 left" case without going negative.
        const clearCount = Math.min(10, player.remaining_tree.length);
        player.remaining_tree = player.remaining_tree.slice(clearCount);
        player.scores += clearCount * score_per_trunk;

        // Sync both browsers so they see the shortened tree + bomb gone
        io.emit("game_state_update", players);

        // If they bombed their way to the top → they win
        if (player.remaining_tree.length === 0) {
            finishGame(socket.id);
        }
    });

    socket.on("cheat_key", () => {
        if (!gameStarted) return;
        if (!players[socket.id]) return;

        const player = players[socket.id];

        // Give Free bomb
        player.have_bomb = true;
		socket.emit("play_sfx", { sound: "bomb_pickup" });

        // Sync both browsers so they see the free Bomb
        io.emit("game_state_update", players);

    });

	

});


// Use a web server to listen at port 8000
httpServer.listen(8000, () => {
    console.log("The game server has started...");
});