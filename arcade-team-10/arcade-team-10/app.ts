﻿window.onload = function ()
{
	//  Note that this html file is set to pull down Phaser 2.5.0 from the JS Delivr CDN.
	//  Although it will work fine with this tutorial, it's almost certainly not the most current version.
	//  Be sure to replace it with an updated version before you start experimenting with adding your own code.
    var game = new Phaser.Game(1920, 1080, Phaser.AUTO, '', { preload: preload, create: create, update: update });
	let keyState: Phaser.Keyboard;
	let player: Player;
	//let pAim: Phaser.Sprite;

    var walls;
    let background : Phaser.Sprite;

	var scoreText;
    var score;

	function preload()
	{
		game.stage.backgroundColor = '#eee';
		game.load.image('pAttack', 'assets/Testchar_side.png');
		game.load.image('pRight', 'assets/Testchar_right.png');
		game.load.image('pLeft', 'assets/Testchar_left.png');
		game.load.image('pDown', 'assets/Testchar_down.png');
		game.load.image('pAim', 'assets/phaser.png');
		game.load.image('testBullet', 'assets/temp.png');

        game.load.image('background', 'assets/Maze1.png');
        game.load.image('wall', 'assets/wall.png');
	}

    function create() {
        fullScreen();
        game.physics.startSystem(Phaser.Physics.ARCADE);
        background = game.add.sprite(0, 0, 'background');
        background.scale.setTo(4, 3);

        createWalls();
        player = new Player(game);
        game.add.existing(player);

        //pAim = game.add.sprite(player.x + player.width / 2, player.y, 'pAim');
        //pAim.anchor.setTo(0.5, 0.5);
        //pAim.scale.setTo(0.2);

        var style =  { font: "bold 32px Arial", fill: '#fff' };
        scoreText = game.add.text(5, 5, '0', style);
	}

	function update()
	{
		let deltaTime: number = game.time.elapsed / 10;

		keyState = game.input.keyboard;

		player.pUpdate(deltaTime, keyState);
        game.physics.arcade.collide(walls, player);
        game.physics.arcade.collide(player.weapon.bullets,
                                    walls,
                                    function (bullet, wall)
                                    {
                                        bullet.kill();
                                    });
        score = 100;
        scoreText.text = score;
	}

	function fullScreen()
	{
		game.scale.pageAlignHorizontally = true;
		game.scale.pageAlignVertically = true;
		game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
		game.scale.setGameSize(1280, 720);
	}

    function createWalls()
    {
        walls = game.add.physicsGroup();

        var wall1 = new Wall(145, 35, 400, 10, game, walls);
        var wall2 = new Wall(735, 35, 400, 10, game, walls);
        var wall3 = new Wall(735, 650, 400, 10, game, walls);
        var wall4 = new Wall(145, 650, 400, 10, game, walls);
        var wall5 = new Wall(145, 240, 220, 10, game, walls);
        var wall6 = new Wall(735, 240, 400, 10, game, walls);
        var wall7 = new Wall(145, 450, 220, 10, game, walls);
        var wall8 = new Wall(145, 35, 10, 200, game, walls);
        var wall9 = new Wall(145, 450, 10, 200, game, walls);
        var wall10 = new Wall(735, 450, 10, 200, game, walls);
        var wall11 = new Wall(1120, 450, 10, 200, game, walls);
        var wall12 = new Wall(1120, 35, 10, 200, game, walls);
        var wall13 = new Wall(530, 250, 10, 200, game, walls);
        var wall14 = new Wall(530, 440, 220, 10, game, walls);

        walls.enableBody = true;
    }
};

class Wall
{
    constructor(xPos: number, yPos: number, width: number, height: number, game : Phaser.Game, walls)
    {
        var wall = game.add.sprite(xPos, yPos, 'wall');
        wall.scale.setTo(width, height);
        game.physics.arcade.enable(wall);
        wall.body.immovable = true;
        wall.renderable = false;
        walls.add(wall);
    }
}
class Player extends Phaser.Sprite
{
	aim: boolean;
	pVelocityX: number;
	pVelocityY: number;
	pSpeed: number;
	weapon: Phaser.Weapon;

	constructor(game: Phaser.Game)
	{
		super(game, screen.width / 2, screen.height / 2, 'pRight');
		this.exists = true;
		this.anchor.setTo(0.5, 0.5);

		this.game.physics.enable(this, Phaser.Physics.ARCADE);
		this.body.collideWorldBounds = true;
		this.maxHealth = 1;

		this.aim = false;
		this.pVelocityX = 0;
		this.pVelocityY = 0;
		this.pSpeed = 500;

		this.weapon = game.add.weapon(100, 'testBullet');
		this.weapon.bulletKillType = Phaser.Weapon.KILL_WORLD_BOUNDS;
		this.weapon.bulletSpeed = 200;
	}

