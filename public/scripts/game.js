const GameRoom = (function() {
    // This stores the signed in user
    let user = null;

    // this stores the socket, which will be created after Successful Login
    let socket = null;

    // this stores whether the player is during a match or in match-making page
    let in_game = false;

    const init = function() {
        // Populate the avatar selection
        Avatar.populate($("#register-avatar"));

        $("#start-signin-button").on("click", function() {
            // Show the signin page
            $("#game-room-start-page").hide();
            $("#game-room-signin-page").show();
            $("#signin-form").get(0).reset();
            $("#signin-message").text("");
        });

        $("#start-register-button").on("click", function() {
            // Show the register page
            $("#game-room-start-page").hide();
            $("#game-room-register-page").show();
            $("#register-form").get(0).reset();
            $("#register-message").text("");
        });

        $(".back-button").on("click", function() {
            // Show the start page
            $("#game-room-start-page").show();
            $("#game-room-signin-page").hide();
            $("#game-room-register-page").hide();
        });

        $("#register-button").on("click", function(e) {
            // Do not submit the form
            e.preventDefault();

            //
            // A. Preparing the user data
            //

            // Get the input fields
            const username = $("#register-username").val().trim();
            const avatar   = $("#register-avatar").val();
            const name     = $("#register-name").val().trim();
            const password = $("#register-password").val().trim();
            const confirmPassword = $("#register-confirm").val().trim();

            // Password and confirmation does not match
            if (password != confirmPassword) {
                $("#register-message").text("Passwords do not match.");
                return;
            }
            
            // Create the JSON data
            const json = JSON.stringify({ username, avatar, name, password });

            //
            // B. Sending the AJAX request to the server
            //

            // Send a register request
            fetch("/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: json
            })
                .then((res) => res.json())
                .then((json) => {
                    console.log("Endpoint '/register' -", json); // FOR MARKING - DON'T DELETE

                    //
                    // F. Processing any error returned by the server
                    //
                    if (json.error) {
                        $("#register-message").text(json.error);
                        return;
                    }

                    //
                    // J. Handling the success response from the server
                    //
                    $("#register-form").get(0).reset();
                    $("#register-message").text("Your account has been successfully registered.");
                })
                .catch((err) => {
                    $("#register-message").text(err);
                });
        });

        $("#signin-button").on("click", function(e) {
            // Do not submit the form
            e.preventDefault();

            // Get the input fields
            const username = $("#signin-username").val().trim();
            const password = $("#signin-password").val().trim();

            //
            // A. Preparing the user data
            //

            // Create the JSON data
            const json = JSON.stringify({ username, password });

            //
            // B. Sending the AJAX request to the server
            //
            
            // Send a signin request
            fetch("/signin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: json
            })
                .then((res) => res.json())
                .then((json) => {
                    console.log("Endpoint '/signin' -", json); // FOR MARKING - DON'T DELETE

                    //
                    // F. Processing any error returned by the server
                    //
                    if (json.error) {
                        $("#signin-message").text(json.error);
                        return;
                    }

                    //
                    // H. Handling the success response from the server
                    //

                    // Set the user information
                    user = json.user;
                    $("#game-room-user-avatar").html(Avatar.getCode(user.avatar));
                    $("#game-room-user-name").text(user.name);

                    // Connect to the Socket.IO socket, and do Socket Init
                    init_socket()

                    // Show the content page
                    $("#game-room-signin-page").hide();
                    load_before_joining_page();
                })
                .catch((err) => {
                    $("#signin-message").text(err);
                });
        });

        // Click event for the signout button(s)
        $("#signout-button").on("click", logout);
        $("#game-over-logout-button").on("click", function(e){
            // Do not submit the form
            e.preventDefault();

            $("#game-over-page").hide()
            logout();
        });

        $("#play-again-button").on("click", function(e) {
            // Do not submit the form
            e.preventDefault();
            
            $("#game-over-page").hide()
            load_before_joining_page()
        });
        

        // Click event for the join game button
        // Enter Match-Making
        $("#join-game-button").on("click", function(e) {
            // Do not submit the form
            e.preventDefault();

            if (!socket) {
                $("#join-message").text("Socket not connected. Please try again.");
                return;
            }

            // Send a join_game request via socket
            socket.emit("join");
        });

        $(document).on("keydown", function(e) {
            // Only react when the game page is actually shown
            if (!$("#timberman-game-page").is(":visible")) return;

            switch (e.key) {
                case "ArrowLeft":
                    e.preventDefault();
                    console.log("left pressed");
                    // → chop left / move left / whatever Timberman does
                    socket.emit("left_key")
                    break;

                case "ArrowRight":
                    e.preventDefault();
                    console.log("right pressed");
                    // → chop right
                    socket.emit("right_key")
                    break;

                case " ":              // ← the spacebar is the string " "
                case "Spacebar":       // older browsers
                    e.preventDefault();
                    console.log("space pressed");
                    socket.emit("spacebar")
                    // → use Bomb
                    break;

                case "b":       // cheat Key, Give a Free Bomb
                    e.preventDefault();
                    console.log("Cheat key pressed");
                    socket.emit("cheat_key");   // ← same server event as spacebar
                    break;
            }
        });
    }

    const validate = function() {
        // Send a validate request
        fetch("/validate")
            .then((res) => res.json())
            .then((json) => {
                console.log("Endpoint '/validate' -", json); // FOR MARKING - DON'T DELETE

                //
                // C. Processing any error returned by the server
                //

                if (json.error) {
                    console.log(json.error);
                    return;
                }

                //
                // E. Handling the success response from the server
                //

                // Set the user information
                user = json.user;
                $("#game-room-user-avatar").html(Avatar.getCode(user.avatar));
                $("#game-room-user-name").text(user.name);

                // Connect to the Socket.IO socket
                init_socket();

                // Show the content page
                $("#game-room-start-page").hide();
                load_before_joining_page();
            })
            .catch((err) => {
                console.log(err);
            });
    }

    const init_socket = function() {
        if (socket) return;     // does NOT re-connect
        socket = io();
        
        socket.on("join_error", (error) => {
            // when cant join due to reasons:
            // there is a on-going match
            // there is already 2 players
            // etc.
            $("#join-message").text(error)  // shows the error to User
        });

        socket.on("join_success", () => {
            // switch to match making page
            $("#join-message").text("");              // ← clear old error message
            $("#before-joining-page").hide();
            $("#match-making-page").show();

            in_game = true;     // the player is in MATCH-MAKING now
        });

        socket.on("game_start", (players) => {
            // if this player isnt the 2 players in the match/matchmaking, Do NOTHING!
            if (!in_game) return;

            // switch to gameplay page
            $("#match-making-page").hide();
            $("#timberman-game-page").show();

            render_game(players)
        });

        socket.on("game_state_update", (players) => {
            // if this player isnt the 2 players in the match, Do NOTHING!
            if (!in_game) return;

            render_game(players)
        });

        socket.on("game_end", (players) => {
            // if this player isnt the 2 players in the match, Do NOTHING!
            if (!in_game) return;

            in_game = false;

            $("#timberman-game-page").hide();
            $("#game-over-page").show();

            // shows the Game Scores here...
            const me = players[socket.id];         // ← your own entry

            // and you can find the opponent by removing yourself:
            const opponentId = Object.keys(players).find(id => id !== socket.id);
            const opponent = players[opponentId];

            $("#player-score").text(me.scores);
            $("#opponent-score").text(opponent.scores);
    
            if (me.is_winner)
                $('#game-over-message').text("You Win!!!")
            else
                $('#game-over-message').text("You Lose!!!")

        });

    }

    const logout = function(e) {
        // Do not submit the form
        if (e != null)
            e.preventDefault();

        // Send a signout request
        fetch("/signout")
            .then((res) => res.json())
            .then((json) => {
                console.log("Endpoint '/signout' -", json); // FOR MARKING - DON'T DELETE

                if (json.error) {
                    console.log(json.error);
                    return;
                }

                // Clear the user information
                user = null;

                if (socket) {
                    socket.disconnect();
                    socket = null;
                }

                // Show the start page
                $("#before-joining-page").hide();
                $("#game-room-start-page").show();
            })
            .catch((err) => {
                console.log(err);
            });
    }

    // helper function for slicing the first 10 char in the Tree strings
    const short = (v) => String(v ?? "").slice(0, 10);

    const render_game = function(players) {
        const me = players[socket.id];         // ← your own entry

        // Now `me` is { username, remaining_tree, ... }
        // and you can find the opponent by removing yourself:
        const opponentId = Object.keys(players).find(id => id !== socket.id);
        const opponent = players[opponentId];

        $("#player-tree").text("You: "      + short(me.remaining_tree));
        $("#opponent-tree").text("Opponent: " + short(opponent.remaining_tree));
        
        if (me.have_bomb)
            $("#player-bomb").text("YES Bomb!!!")
        else
            $("#player-bomb").text("no Bomb...")

        if (opponent.have_bomb)
            $("#opponent-bomb").text("YES Bomb!!!")
        else
            $("#opponent-bomb").text("no Bomb...")
    }

    const load_before_joining_page = function() {
        $("#before-joining-page").show();
        $('#join-message').text("")
    }

    return { init, validate };
})();
