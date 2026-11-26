const GameRoom = (function() {
    // This stores the signed in user
    let user = null;

    // this stores the socket, which will be created after Successful Login
    let socket = null;

    // this stores whether the player is during a match or in match-making page
    let in_game = false;
	
	// Players
	const tree_cv = $("#tree-canvas").get(0);
	const tree_context = tree_cv.getContext("2d");
	
	const player_cv = $("#player-canvas").get(0);
	const player_context = player_cv.getContext("2d");
	
	
	

    const init = function() {
        console.log('GameRoom.init() running')

        // Populate the avatar selection
        Avatar.populate($("#register-avatar"));
		
		$("#start-signin-button, #start-register-button, #join-game-button").on("click", function() {
			AudioManager.playBgm(0.5);
		});
		
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
                    init_socket();

                    // after init socket, init AudioManager
                    AudioManager.init(socket)


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
		
		$(document).on("keyup", function(e) {
			if (!$("#timberman-game-page").is(":visible")) return;
			e.preventDefault();
			socket.emit("key_up");
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
    
            if (me.is_winner){
                $('#game-over-message').text("You Win!!!");
				AudioManager.playSfx("win", 1);
            }else{
                $('#game-over-message').text("You Lose!!!");
				AudioManager.playSfx("lose", 1);
			}
        });
		
		socket.on("play_sfx", ({ sound, volume }) => {
			AudioManager.playSfx(sound, volume);
}		);

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
    // const short_old = (v) => String(v ?? "").slice(0, 10);
	const short = (v) => String(v ?? "").slice(0, 6);

    const render_game = function(players) {
        const me = players[socket.id];         // ← your own entry

        // Now `me` is { username, remaining_tree, ... }
        // and you can find the opponent by removing yourself:
        const opponentId = Object.keys(players).find(id => id !== socket.id);
        const opponent = players[opponentId];
		
		
		
		
		// Draw Trees. There are only 6 visible choppable tree logs. Inside the array, the unchoppable bottom tree trunk is at treeLogs[0], choppable tree log is at treeLogs[1-6].
		const me_treeLogs = [];
		const treebottom1 = Tree(tree_context, 500, 154*6, "bottom");
		tree_context.clearRect(0, 0, 1920, 1080);
		
		//treebottom1.draw();
		me_treeLogs.push(treebottom1);
		for (let i = 0; i < 6; i++){
				if (me.remaining_tree[i] === 'n'){
					const treelog = Tree(tree_context, 500, (5-i)*154, "nothing");
					//treelog.draw();
					me_treeLogs.push(treelog);
				}else if (me.remaining_tree[i] === 'l'){
					const treelog = Tree(tree_context, 500, (5-i)*154, "left");
					//treelog.draw();
					me_treeLogs.push(treelog);
				}else if (me.remaining_tree[i] === 'r'){
					const treelog = Tree(tree_context, 500, (5-i)*154, "right");
					//treelog.draw();
					me_treeLogs.push(treelog);
				}
		}
		for (log of me_treeLogs){
			log.draw();
		}
		
	
		const opponent_treeLogs = [];
		const treebottom2 = Tree(tree_context, 1400, 154*6, "bottom");
		treebottom2.draw();
		opponent_treeLogs.push(treebottom2);
		for (let i = 0; i < 6; i++){
				if (opponent.remaining_tree[i] === 'n'){
					const treelog = Tree(tree_context, 1400, (5-i)*154, "nothing");
					treelog.draw();
					opponent_treeLogs.push(treelog);
				}else if (opponent.remaining_tree[i] === 'l'){
					const treelog = Tree(tree_context, 1400, (5-i)*154, "left");
					treelog.draw();
					opponent_treeLogs.push(treelog);
				}else if (opponent.remaining_tree[i] === 'r'){
					const treelog = Tree(tree_context, 1400, (5-i)*154, "right");
					treelog.draw();
					opponent_treeLogs.push(treelog);
				}
		}
		

		// draw players		
		player_context.clearRect(0, 0, 1920, 1080);
		const gameArea = BoundingBox(tree_context, 0, 0, 1920, 1080);
		//const { x1, y1 } = img_player.getXY();
		const img_player = Player(player_context, 0, 0, gameArea, 0, me.dir, me.status); // The player
		//const { x2, y2 } = img_opponent.getXY();
		const img_opponent = Player(player_context, 0, 0, gameArea, 1, opponent.dir, opponent.status);
		
		img_player.draw();
		img_opponent.draw();


        $("#player-tree").text("You: "      + short(me.remaining_tree));
        $("#opponent-tree").text("Opponent: " + short(opponent.remaining_tree));
		
		
		// check bomb
		const BOMB_IMG = "../images/bombYes.png";
		const NO_BOMB_IMG = "../images/bombNo.png";

		if (me.have_bomb) {
			$("#player-bomb").attr("src", BOMB_IMG);
		} else {
			$("#player-bomb").attr("src", NO_BOMB_IMG);
		}

		if (opponent.have_bomb) {
			$("#opponent-bomb").attr("src", BOMB_IMG);
		} else {
			$("#opponent-bomb").attr("src", NO_BOMB_IMG);
		}
        
    }

    const load_before_joining_page = function() {
        $("#before-joining-page").show();
        $('#join-message').text("")
    }

    return {
        init,
        validate, 
    };
})();
