const AudioManager = (function() {
    const bgm = new Audio("../audio/background.mp3");
    bgm.loop = true;
    bgm.volume = 0.5;

    const sfxSources = {
        chop: "../audio/chop.mp3",
        bomb: "../audio/bomb.mp3",
        bomb_pickup: "../audio/bomb_pickup.mp3",
        win: "../audio/win.mp3",
        lose: "../audio/lose.mp3"
    };

    let muted = false;

    const playBgm = function(volume = 0.5) {
        if (muted) return;
        bgm.play().catch(() => {
            // Browser may block autoplay until a user gesture occurs
        });
    };

    const stopBgm = function() {
        bgm.pause();
        bgm.currentTime = 0;
    };

    const playSfx = function(name, volume = 0.7) {
        if (muted || !sfxSources[name]) return;
        const sound = new Audio(sfxSources[name]);
        sound.volume = volume;
        sound.play().catch(() => {});
    };

    const setMuted = function(value) {
        muted = Boolean(value);
        if (muted) {
            bgm.pause();
        } else if ($("#timberman-game-page").is(":visible")) {
            playBgm();
        }
    };

    const isMuted = function() {
        return muted;
    };

    return { playBgm, stopBgm, playSfx, setMuted, isMuted };
})();