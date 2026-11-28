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

    // This function sets the bracnch direction of the tree.
    // `"right"`, `"left"`, `"nothing"
    const setDirection = function(direction) {
        sprite.setSequence(sequences[direction]);
		d = direction;
    };

	
	const getDirection = function() {
        return d;
    };

    // The methods are returned as an object here.
    return {
        getXY: sprite.getXY,
        setXY: sprite.setXY,
        setDirection: setDirection,
		getDirection: getDirection,
        getBoundingBox: sprite.getBoundingBox,
        draw: sprite.draw,

    };
};
