const AudioManager = (function() {
    const sounds_folder_path = "sounds"
    const sounds = {
        collect:        new Audio(sounds_folder_path + "/collect.mp3"),
        gameover:       new Audio(sounds_folder_path + "/gameover.mp3"),
        gamewin:        new Audio(sounds_folder_path + "/gamewin.mp3"),
        buttonClick:    new Audio(sounds_folder_path + "/buttonClick.mp3"),
    }

    const musics = {
        background:         new Audio(sounds_folder_path + "/background.mp3"),
        gameroomBackground: new Audio(sounds_folder_path + "/gameroomBackground.mp3")
    }

    for (const key in musics) {
        // Configure every music to loop automatically
        musics[key].loop = true;
        musics[key].volume = 0.4;
    };

    let currentBGM = null;   // key of the BGM track currently playing

    const init = function(socket) {
        console.log('AudioManager.init() running')
        
        playBGM('gameroomBackground');

        // Also pass Socket instance in this function, for setting up Socket-related functions
        if (!socket)
            console.warn(`warning: audioManager.init() socket not passed in!`);

        // all button plays click sound, when clicked
        $('button').on('click', () => {
            playSFX('buttonClick');
        });

        // play BGM when game_start
        socket.on('game_start', (players) => {
            playBGM('background');
        });
        
        // stop BGM when game_end
        socket.on('game_end', (players) => {
            playBGM('gameroomBackground')

            const me = players[socket.id];         // ← your own entry

            if (me.is_winner)
                playSFX('gamewin')
            else
                playSFX('gameover')
        });

        
    }

    const playBGM = function(trackName) {
        if (!trackName) stopBGM();

        const track = musics[trackName];

        if (!track) {
            console.warn(`BGM "${trackName}" not found in AudioManager.`);
            return;
        }

        // Stop everything that isn't the requested track
        stopBGM();

        track.currentTime = 0;

        currentBGM = trackName;
        track.play().catch(err => {
            console.log(`BGM "${trackName}" play blocked:`, err);
        });
    };

    const stopBGM = function() {
        for (const key in musics) {
            musics[key].pause();
            musics[key].currentTime = 0;
        }
        currentBGM = null;
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

        // playBGM,
        // playSFX,  // no need to export, all binding are done in this file
    };
})();
