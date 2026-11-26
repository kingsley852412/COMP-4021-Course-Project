// This function defines the Gem module.
// - `ctx` - A canvas context for drawing
// - `x` - The initial x position of the gem
// - `y` - The initial y position of the gem
// - `color` - The colour of the gem
const Tree = function(ctx, x, y, direction) {

    // This is the sprite sequences of the gem of four colours
    // `green`, `red`, `yellow` and `purple`.
    const sequences = {
        nothing:  { x: 0, y:  0, width: 869, height: 154, count: 1, timing: 200, loop: false },
        right:    { x: 0, y: 154, width: 869, height: 154, count: 1, timing: 200, loop: false },
        left: { x: 0, y: 308, width: 869, height: 154, count: 1, timing: 200, loop: false },
		bottom: { x: 0, y: 462, width: 869, height: 154, count: 1, timing: 200, loop: false },
    };
	let d = direction;
    // This is the sprite object of the gem created from the Sprite module.
    const sprite = Sprite(ctx, x, y);

    // The sprite object is configured for the gem sprite here.
    sprite.setSequence(sequences[direction])
          .setScale(1)
          .useSheet("../images/tree.png");
		  //.setShadowScale({ x: 0.75, y: 0.2 })

    // This is the birth time of the gem for finding its age.
    //let birthTime = performance.now();

    // This function sets the bracnch direction of the tree.
    // `"right"`, `"left"`, `"nothing"
    const setDirection = function(direction) {
        sprite.setSequence(sequences[direction]);
		d = direction;
        //birthTime = performance.now();
    };

    // This function gets the age (in millisecond) of the gem.
    // - `now` - The current timestamp
    const getAge = function(now) {
        return now - birthTime;
    };
	
	const getDirection = function() {
        return d;
    };

     //This function randomizes the gem colour and position.
    // - `area` - The area that the gem should be located in.
    const randomize = function(area) {
        /* Randomize the color */
        const colors = ["green", "red", "yellow", "purple"];
        setColor(colors[Math.floor(Math.random() * 4)]);

        /* Randomize the position */
        const {x, y} = area.randomPoint();
        sprite.setXY(x, y);
    };
	
	const del = function(){
		sprite.useSheet("");
	}

    // The methods are returned as an object here.
    return {
        getXY: sprite.getXY,
        setXY: sprite.setXY,
        setDirection: setDirection,
		getDirection: getDirection,
        //getAge: getAge,
        getBoundingBox: sprite.getBoundingBox,
        //randomize: randomize,
        draw: sprite.draw,
        update: sprite.update,
		del: del
    };
};