	pUpdate(time: number, keyState: Phaser.Keyboard)
	{
		this.pVelocityX = 0;
		this.pVelocityY = 0;

		if (keyState.isDown(Phaser.KeyCode.SPACEBAR))
		{
			this.aim = true;
		}

		//pAim.position.setTo(this.position.x, this.position.y);
		this.weapon.trackSprite(this, 0, 0);
		this.weapon.fireAngle = 0;

		if (!this.aim)
		{
			if ((keyState.isDown(Phaser.KeyCode.W) || keyState.isDown(Phaser.KeyCode.S)) && (keyState.isDown(Phaser.KeyCode.D) || keyState.isDown(Phaser.KeyCode.A)) && !((keyState.isDown(Phaser.KeyCode.W) && keyState.isDown(Phaser.KeyCode.S)) || (keyState.isDown(Phaser.KeyCode.A) && keyState.isDown(Phaser.KeyCode.D))))
			{
				if (keyState.isDown(Phaser.KeyCode.W))
				{
					this.pVelocityY -= Math.sqrt(Math.pow(this.pSpeed, 2) / 2);
				}
				else
				{
					this.pVelocityY += Math.sqrt(Math.pow(this.pSpeed, 2) / 2);
				}

				if (keyState.isDown(Phaser.KeyCode.A))
				{
					this.pVelocityX -= Math.sqrt(Math.pow(this.pSpeed, 2) / 2);
				}
				else
				{
					this.pVelocityX += Math.sqrt(Math.pow(this.pSpeed, 2) / 2);
				}
			}
			else
			{
				if (keyState.isDown(Phaser.KeyCode.W))
				{
					this.pVelocityY -= this.pSpeed;
				}
				if (keyState.isDown(Phaser.KeyCode.S))
				{
					this.pVelocityY += this.pSpeed;
					this.weapon.fireAngle = 90;
				}

				if (keyState.isDown(Phaser.KeyCode.A))
				{
					this.pVelocityX -= this.pSpeed;
					this.weapon.fireAngle = 180;
				}
				if (keyState.isDown(Phaser.KeyCode.D))
				{
					this.pVelocityX += this.pSpeed;
					this.weapon.fireAngle = 0;
				}
			}
		}
		else
		{
			if ((keyState.isDown(Phaser.KeyCode.W) || keyState.isDown(Phaser.KeyCode.S)) && (keyState.isDown(Phaser.KeyCode.D) || keyState.isDown(Phaser.KeyCode.A)) && !((keyState.isDown(Phaser.KeyCode.W) && keyState.isDown(Phaser.KeyCode.S)) || (keyState.isDown(Phaser.KeyCode.A) && keyState.isDown(Phaser.KeyCode.D))))
			{
				if (keyState.isDown(Phaser.KeyCode.W))
				{
					//pAim.position.y = pAim.position.y - this.height / 2;
					this.weapon.trackOffset.y = -this.height / 2;
					this.weapon.fireAngle = 270;
				}
				else
				{
					//pAim.position.y = pAim.position.y + this.height / 2;
					this.weapon.trackOffset.y = this.height / 2;
					this.weapon.fireAngle = 90;
				}

				if (keyState.isDown(Phaser.KeyCode.A))
				{
					//pAim.position.x = pAim.position.x - this.width / 2;
					this.weapon.trackOffset.x = -this.width / 2;
					if (this.weapon.fireAngle > 180)
					{
						this.weapon.fireAngle -= 45;
					}
					else
					{
						this.weapon.fireAngle += 45;
					}
				}
				else
				{
					//pAim.position.x = pAim.position.x + this.width / 2;
					this.weapon.trackOffset.x = this.width / 2;
					if (this.weapon.fireAngle > 180)
					{
						this.weapon.fireAngle += 45;
					}
					else
					{
						this.weapon.fireAngle -= 45;
					}
				}
			}
			else
			{
				if (keyState.isDown(Phaser.KeyCode.W))
				{
					//pAim.position.y = pAim.position.y - this.height / 2;
					this.weapon.trackOffset.y -= this.height / 2;
					this.weapon.fireAngle = 270;
				}
				if (keyState.isDown(Phaser.KeyCode.S))
				{
					//pAim.position.y = pAim.position.y + this.height / 2;
					this.weapon.trackOffset.y += this.height / 2;
					if (this.weapon.fireAngle == 270)
					{
						this.weapon.fireAngle = 0;
					}
					else
					{
						this.weapon.fireAngle = 90;
					}
				}

				if (keyState.isDown(Phaser.KeyCode.A))
				{
					//pAim.position.x = pAim.position.x - this.width / 2;
					this.weapon.trackOffset.x -= this.width / 2;
					this.weapon.fireAngle = 180;
				}
				if (keyState.isDown(Phaser.KeyCode.D))
				{
					//pAim.position.x = pAim.position.x + this.width / 2;
					this.weapon.trackOffset.x += this.width / 2;
					this.weapon.fireAngle = 0;
				}
			}
			this.weapon.fire();
		}

		this.body.velocity.y = this.pVelocityY * time;
		this.body.velocity.x = this.pVelocityX * time;

		this.aim = false;
	}
}
