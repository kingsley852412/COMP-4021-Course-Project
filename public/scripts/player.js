// This function defines the Player module.
// - `ctx` - A canvas context for drawing
// - `x` - The initial x position of the player
// - `y` - The initial y position of the player
// - `gameArea` - The bounding box of the game area
const Player = function(ctx, x, y, gameArea, col, dir, status) {

    // This is the sprite sequences of the player facing different directions.
    // It contains the idling sprite sequences `idleLeft`, `idleUp`, `idleRight` and `idleDown`,
    // and the moving sprite sequences `moveLeft`, `moveUp`, `moveRight` and `moveDown`.
    const sequences = {
        /* Blue man */
        blueIdleL:  { x: 0, y: 0, width: 357, height: 280, count: 1, timing: 100, loop: false },
        blueChopL:    { x: 357, y: 0, width: 357, height: 280, count: 1, timing: 100, loop: false },
        blueIdleR: { x: 357*2, y: 0, width: 357, height: 280, count: 1, timing: 100, loop: false },
        blueChopR:  { x: 357*3, y:  0, width: 357, height: 280, count: 1, timing: 100, loop: false },
		blueBombL:  { x: 0, y:  560, width: 357, height: 280, count: 1, timing: 100, loop: false },
		blueBombR:  { x: 357, y:  560, width: 357, height: 280, count: 1, timing: 100, loop: false },

        /* Green man */
        greenIdleL:  { x: 0, y: 280, width: 357, height: 280, count: 1, timing: 100, loop: false },
        greenChopL:    { x: 357, y: 280, width: 357, height: 280, count: 2, timing: 100, loop: false },
        greenIdleR: { x: 357*2, y: 280, width: 357, height: 280, count: 1, timing: 100, loop: false },
        greenChopR:  { x: 357*3, y: 280, width: 357, height: 280, count: 2, timing: 100, loop: false },
		greenBombL:  { x: 357*2, y:  560, width: 357, height: 280, count: 1, timing: 100, loop: false },
		greenBombR:  { x: 357*3, y:  560, width: 357, height: 280, count: 1, timing: 100, loop: false }
    };

    // This is the sprite object of the player created from the Sprite module.
    

    // This function sets the player's chopping direction.
    // - `dir` - the chopping direction  
    const chop = function(dir) {
		
        if (dir >= 1 && dir <= 2) {
			const { x, y } = sprite.getXY(); 
			//console.log('og: ', x, ' ', y);
			if (color === 0){ // player blue
			//console.log('dir: ', dir);
				switch (dir) {
					case 1: {
						sprite.setSequence(sequences.blueChopL);  
						sprite.setXY(330, y); 
						break;
					}
					case 2: {
						sprite.setSequence(sequences.blueChopR);
						sprite.setXY(330 + 300 , y); 
						break;
					}
				}
			}else{ //oppo
				switch (dir) {
					case 1: {
						sprite.setSequence(sequences.greenChopL); 
						sprite.setXY(1580 - 300, y); 
						break;
					}
					case 2: {
						sprite.setSequence(sequences.greenChopR); 
						sprite.setXY(1580, y);			
						break;
					}
				}
			}
			sprite.draw();
            direction = dir;
        }
    };
	
	const bomb = function(dir) {	
        if (dir >= 1 && dir <= 2) {
			const { x, y } = sprite.getXY(); 
			if (color === 0){ // player blue
				switch (dir) {
					case 1: {
						sprite.setSequence(sequences.blueBombL);  
						sprite.setXY(330, y); 
						break;
					}
					case 2: {
						sprite.setSequence(sequences.blueBombR);
						sprite.setXY(330 + 300 , y); 
		
						break;
					}
				}
			}else{ //oppo
				switch (dir) {
					case 1: {
						sprite.setSequence(sequences.greenBombL); 
						sprite.setXY(1580 - 300, y); 
						break;
					}
					case 2: {
						sprite.setSequence(sequences.greenBombR); 
						sprite.setXY(1580, y);			
						break;
					}
				}
			}
			sprite.draw();
            direction = dir;
        }
    };

    // This function stops the player from moving.
    // - `dir` - the moving direction when the player is stopped (1: Left, 2: Up, 3: Right, 4: Down)
    const stop = function() {
        if (direction >= 1 && direction <= 2) {
			const { x, y } = sprite.getXY(); 
            if (color === 0){ // player blue
				switch (dir) {
					case 1: {
						sprite.setSequence(sequences.blueIdleL);  
						sprite.setXY(330, y); 
						
						break;
					}
					case 2: {
						sprite.setSequence(sequences.blueIdleR);
						sprite.setXY(330 + 300 , y); 
				
						break;
					}
				}
			}else{ //oppo
				switch (dir) {
					case 1: {
						sprite.setSequence(sequences.greenIdleL); 
						sprite.setXY(1580 - 300, y); 
			
						break;
					}
					case 2: {
						sprite.setSequence(sequences.greenIdleR); 
						sprite.setXY(1580, y);
									
						break;
					}
				}
			}
			
        }
    };

    // This function updates the player depending on his movement.
    // - `time` - The timestamp when this function is called
    const update = function(time) {
        /* Update the player if the player is moving */
        if (direction != 0) {
            let { x, y } = sprite.getXY();

            /* Move the player */
            switch (direction) {
                case 1: x -= speed / 60; break;
                case 2: y -= speed / 60; break;
                case 3: x += speed / 60; break;
                case 4: y += speed / 60; break;
            }

            /* Set the new position if it is within the game area */
            if (gameArea.isPointInBox(x, y))
                sprite.setXY(x, y);
        }

        /* Update the sprite object */
        sprite.update(time);
    };
	
	
	const sprite = Sprite(ctx, x, y);

    // The sprite object is configured for the player sprite here.
    sprite.setSequence(sequences.blueIdleL)
          .setScale(1)
          .setShadowScale({ x: 0.75, y: 0.20 })
		  .setXY(330, 820)
          .useSheet("../images/player.png");

    // This is the moving direction, which can be a number from 0 to 2:
	// - `0` - initial direction
    // - `1` - left
	// - `2` - right

    let direction = dir;

    // This is the moving speed (pixels per second) of the player
    let speed = 150;
	
	const color = col; // player: 0 , oppo: 1
	if (color === 1 && direction === 0){  //initialization for opponent
		sprite.setSequence(sequences.greenIdleR)
			  .setXY(1580, 820);
	}
	
	if (status === 1) chop(dir);
	if (status === 2) bomb(dir);
	if (status === 0 && dir != 0) stop();
	
	

    // The methods are returned as an object here.
    return {
        chop: chop,
		bomb: bomb,
        stop: stop,
        getBoundingBox: sprite.getBoundingBox,
        draw: sprite.draw,
        update: update
    };
};
