const AudioManager = (function() {
    const sounds_folder_path = "sounds"
    const sounds = {
        background: new Audio(sounds_folder_path + "/background.mp3"),
        collect: new Audio(sounds_folder_path + "/collect.mp3"),
        gameover: new Audio(sounds_folder_path + "/gameover.mp3"),
        gamewin: new Audio(sounds_folder_path + "/gamewin.mp3"),
        buttonClick: new Audio(sounds_folder_path + "/buttonClick.mp3"),
    }

    // Configure background music to loop automatically
    sounds.background.loop = true;
    sounds.background.volume = 0.4;

    const init = function(socket) {
        console.log('AudioManager.init() running')
        
        // Also pass Socket instance in this function, for setting up Socket-related functions
        if (!socket)
            console.warn(`warning: audioManager.init() socket not passed in!`);

        // all button plays click sound, when clicked
        $('button').on('click', () => {
            playSFX('buttonClick');
        });

        // play BGM when game_start
        socket.on('game_start', (players) => {
            startBGM();
        });
        
        // stop BGM when game_end
        socket.on('game_end', (players) => {
            stopBGM();

            const me = players[socket.id];         // ← your own entry

            if (me.is_winner)
                playSFX('gamewin')
            else
                playSFX('gameover')
        });

        
    }

    const startBGM = function() {
        sounds.background.play().catch(err => {
            console.log("BGM autoplay prevented. Waiting for user interaction.", err);
        });
    };

    const stopBGM = function() {
        sounds.background.pause();
        sounds.background.currentTime = 0; // Reset music to the beginning
    };

    const playSFX = function(soundName) {
        const sound = sounds[soundName];

        if (soundName == "background"){
            console.warn(`warning: use startBGM() to play the BGM instead!`);
        }

        if (sound) {
            // Clone the node so rapid sound triggers don't cut each other off
            sound.play().catch(err => {
                console.log(`SFX "${soundName}" play blocked:`, err);
            });
        }
        else {
            console.warn(`Sound effect "${soundName}" not found in AudioManager.`);
        };
    };

    return {
        init,

        startBGM,
        stopBGM,
        playSFX,
    };
})();
