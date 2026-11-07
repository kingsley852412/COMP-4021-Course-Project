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

// A JavaScript object storing the players (from Lab06, Hand-Game)
let players = {}

// Indicate whether a game has started (from Lab06, Hand-Game)
let gameStarted = false;

// ======================================
// ======================================


// This helper function checks whether the text only contains word characters
function containWordCharsOnly(text) {
    return /^\w+$/.test(text);
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

        // Put the player in the players object
        players[socket.id] = { username, ready: false };

        //
        // Send a success response to the browser
        //
        socket.emit("join_success")

        //
        // For the main page: broadcast the players to the connected browsers
        //

        // Add your code here   (TODO!!!!!!!!!, switch these from lab to project codes)
        io.emit("update_players", players)

        console.log("Current players -", players); // DON'T DELETE - FOR MARKING
    });

    const startGame = function() {
        //
        // Tell the browsers to start the game
        //

        // Add your code here

        gameStarted = true;
    };

    // Wait for a player to get ready in the game
    socket.on("ready", () => {
        // Mark the player as ready
        players[socket.id]["ready"] = true;

        //
        // Broadcast the players to the connected browsers
        //

        // Add your code here
        io.emit("update_players", players);


        //
        // Check if everybody is ready;
        // if so, start the game automatically
        //

        // Add your code here
        let all_ready = true;
        for (const id in players) {
            const player = players[id];

            // Check the status of each player
            if (!player["ready"]){
                all_ready = false;
                break;
            }
        }
        if (all_ready){
            gameStarted = true;
            io.emit("game_start");
        }

        console.log("Current players -", players); // DON'T DELETE - FOR MARKING
    });

    const finishGame = function() {
        //
        // Tell the browsers the game has finished
        //

        // Add your code here
        io.emit('game_end', players);

        // Reset the game
        players = {};
        gameStarted = false;
    };

    // Set up the choose event
    socket.on("choose", (sign) => {
        // Assign the sign to the player
        players[socket.id]["sign"] = sign;

        //
        // Check if everybody has selected a hand sign;
        // if so, the game will finish
        //

        // Add your code here
        let all_chosen = true;
        for (const id in players){
            let player = players[id];

            if (!player["sign"]){
                all_chosen = false;
                return;
            }
        }
        if (all_chosen){
            finishGame()
        }

        console.log("Current players -", players); // DON'T DELETE - FOR MARKING
    });

    // In case a player is disconnected from the game
    socket.on("disconnect", () => {
        // Remove the player from the game
        if (players[socket.id]) {
            delete players[socket.id];

            // Broadcast the players to the connected browsers
            io.emit("update_players", players);
        }
    });
});



// Use a web server to listen at port 8000
// app.listen(8000, () => {
//     console.log("The game server has started...");
// });
httpServer.listen(8000, () => {
    console.log("The game server has started...");
});