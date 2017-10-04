﻿//   ▄██████▄     ▄████████   ▄▄▄▄███▄▄▄▄      ▄████████ 
//  ███    ███   ███    ███ ▄██▀▀▀███▀▀▀██▄   ███    ███ 
//  ███    █▀    ███    ███ ███   ███   ███   ███    █▀  
// ▄███          ███    ███ ███   ███   ███  ▄███▄▄▄     
//▀▀███ ████▄  ▀███████████ ███   ███   ███ ▀▀███▀▀▀     
//  ███    ███   ███    ███ ███   ███   ███   ███    █▄  
//  ███    ███   ███    ███ ███   ███   ███   ███    ███ 
//  ████████▀    ███    █▀   ▀█   ███   █▀    ██████████ 

window.onload = function ()
{
	//  Note that this html file is set to pull down Phaser 2.5.0 from the JS Delivr CDN.
	//  Although it will work fine with this tutorial, it's almost certainly not the most current version.
	//  Be sure to replace it with an updated version before you start experimenting with adding your own code.
	var game = new Phaser.Game(1920, 1080, Phaser.AUTO, '', { preload: preload, create: create, update: update });

	let keyState: Phaser.Keyboard;
	let player: Player;
	var enemies;

	//let walls: Phaser.Group;
	let bossRoom: Room;
	let background: Phaser.Sprite;

	let lives: Phaser.Group;
	var healthDrops;
	var hud;
	let pClearCircle: Phaser.Sprite;

	var map;
	var layer;

    var laserGate1: Barrier;
    var laserGate2: Barrier;
    var laserGate3: Barrier;
    var laserGate4: Barrier;

    var boss: Boss;
    var healthBar;
    var healthBarCrop;
    var bossHealthText;

    let enemyKillCount: number;

	function preload()
	{
		game.stage.backgroundColor = '#eee';
		game.load.spritesheet('pSprite', 'assets/PlayerSpritesheet.png', 156, 128, 54, 0, 2);

		game.load.image('bulletGreen', 'assets/BulletGreen.png');
		game.load.image('bulletRed', 'assets/BulletRed.png');
		game.load.image('bulletBlue', 'assets/BulletBlue.png');
		game.load.image('laser', 'assets/Laser.png');

		game.load.tilemap('map', 'assets/Map.csv', null, Phaser.Tilemap.CSV);
		game.load.image('background', 'assets/Level1.png');

		game.load.image('heart', 'assets/Heart.png');

        game.load.spritesheet('laserH', 'assets/LaserH.png', 224, 64, 6, 0, 0);

		game.load.spritesheet('eSprite', 'assets/EnemySpriteSheet.png', 32, 53, 4, 0, 2);
        game.load.image('boss', 'assets/Boss.png');

		game.load.image('bossHealth', 'assets/BossHealth.png');
		game.load.image('bossHealthBG', 'assets/BossHealthBG.png');
	}

	function create()
    {
		fullScreen();
		game.physics.startSystem(Phaser.Physics.ARCADE);
		background = game.add.sprite(0, 0, 'background');
		map = game.add.tilemap('map', 64, 64);
		layer = map.createLayer(0);
		layer.alpha = 0;
		layer.resizeWorld();
		map.setCollision(0, true, layer);
		//layer.debug = true;

		bossRoom = new Room(7800, 0, 1800, 1475, game);

		player = new Player(8700, 2000, game);
		game.add.existing(player);

		game.world.setBounds(0, 0, 9600, 4864);
		game.camera.follow(player);
		game.renderer.renderSession.roundPixels = true;

		healthDrops = game.add.group();
		healthDrops.enableBody = true;
		healthDrops.physicsBodyType = Phaser.Physics.ARCADE;
		for (var i = 0; i < 3; i++)
		{
			healthDrops.add(new Phaser.Sprite(game, -1, -1, 'heart'));
			healthDrops.children[i].scale.setTo(1.5, 1.5);
			healthDrops.children[i].kill();
		}

		enemies = game.add.group();
		enemies.enableBody = true;
		enemies.physicsBodyType = Phaser.Physics.ARCADE;

		createEnemies();

		hud = game.add.group();
		hud.fixedToCamera = true;
		hud.enableBody = false;

		for (var i = 0; i < player.maxHealth; i++)
		{
			hud.add(new Phaser.Sprite(game, 0, 0, 'heart'));
			hud.children[i].scale.setTo(1.5, 1.5);
			hud.children[i].position.set((hud.children[i].width * i + (i * 10)) + (hud.children[i].width / 2), hud.children[i].height / 2);
		}

        hud.add(new Phaser.Sprite(game, 0, 0, "bossHealthBG"));
        hud.children[player.maxHealth].scale.setTo(6.5, 2);
        hud.children[player.maxHealth].position.set(game.camera.width / 4, game.camera.height/1.2, 5);

        hud.add(new Phaser.Sprite(game, 0, 0, "bossHealth"));
        hud.children[player.maxHealth + 1].scale.setTo(6.5, 2);
        hud.children[player.maxHealth + 1].position.set(game.camera.width / 4, game.camera.height/1.2, 5);

        var style = { font: "bold 32px Arial", fill: '#fff', align: "right", boundsAlignH: "right" };
        bossHealthText = game.add.text(game.camera.width / 3.3, game.camera.height /1.25, 'Boss Health ', style);
        bossHealthText.setTextBounds(0, 0, 100, 100);
        bossHealthText.fixedToCamera = true;

		pClearCircle = game.add.sprite(player.body.position.x, player.body.position.y);
		pClearCircle.anchor.setTo(0.5, 0.5);
		game.physics.arcade.enable(pClearCircle);
		pClearCircle.body.setCircle(player.body.width * 2.5);
		pClearCircle.body.immovable = true;
		pClearCircle.kill();

        laserGate1 = new Barrier(8500, 1410, 1.25, 1, game);
        laserGate2 = new Barrier(8500, 1510, 1.25, 1, game);
        laserGate3 = new Barrier(8500, 1610, 1.25, 1, game);
        laserGate4 = new Barrier(7825, 400, 7.5, 1, game);
        laserGate4.activate();

        boss = new Boss (8400, 100, game);

        enemyKillCount = 0;
	}

	function update()
	{
		let deltaTime: number = game.time.elapsed / 10;

		keyState = game.input.keyboard;

		player.pUpdate(deltaTime, keyState);
		enemies.forEach(function (enemy)
		{
			enemy.eUpdate(deltaTime);
		}, this);

		game.physics.arcade.collide(player, layer);
		game.physics.arcade.collide(player, boss, bossHitPlayer, null, this);
		game.physics.arcade.collide(enemies, layer);
		game.physics.arcade.collide(enemies, laserGate1);
		game.physics.arcade.collide(enemies, laserGate4);
		game.physics.arcade.overlap(player, bossRoom, activateBossRoom);
		//game.physics.arcade.collide(player, walls);
		//game.physics.arcade.collide(enemies, walls);

		game.physics.arcade.overlap(player, healthDrops, pickupHealth);

		game.physics.arcade.collide(player.weapon.bullets, layer, killBullet);
		//game.physics.arcade.collide(player.weapon.bullets, walls, killBullet);

		game.physics.arcade.overlap(player, enemies, enemyHitPlayer);
        game.physics.arcade.collide(enemies, enemies);

		game.physics.arcade.overlap(player.weapon.bullets, enemies, bulletHitEnemy, null, this);
		for (var i = 0; i < enemies.children.length; i++)
		{
			if (player.canDamage)
			{
				game.physics.arcade.overlap(enemies.children[i].weapon.bullets, player, bulletHitPlayer, null, this);
			}
			game.physics.arcade.collide(enemies.children[i].weapon.bullets, layer, killBullet);
			game.physics.arcade.collide(enemies.children[i].weapon.bullets, pClearCircle, clearBullet);

			game.physics.arcade.collide(enemies.children[i].weapon.bullets, laserGate1, killBulletGate);
			game.physics.arcade.collide(enemies.children[i].weapon.bullets, laserGate4, killBulletGate);

			if (player.alive)
			{
				for (var j = 0; j < player.saberHitBoxes.children.length; j++)
				{
					if (enemies.children[i].eType != 3)
					{
						game.physics.arcade.overlap(player.saberHitBoxes.children[j], enemies.children[i].weapon.bullets, bulletHitSaber, null, this);
					}
                    game.physics.arcade.overlap(player.saberHitBoxes.children[j], boss, saberHitBoss, null, this);
				}
			}
		}

		for (var j = 0; j < player.saberHitBoxes.children.length; j++)
		{
			game.physics.arcade.overlap(player.saberHitBoxes.children[j], enemies, saberHitEnemy, null, this);
		}

        if (laserGate1.isActivated)
        {
            game.physics.arcade.collide(player, laserGate1);
        }
        else
        {
            game.physics.arcade.overlap(player, laserGate1, activateGate, null, this);
        }


        if (laserGate2.isActivated)
        {
            game.physics.arcade.collide(player, laserGate2);
        }
        else
        {
            game.physics.arcade.overlap(player, laserGate2, activateGate, null, this);
        }

        if (laserGate3.isActivated)
        {
            game.physics.arcade.collide(player, laserGate3);
        }
        else
        {
            game.physics.arcade.overlap(player, laserGate3, activateGate, null, this);
        }

        if (laserGate4.isActivated)
        {
            game.physics.arcade.collide(player, laserGate4);
        }

        laserGate1.update();
        laserGate2.update();
        laserGate3.update();

        laserGate4.update();

        if (boss.bossStage == boss.bossStageEnum.STEP_0)
        {
            if (enemyKillCount >= 7)
            {
                boss.bossStage = boss.bossStageEnum.STEP_1;
                laserGate4.deactivate();
            }
        }
        else if (boss.bossStage == boss.bossStageEnum.STEP_1)
        {
            if (boss.health <= 70)
            {
                boss.bossStage = boss.bossStageEnum.STEP_2;
                laserGate4.activate();
            }
        }

		//render();
	}

	function render()
	{
		if (pClearCircle.alive)
		{
			game.debug.bodyInfo(pClearCircle, 32, 32);
			game.debug.body(pClearCircle);
		}
		game.debug.bodyInfo(player, 32, 32);
		game.debug.body(player);

		for (var i = 0; i < enemies.children.length; i++)
		{
			game.debug.bodyInfo(enemies.children[i], 32, 32);
			game.debug.body(enemies.children[i]);
		}
	}

	function fullScreen()
	{
		game.scale.pageAlignHorizontally = true;
		game.scale.pageAlignVertically = true;
		game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
		game.scale.setGameSize(1920, 1080);
	}

	function activateBossRoom(player, room: Room)
	{
		if (!bossRoom.active)
		{
			bossRoom.active = true;
		}
	}

	function bulletHitSaber(saber, bullet: Phaser.Bullet)
	{
		bullet.body.velocity.x = -bullet.body.velocity.x;
		bullet.body.velocity.y = -bullet.body.velocity.y;
		player.weapon.bullets.add(bullet);
		bullet.rotation += Math.PI;
	}

	function saberHitBoss(saber, temp: Boss)
    {
        if (boss.canDamage)
        {
            boss.health--;
            hud.children[player.maxHealth + 1].scale.setTo( 6.5*(boss.health / boss.maxHealth), 2);
            console.log(boss.health);

			if (boss.health != 0)
			{
				bossInvuln();
				bossVisible();
				game.time.events.repeat(200, 3, bossVisible, this);
				game.time.events.add(1000, bossInvuln, this);
			}
        }
	}

	function saberHitEnemy(saber, enemy: Enemy) // -----------------------------------------------------Enemy code
	{
        enemy.kill();
        enemyKillCount++;
		dropHealth(enemy.position.x, enemy.position.y);
	}

	function bulletHitPlayer(player: Player, bullet: Phaser.Bullet)
	{
		bullet.kill();
		damagePlayer(player, 1);
	}

	function bossHitPlayer(player: Player, boss: Boss)
	{
		damagePlayer(player, 1);
	}

	function enemyHitPlayer(player: Player, enemy: Enemy)
	{
		damagePlayer(player, 1);
	}

    function activateGate(player: Player, laserGate: Barrier)
    {
        if (player.body.position.y < laserGate.position.y)
        {
            laserGate.activate();
        }
	}

	function damagePlayer(player: Player, dNum: number)
	{
		if (player.canDamage)
		{
			player.damage(dNum);
			hud.children[player.health].visible = false;
			if (player.health != 0)
			{
				playerInvuln();
				playerVisible();
				game.time.events.repeat(200, 3, playerVisible, this);
				game.time.events.add(1000, playerInvuln, this);
			}
			playerClear();
		}
	}

	function playerVisible()
	{
		player.alpha = (player.alpha + 1) % 2;
	}

	function playerInvuln()
	{
		player.canDamage = !player.canDamage;
	}

	function bossVisible()
	{
		boss.alpha = (boss.alpha + 1) % 2;
	}


    function bossInvuln()
    {
        boss.canDamage = !boss.canDamage;
    }

	function playerClear()
	{
		pClearCircle.revive();
		pClearCircle.position.x = player.body.position.x - (player.body.width * 2);
		pClearCircle.position.y = player.body.position.y - (player.body.width * 2);
		game.time.events.add(2000, endClear, this);
	}

	function endClear()
	{
		pClearCircle.kill();
	}

	function healPlayer(player: Player, hNum: number)
	{
		hud.children[player.health].visible = true;
		player.heal(hNum);
	}

	function pickupHealth(player: Player, healthDrop: Phaser.Sprite)
	{
		if (player.health != player.maxHealth)
		{
			healPlayer(player, 1);
			healthDrop.kill();
		}
	}

	function increaseHealth(player: Player)
	{
		player.maxHealth += 1;
		player.heal(1);
		hud.add(new Phaser.Sprite(game, (hud.children[0].width * (player.maxHealth - 1)) + (hud.children[0].width / 2), hud.children[0].height / 2, 'heart'));
	}

	function bulletHitEnemy(enemy: Enemy, bullet: Phaser.Bullet) // -----------------------------------------------------Enemy code
	{
		bullet.kill();
		enemy.kill();
        enemyKillCount++;
		dropHealth(enemy.position.x, enemy.position.y);
	}

	//   ▄████████ ███▄▄▄▄      ▄████████   ▄▄▄▄███▄▄▄▄   ▄██   ▄           ▄████████    ▄███████▄    ▄████████  ▄█     █▄  ███▄▄▄▄        
	//  ███    ███ ███▀▀▀██▄   ███    ███ ▄██▀▀▀███▀▀▀██▄ ███   ██▄        ███    ███   ███    ███   ███    ███ ███     ███ ███▀▀▀██▄      
	//  ███    █▀  ███   ███   ███    █▀  ███   ███   ███ ███▄▄▄███        ███    █▀    ███    ███   ███    ███ ███     ███ ███   ███      
	// ▄███▄▄▄     ███   ███  ▄███▄▄▄     ███   ███   ███ ▀▀▀▀▀▀███        ███          ███    ███   ███    ███ ███     ███ ███   ███      
	//▀▀███▀▀▀     ███   ███ ▀▀███▀▀▀     ███   ███   ███ ▄██   ███      ▀███████████ ▀█████████▀  ▀███████████ ███     ███ ███   ███      
	//  ███    █▄  ███   ███   ███    █▄  ███   ███   ███ ███   ███               ███   ███          ███    ███ ███     ███ ███   ███      
	//  ███    ███ ███   ███   ███    ███ ███   ███   ███ ███   ███         ▄█    ███   ███          ███    ███ ███ ▄█▄ ███ ███   ███      
	//  ██████████  ▀█   █▀    ██████████  ▀█   ███   █▀   ▀█████▀        ▄████████▀   ▄████▀        ███    █▀   ▀███▀███▀   ▀█   █▀                                                                                                                                   

	function createEnemies()
	{
		var enemy1 = new Enemy(8200, 800, 0, player, bossRoom, game);
		enemies.add(enemy1);

		var enemy2 = new Enemy(8500, 800, 0, player, bossRoom, game);
		enemies.add(enemy2);

		var enemy3 = new Enemy(8800, 800, 0, player, bossRoom, game);
		enemies.add(enemy3);

		var enemy4 = new Enemy(8500, 700, 1, player, bossRoom, game);
		enemies.add(enemy4);

		var enemy5 = new Enemy(8300, 700, 2, player, bossRoom, game);
		enemies.add(enemy5);

		var enemy6 = new Enemy(8700, 700, 2, player, bossRoom, game);
		enemies.add(enemy6);

		var enemy7 = new Enemy(8500, 600, 3, player, bossRoom, game);
		enemies.add(enemy7);
	}

	function killPlayer(player: Player)
	{
		var life = lives.getFirstAlive();

		if (life)
		{
			life.kill();
			player.kill();
			player.lives--;
			player.reset(300, 300, 1);
		}

		if (player.lives < 1)
		{
			player.kill();
		}
	}

	function killBullet(bullet: Phaser.Bullet, other)
	{
		bullet.kill();
	}

	function clearBullet(bullet: Phaser.Bullet, clear: Phaser.Sprite)
	{
		clear.kill();
	}

	function killBulletGate(bullet: Phaser.Bullet, layer)
	{
		layer.kill();
	}

	function dropHealth(x: number, y: number)
	{
		let rand = game.rnd.integerInRange(1, 100);
		if (rand > 97)
		{
			for (var i = 0; i < 3; i++)
			{
				if (healthDrops.children[i].alive == false)
				{
					healthDrops.children[i].revive();
					healthDrops.children[i].position.x = x;
					healthDrops.children[i].position.y = y;
					break;
				}
			}
		}

	}
};

//▀█████████▄     ▄████████    ▄████████    ▄████████  ▄█     ▄████████    ▄████████ 
//  ███    ███   ███    ███   ███    ███   ███    ███ ███    ███    ███   ███    ███ 
//  ███    ███   ███    ███   ███    ███   ███    ███ ███▌   ███    █▀    ███    ███ 
// ▄███▄▄▄██▀    ███    ███  ▄███▄▄▄▄██▀  ▄███▄▄▄▄██▀ ███▌  ▄███▄▄▄      ▄███▄▄▄▄██▀ 
//▀▀███▀▀▀██▄  ▀███████████ ▀▀███▀▀▀▀▀   ▀▀███▀▀▀▀▀   ███▌ ▀▀███▀▀▀     ▀▀███▀▀▀▀▀   
//  ███    ██▄   ███    ███ ▀███████████ ▀███████████ ███    ███    █▄  ▀███████████ 
//  ███    ███   ███    ███   ███    ███   ███    ███ ███    ███    ███   ███    ███ 
//▄█████████▀    ███    █▀    ███    ███   ███    ███ █▀     ██████████   ███    ███ 
//                            ███    ███   ███    ███                     ███    ███ 

class Barrier extends Phaser.Sprite 
{
    isActivated: boolean;
	off: Phaser.Animation;
	switch: Phaser.Animation;
	on: Phaser.Animation;
	constructor(xPos: number, yPos: number, width: number, height: number, game: Phaser.Game)
	{
		super(game, xPos, yPos, "laserH");
		game.physics.arcade.enable(this);
		this.body.immovable = true;
		this.scale.setTo(width, height);
        game.add.existing(this);

        this.isActivated = false;
        this.frame = 1;
		this.off = this.animations.add('off', [5], 15, true);
		this.switch= this.animations.add('switch', [1, 2, 3, 4], 15, false);
		this.on = this.animations.add('on', [1, 2], 15, true);
        this.play("off");
	}

    activate()
    {
        this.isActivated = true;
        this.play("switch");
    }

    deactivate()
    {
        this.isActivated = false;
        this.play("switch");
    }

    update()
    {
        if (this.isActivated)
        {
            if (this.animations.currentAnim.isFinished)
            {
                this.play("on");
            }
        }
        else if (!this.isActivated)
        {
            if (this.animations.currentAnim.isFinished)
            {
                this.play("off");
            }
        }

    }
}

//   ▄████████  ▄██████▄   ▄██████▄    ▄▄▄▄███▄▄▄▄   
//  ███    ███ ███    ███ ███    ███ ▄██▀▀▀███▀▀▀██▄ 
//  ███    ███ ███    ███ ███    ███ ███   ███   ███ 
// ▄███▄▄▄▄██▀ ███    ███ ███    ███ ███   ███   ███ 
//▀▀███▀▀▀▀▀   ███    ███ ███    ███ ███   ███   ███ 
//▀███████████ ███    ███ ███    ███ ███   ███   ███ 
//  ███    ███ ███    ███ ███    ███ ███   ███   ███ 
//  ███    ███  ▀██████▀   ▀██████▀   ▀█   ███   █▀  
//  ███    ███                                       

class Room extends Phaser.Sprite
{
	active: boolean;

	constructor(x: number, y: number, width: number, height: number, game: Phaser.Game)
	{
		super(game, x, y);
		this.game.physics.enable(this, Phaser.Physics.ARCADE);
		this.body.setSize(width, height);
		this.active = false;

	}
}

//▀█████████▄   ▄██████▄     ▄████████    ▄████████ 
//  ███    ███ ███    ███   ███    ███   ███    ███ 
//  ███    ███ ███    ███   ███    █▀    ███    █▀  
// ▄███▄▄▄██▀  ███    ███   ███          ███        
//▀▀███▀▀▀██▄  ███    ███ ▀███████████ ▀███████████ 
//  ███    ██▄ ███    ███          ███          ███ 
//  ███    ███ ███    ███    ▄█    ███    ▄█    ███ 
//▄█████████▀   ▀██████▀   ▄████████▀   ▄████████▀  
                                                  
class Boss extends Phaser.Sprite 
{
	bossStageEnum =
	{
		STEP_0: 0,
		STEP_1: 1,
		STEP_2: 2,
		STEP_3: 3
	};

	bossStage: number | string;
    canDamage: boolean;

    constructor(xPos: number, yPos: number, game: Phaser.Game)
    {
        super(game, xPos, yPos, "boss");
        game.physics.arcade.enable(this);
        this.body.immovable = true;
        this.scale.setTo(2, 2);
        game.add.existing(this);
        this.bossStage = this.bossStageEnum.STEP_0;
        this.maxHealth = 100;
        this.health = 100;
        this.canDamage = true;
    }
}

//   ▄███████▄  ▄█          ▄████████ ▄██   ▄      ▄████████    ▄████████ 
//  ███    ███ ███         ███    ███ ███   ██▄   ███    ███   ███    ███ 
//  ███    ███ ███         ███    ███ ███▄▄▄███   ███    █▀    ███    ███ 
//  ███    ███ ███         ███    ███ ▀▀▀▀▀▀███  ▄███▄▄▄      ▄███▄▄▄▄██▀ 
//▀█████████▀  ███       ▀███████████ ▄██   ███ ▀▀███▀▀▀     ▀▀███▀▀▀▀▀   
//  ███        ███         ███    ███ ███   ███   ███    █▄  ▀███████████ 
//  ███        ███▌    ▄   ███    ███ ███   ███   ███    ███   ███    ███ 
// ▄████▀      █████▄▄██   ███    █▀   ▀█████▀    ██████████   ███    ███ 
//             ▀                                               ███    ███ 

class Player extends Phaser.Sprite
{
	aim: boolean;
	canDamage: boolean;

	pVelocityX: number;
	pVelocityY: number;
	pSpeed: number;
	lives: number;

	weapon: Phaser.Weapon;

	newPFrame: number | string;
	attacked: boolean;
	rAttack: Phaser.Animation;
	lAttack: Phaser.Animation;
	uAttack: Phaser.Animation;
	dAttack: Phaser.Animation;
	urAttack: Phaser.Animation;
	ulAttack: Phaser.Animation;
	drAttack: Phaser.Animation;
	dlAttack: Phaser.Animation;

	saberHitBoxes: Phaser.Group;
	rightSaber: Phaser.Sprite;
	leftSaber: Phaser.Sprite;
	topSaber: Phaser.Sprite;
	topRightSaber: Phaser.Sprite;
	topLeftSaber: Phaser.Sprite;
	bottomSaber: Phaser.Sprite;
	bottomRightSaber: Phaser.Sprite;
	bottomLeftSaber: Phaser.Sprite;

	pDirEnum =
	{
		RIGHT: 0,
		LEFT: 1,
		UPRIGHT: 2,
		UPLEFT: 3,
		DOWN: 4,
		UP: 5,
		DOWNRIGHT: 6,
		DOWNLEFT: 7
	};

	constructor(xPos: number, yPos: number, game: Phaser.Game)
	{
		super(game, xPos, yPos, 'pSprite');
		this.rAttack = this.animations.add('rAttack', [6, 7, 8, 9, 10, 11], 25);
		this.lAttack = this.animations.add('lAttack', [12, 13, 14, 15, 16, 17], 25);
		this.uAttack = this.animations.add('uAttack', [18, 19, 20, 21, 22, 23], 25);
		this.dAttack = this.animations.add('dAttack', [24, 25, 26, 27, 28, 29], 25);
		this.urAttack = this.animations.add('urAttack', [30, 31, 32, 33, 34, 35], 25);
		this.ulAttack = this.animations.add('ulAttack', [36, 37, 38, 39, 40, 41], 25);
		this.drAttack = this.animations.add('drAttack', [42, 43, 44, 45, 46, 47], 25);
		this.dlAttack = this.animations.add('dlAttack', [48, 49, 50, 51, 52, 53], 25);
		this.attacked = false;

		this.frame = this.pDirEnum.RIGHT;
		this.newPFrame = this.frame;

		this.smoothed = false;
		this.exists = true;
		this.anchor.setTo(0.5, 0.5);
		this.scale.setTo(2.25, 2.25);

		this.game.physics.enable(this, Phaser.Physics.ARCADE);
		this.body.setSize(12, 12, 54, 64);
		this.body.collideWorldBounds = true;
		this.maxHealth = 5;
		this.health = this.maxHealth;
		this.canDamage = true;

		this.aim = false;
		this.pVelocityX = 0;
		this.pVelocityY = 0;
		this.pSpeed = 250;

		this.weapon = game.add.weapon(100, 'bullet');

		this.weapon.bulletKillType = Phaser.Weapon.KILL_WORLD_BOUNDS;
		this.weapon.bulletSpeed = 350;
		this.weapon.autofire = false;
		this.weapon.bulletAngleOffset = 90;

		this.lives = 1;

		this.createSaberHitBoxes();
	}

	createSaberHitBoxes()
	{
		this.saberHitBoxes = this.game.add.physicsGroup();
		this.addChild(this.saberHitBoxes);

		this.rightSaber = this.game.add.sprite(10, 0);
		this.rightSaber.anchor.setTo(0.5, 0.5);
		this.rightSaber.scale.setTo(1.1, 1.8);
		this.game.physics.enable(this.rightSaber, Phaser.Physics.ARCADE);
		this.saberHitBoxes.addChild(this.rightSaber);
		this.rightSaber.name = "rightSaber";
		this.disableHitbox("rightSaber");

		this.leftSaber = this.game.add.sprite(-45, 0);
		this.leftSaber.anchor.setTo(0.5, 0.5);
		this.leftSaber.scale.setTo(1.1, 1.8);
		this.game.physics.enable(this.leftSaber, Phaser.Physics.ARCADE);
		this.saberHitBoxes.addChild(this.leftSaber);
		this.leftSaber.name = "leftSaber";
		this.disableHitbox("leftSaber");

		this.topSaber = this.game.add.sprite(-18, -23);
		this.topSaber.anchor.setTo(0.5, 0.5);
		this.topSaber.scale.setTo(2, 0.9);
		this.game.physics.enable(this.topSaber, Phaser.Physics.ARCADE);
		this.saberHitBoxes.addChild(this.topSaber);
		this.topSaber.name = "topSaber";
		this.disableHitbox("topSaber");

		this.topRightSaber = this.game.add.sprite(3, -12);
		this.topRightSaber.anchor.setTo(0.5, 0.5);
		this.topRightSaber.scale.setTo(2.2, 0.9);
		this.topRightSaber.rotation += 0.6;
		this.game.physics.enable(this.topRightSaber, Phaser.Physics.ARCADE);
		this.saberHitBoxes.addChild(this.topRightSaber);
		this.topRightSaber.name = "topRightSaber";
		this.disableHitbox("topRightSaber");

		this.topLeftSaber = this.game.add.sprite(-38, -12);
		this.topLeftSaber.anchor.setTo(0.5, 0.5);
		this.topLeftSaber.scale.setTo(2.2, 0.9);
		this.topLeftSaber.rotation -= 0.6;
		this.game.physics.enable(this.topLeftSaber, Phaser.Physics.ARCADE);
		this.saberHitBoxes.addChild(this.topLeftSaber);
		this.topLeftSaber.name = "topLeftSaber";
		this.disableHitbox("topLeftSaber");

		this.bottomSaber = this.game.add.sprite(-18, 40);
		this.bottomSaber.anchor.setTo(0.5, 0.5);
		this.bottomSaber.scale.setTo(2, 0.9);
		this.game.physics.enable(this.bottomSaber, Phaser.Physics.ARCADE);
		this.saberHitBoxes.addChild(this.bottomSaber);
		this.bottomSaber.name = "bottomSaber";
		this.disableHitbox("bottomSaber");

		this.bottomRightSaber = this.game.add.sprite(3, 23);
		this.bottomRightSaber.anchor.setTo(0.5, 0.5);
		this.bottomRightSaber.scale.setTo(2.2, 0.9);
		this.bottomRightSaber.rotation -= 0.6;
		this.game.physics.enable(this.bottomRightSaber, Phaser.Physics.ARCADE);
		this.saberHitBoxes.addChild(this.bottomRightSaber);
		this.bottomRightSaber.name = "bottomRightSaber";
		this.disableHitbox("bottomRightSaber");

		this.bottomLeftSaber = this.game.add.sprite(-38, 23);
		this.bottomLeftSaber.anchor.setTo(0.5, 0.5);
		this.bottomLeftSaber.scale.setTo(2.2, 0.9);
		this.bottomLeftSaber.rotation += 0.6;
		this.game.physics.enable(this.bottomLeftSaber, Phaser.Physics.ARCADE);
		this.saberHitBoxes.addChild(this.bottomLeftSaber);
		this.bottomLeftSaber.name = "bottomLeftSaber";
		this.disableHitbox("bottomLeftSaber");

		this.saberHitBoxes.enableBody = true;
	}

	disableHitbox(name: string)
	{
		if (name == "rightSaber")
		{
			this.rightSaber.kill();
		}
		else if (name == "leftSaber")
		{
			this.leftSaber.kill();
		}
		else if (name == "topSaber")
		{
			this.topSaber.kill();
		}
		else if (name == "topRightSaber")
		{
			this.topRightSaber.kill();
		}
		else if (name == "topLeftSaber")
		{
			this.topLeftSaber.kill();
		}
		else if (name == "bottomSaber")
		{
			this.bottomSaber.kill();
		}
		else if (name == "bottomRightSaber")
		{
			this.bottomRightSaber.kill();
		}
		else if (name == "bottomLeftSaber")
		{
			this.bottomLeftSaber.kill();
		}
	}

	enableHitbox(name: string)
	{
		if (name == "rightSaber")
		{
			this.rightSaber.reset(10, 0);
		}
		else if (name == "leftSaber")
		{
			this.leftSaber.reset(-45, 0);
		}
		else if (name == "topSaber")
		{
			this.topSaber.reset(-18, -23);
		}
		else if (name == "topRightSaber")
		{
			this.topRightSaber.reset(3, -12);
		}
		else if (name == "topLeftSaber")
		{
			this.topLeftSaber.reset(-38, -12);
		}
		else if (name == "bottomSaber")
		{
			this.bottomSaber.reset(-18, 40);
		}
		else if (name == "bottomRightSaber")
		{
			this.bottomRightSaber.reset(3, 23);
		}
		else if (name == "bottomLeftSaber")
		{
			this.bottomLeftSaber.reset(-38, 23);
		}
	}

	pUpdate(time: number, keyState: Phaser.Keyboard)
	{
		if (this.alive)
		{
			this.pVelocityX = 0;
			this.pVelocityY = 0;

			if (keyState.isDown(Phaser.KeyCode.SPACEBAR) && !(this.rAttack.isPlaying || this.lAttack.isPlaying || this.uAttack.isPlaying || this.dAttack.isPlaying || this.urAttack.isPlaying || this.ulAttack.isPlaying || this.drAttack.isPlaying || this.dlAttack.isPlaying))
			{
				this.aim = true;
			}

			this.weapon.trackSprite(this, 0, 0);

			if ((keyState.isDown(Phaser.KeyCode.W) || keyState.isDown(Phaser.KeyCode.S)) && (keyState.isDown(Phaser.KeyCode.D) || keyState.isDown(Phaser.KeyCode.A)) && !((keyState.isDown(Phaser.KeyCode.W) && keyState.isDown(Phaser.KeyCode.S)) || (keyState.isDown(Phaser.KeyCode.A) && keyState.isDown(Phaser.KeyCode.D))))
			{
				if (keyState.isDown(Phaser.KeyCode.W))
				{
					this.pVelocityY -= Math.sqrt(Math.pow(this.pSpeed, 2) / 2);
					this.weapon.fireAngle = 270;
				}
				else
				{
					this.pVelocityY += Math.sqrt(Math.pow(this.pSpeed, 2) / 2);
					this.weapon.fireAngle = 90;
				}

				if (keyState.isDown(Phaser.KeyCode.A))
				{
					this.pVelocityX -= Math.sqrt(Math.pow(this.pSpeed, 2) / 2);
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
					this.pVelocityX += Math.sqrt(Math.pow(this.pSpeed, 2) / 2);
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
					this.pVelocityY -= this.pSpeed;
					this.weapon.fireAngle = 270;
				}
				if (keyState.isDown(Phaser.KeyCode.S))
				{
					this.pVelocityY += this.pSpeed;
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
					this.pVelocityX -= this.pSpeed;
					this.weapon.fireAngle = 180;
				}
				if (keyState.isDown(Phaser.KeyCode.D))
				{
					this.pVelocityX += this.pSpeed;
					this.weapon.fireAngle = 0;
				}
			}

			// ----------------------------------------------------- Determining new direction

			if (this.pVelocityX > 0)
			{
				if (this.pVelocityY > 0)
				{
					this.newPFrame = this.pDirEnum.DOWNRIGHT;
				}
				else if (this.pVelocityY < 0)
				{
					this.newPFrame = this.pDirEnum.UPRIGHT;
				}
				else
				{
					this.newPFrame = this.pDirEnum.RIGHT;
				}
			}
			else if (this.pVelocityX < 0)
			{
				if (this.pVelocityY > 0)
				{
					this.newPFrame = this.pDirEnum.DOWNLEFT;
				}
				else if (this.pVelocityY < 0)
				{
					this.newPFrame = this.pDirEnum.UPLEFT;
				}
				else
				{
					this.newPFrame = this.pDirEnum.LEFT;
				}
			}
			else
			{
				if (this.pVelocityY > 0)
				{
					this.newPFrame = this.pDirEnum.DOWN;
				}
				else if (this.pVelocityY < 0)
				{
					this.newPFrame = this.pDirEnum.UP;
				}
			}

			if (this.aim)
			{
				if (this.weapon.fireAngle == 90)
				{
					this.newPFrame = this.pDirEnum.DOWN;
					if (!this.attacked)
					{
						this.animations.play('dAttack');
						this.attacked = true;
						this.enableHitbox("bottomSaber");
					}
				}
				else if (this.weapon.fireAngle == 45)
				{
					this.newPFrame = this.pDirEnum.DOWNRIGHT;
					if (!this.attacked)
					{
						this.animations.play('drAttack');
						this.attacked = true;
						this.enableHitbox("bottomRightSaber");
					}
				}
				else if (this.weapon.fireAngle == 135)
				{
					this.newPFrame = this.pDirEnum.DOWNLEFT;
					if (!this.attacked)
					{
						this.animations.play('dlAttack');
						this.attacked = true;
						this.enableHitbox("bottomLeftSaber");
					}
				}
				else if (this.weapon.fireAngle == 0)
				{
					this.newPFrame = this.pDirEnum.RIGHT;
					if (!this.attacked)
					{
						this.animations.play('rAttack');
						this.attacked = true;
						this.enableHitbox("rightSaber");
					}
				}
				else if (this.weapon.fireAngle == 180)
				{
					this.newPFrame = this.pDirEnum.LEFT;
					if (!this.attacked)
					{
						this.animations.play('lAttack');
						this.attacked = true;
						this.enableHitbox("leftSaber");
					}
				}
				else if (this.weapon.fireAngle == 270)
				{
					this.newPFrame = this.pDirEnum.UP;
					if (!this.attacked)
					{
						this.animations.play('uAttack');
						this.attacked = true;
						this.enableHitbox("topSaber");
					}
				}
				else if (this.weapon.fireAngle == 225)
				{
					this.newPFrame = this.pDirEnum.UPLEFT;
					if (!this.attacked)
					{
						this.animations.play('ulAttack');
						this.attacked = true;
						this.enableHitbox("topLeftSaber");
					}
				}
				else if (this.weapon.fireAngle == 315)
				{
					this.newPFrame = this.pDirEnum.UPRIGHT;
					if (!this.attacked)
					{
						this.animations.play('urAttack');
						this.attacked = true;
						this.enableHitbox("topRightSaber");
					}
				}
			}

			if (this.newPFrame == this.pDirEnum.DOWNLEFT || this.newPFrame == this.pDirEnum.DOWNRIGHT) // Extra check just in case, as there is no down right or down left sprite
			{
				this.newPFrame = this.pDirEnum.DOWN;
			}

			if (!(this.rAttack.isPlaying || this.lAttack.isPlaying || this.uAttack.isPlaying || this.dAttack.isPlaying || this.urAttack.isPlaying || this.ulAttack.isPlaying || this.drAttack.isPlaying || this.dlAttack.isPlaying))
			{
				if (this.newPFrame != this.frame) 
				{
					this.frame = this.newPFrame;
				}
				else if (!keyState.isDown(Phaser.KeyCode.SPACEBAR))
				{
					this.attacked = false;
				}
			}
			if (this.animations.currentAnim.isFinished)
			{
				this.disableHitbox("rightSaber");
				this.disableHitbox("leftSaber");
				this.disableHitbox("topSaber");
				this.disableHitbox("topRightSaber");
				this.disableHitbox("topLeftSaber");
				this.disableHitbox("bottomSaber");
				this.disableHitbox("bottomRightSaber");
				this.disableHitbox("bottomLeftSaber");
			}
			// -----------------------------------------------------

			this.body.velocity.y = this.pVelocityY * time;
			this.body.velocity.x = this.pVelocityX * time;

			this.aim = false;
		}
	}
}

//   ▄████████ ███▄▄▄▄      ▄████████   ▄▄▄▄███▄▄▄▄   ▄██   ▄   
//  ███    ███ ███▀▀▀██▄   ███    ███ ▄██▀▀▀███▀▀▀██▄ ███   ██▄ 
//  ███    █▀  ███   ███   ███    █▀  ███   ███   ███ ███▄▄▄███ 
// ▄███▄▄▄     ███   ███  ▄███▄▄▄     ███   ███   ███ ▀▀▀▀▀▀███ 
//▀▀███▀▀▀     ███   ███ ▀▀███▀▀▀     ███   ███   ███ ▄██   ███ 
//  ███    █▄  ███   ███   ███    █▄  ███   ███   ███ ███   ███ 
//  ███    ███ ███   ███   ███    ███ ███   ███   ███ ███   ███ 
//  ██████████  ▀█   █▀    ██████████  ▀█   ███   █▀   ▀█████▀ 

class Enemy extends Phaser.Sprite // -----------------------------------------------------Enemy code
{
	eType: number;
	eVelocityX: number;
	eVelocityY: number;
	eSpeed: number;
	weapon: Phaser.Weapon;
	player: Player;
	room: Room;

	eMoveUp: boolean;
	eMoveDown: boolean;
	eMoveLeft: boolean;
	eMoveRight: boolean;
	eAim: boolean;
	aim: boolean;
	fireBreak: boolean;
	secondShot: number;

	fireTimer: number;
	dead: boolean;

	enemyTypeEnum =
	{
		BASE: 0,
		RAPID: 1,
		SHOTGUN: 2,
		LASER: 3
	};

	constructor(xPos: number, yPos: number, enemyType: number, player: Player, room: Room, game: Phaser.Game)
	{
		super(game, xPos, yPos, 'eSprite');

		this.eType = enemyType;
		if (this.eType == this.enemyTypeEnum.RAPID)
		{
			this.frame = 1;
		}
		else if (this.eType == this.enemyTypeEnum.LASER)
		{
			this.frame = 3;
		}
		else if (this.eType == this.enemyTypeEnum.SHOTGUN)
		{
			this.frame = 2;
		}

		this.smoothed = false;
		this.exists = true;
		this.anchor.setTo(0.5, 0.5);
		this.scale.setTo(2.2, 2.2);

		this.game.physics.enable(this, Phaser.Physics.ARCADE);
		this.body.collideWorldBounds = true;
		this.body.setSize(28, 49, 2, 2);
		this.maxHealth = 1;

		this.eAim = false;
		this.aim = false;
		this.fireBreak = false;

		this.eVelocityX = 0;
		this.eVelocityY = 0;

        this.fireTimer = this.game.time.now + game.rnd.integerInRange(1000, 6000);

		if (this.eType == this.enemyTypeEnum.LASER)
		{
			this.weapon = game.add.weapon(200, 'laser');
        }
        else if (this.eType == this.enemyTypeEnum.BASE)
		{
			this.weapon = game.add.weapon(100, 'bulletBlue');
        }
        else if (this.eType == this.enemyTypeEnum.SHOTGUN)
		{
			this.weapon = game.add.weapon(100, 'bulletRed');
		}
        else 
		{
			this.weapon = game.add.weapon(100, 'bulletGreen');
		}

		this.weapon.bullets.forEach((b: Phaser.Bullet) =>
		{
			b.scale.setTo(1.5, 1.5);
		}, this);
		this.weapon.bulletKillType = Phaser.Weapon.KILL_WORLD_BOUNDS;
		this.weapon.bulletSpeed = 300
		this.weapon.fireRate = 500;
		this.weapon.bulletAngleOffset = 90;
		this.secondShot = 0;

		if (this.eType == this.enemyTypeEnum.BASE)
		{
			this.weapon.fireRate = 2000;
			this.weapon.bulletAngleVariance = 10;
			this.eSpeed = 125;
		}
		else if (this.eType == this.enemyTypeEnum.RAPID)
		{
			this.weapon.fireRate = 400;
			this.weapon.bulletAngleVariance = 10;
			this.eSpeed = 200;
		}
		else if (this.eType == this.enemyTypeEnum.LASER)
		{
			this.weapon.bulletSpeed = 500;
			this.weapon.fireRate = 10;
			this.eSpeed = 75;
		}
		else
		{
			this.weapon.fireRate = 0;
			this.eSpeed = 100;
		}

		this.room = room;
		this.player = player;
		game.add.existing(this);
	}

//   ▄████████ ███▄▄▄▄      ▄████████   ▄▄▄▄███▄▄▄▄   ▄██   ▄           ▄████████  ▄█  
//  ███    ███ ███▀▀▀██▄   ███    ███ ▄██▀▀▀███▀▀▀██▄ ███   ██▄        ███    ███ ███  
//  ███    █▀  ███   ███   ███    █▀  ███   ███   ███ ███▄▄▄███        ███    ███ ███▌ 
// ▄███▄▄▄     ███   ███  ▄███▄▄▄     ███   ███   ███ ▀▀▀▀▀▀███        ███    ███ ███▌ 
//▀▀███▀▀▀     ███   ███ ▀▀███▀▀▀     ███   ███   ███ ▄██   ███      ▀███████████ ███▌ 
//  ███    █▄  ███   ███   ███    █▄  ███   ███   ███ ███   ███        ███    ███ ███  
//  ███    ███ ███   ███   ███    ███ ███   ███   ███ ███   ███        ███    ███ ███  
//  ██████████  ▀█   █▀    ██████████  ▀█   ███   █▀   ▀█████▀         ███    █▀  █▀   

	ePathfinding(time: number)
	{
		this.eMoveUp = false;
		this.eMoveRight = false;
		this.eMoveLeft = false;
		this.eMoveDown = false;

		if (this.alive)
		{
			if (this.eType == this.enemyTypeEnum.BASE)
			{
				if (time < 1000)
				{
					if (this.body.position.x <= this.player.position.x)
					{
						if (this.body.position.x < this.player.body.position.x - 300)
						{
							this.eMoveLeft = false;
							this.eMoveRight = true;
						}
						else if (this.body.position.x > this.player.body.position.x - 250)
						{
							this.eMoveLeft = true;
							this.eMoveRight = false;
						}
						else
						{
							this.eMoveLeft = false;
							this.eMoveRight = true;
						}
					}
					else
					{
						if (this.body.position.x > this.player.body.position.x + 300)
						{
							this.eMoveLeft = true;
							this.eMoveRight = false;
						}
						else if (this.body.position.x < this.player.body.position.x + 250)
						{
							this.eMoveLeft = false;
							this.eMoveRight = true;
						}
						else
						{
							this.eMoveLeft = true;
							this.eMoveRight = false;
						}
					}

					if (this.body.position.y <= this.player.body.position.y)
					{
						if (this.body.position.y < this.player.body.position.y - 300)
						{
							this.eMoveUp = false;
							this.eMoveDown = true;
						}
						else if (this.body.position.y > this.player.body.position.y - 250)
						{
							this.eMoveUp = true;
							this.eMoveDown = false;
						}
						else
						{
							this.eMoveUp = false;
							this.eMoveDown = true;
						}
					}
					else
					{
						if (this.body.position.y > this.player.body.position.y + 300)
						{
							this.eMoveUp = true;
							this.eMoveDown = false;
						}
						else if (this.body.position.y < this.player.body.position.y + 250)
						{
							this.eMoveUp = false;
							this.eMoveDown = true;
						}
						else
						{
							this.eMoveUp = true;
							this.eMoveDown = false;
						}
					}
				}
				else
				{
					if (this.body.position.x <= this.player.body.position.x)
					{
						if (this.body.position.x < this.player.body.position.x - 450)
						{
							this.eMoveLeft = false;
							this.eMoveRight = true;
						}
						else if (this.body.position.x > this.player.position.x - 350)
						{
							this.eMoveLeft = true;
							this.eMoveRight = false;
						}
						else
						{
							this.eMoveLeft = false;
							this.eMoveRight = true;
						}
					}
					else
					{
						if (this.body.position.x > this.player.position.x + 400)
						{
							this.eMoveLeft = true;
							this.eMoveRight = false;
						}
						else if (this.body.position.x < this.player.position.x + 350)
						{
							this.eMoveLeft = false;
							this.eMoveRight = true;
						}
						else
						{
							this.eMoveLeft = true;
							this.eMoveRight = false;
						}
					}

					if (this.body.position.y <= this.player.position.y)
					{
						if (this.body.position.y < this.player.position.y - 400)
						{
							this.eMoveUp = false;
							this.eMoveDown = true;
						}
						else if (this.body.position.y > this.player.position.y - 350)
						{
							this.eMoveUp = true;
							this.eMoveDown = false;
						}
						else
						{
							this.eMoveUp = false;
							this.eMoveDown = true;
						}
					}
					else
					{
						if (this.body.position.y > this.player.position.y + 400)
						{
							this.eMoveUp = true;
							this.eMoveDown = false;
						}
						else if (this.body.position.y < this.player.position.y + 350)
						{
							this.eMoveUp = false;
							this.eMoveDown = true;
						}
						else
						{
							this.eMoveUp = true;
							this.eMoveDown = false;
						}
					}
				}
			}
			else if (this.eType == this.enemyTypeEnum.RAPID)
			{
				if (time < 250)
				{
					if (this.body.position.x <= this.player.position.x)
					{
						if (this.body.position.x < this.player.position.x - 250)
						{
							this.eMoveLeft = false;
							this.eMoveRight = true;
						}
						else if (this.body.position.x > this.player.position.x - 200)
						{
							this.eMoveLeft = true;
							this.eMoveRight = false;
						}
						else
						{
							this.eMoveLeft = false;
							this.eMoveRight = true;
						}
					}
					else
					{
						if (this.body.position.x > this.player.position.x + 250)
						{
							this.eMoveLeft = true;
							this.eMoveRight = false;
						}
						else if (this.body.position.x < this.player.position.x + 200)
						{
							this.eMoveLeft = false;
							this.eMoveRight = true;
						}
						else
						{
							this.eMoveLeft = true;
							this.eMoveRight = false;
						}
					}

					if (this.body.position.y <= this.player.position.y)
					{
						if (this.body.position.y < this.player.position.y - 250)
						{
							this.eMoveUp = false;
							this.eMoveDown = true;
						}
						else if (this.body.position.y > this.player.position.y - 200)
						{
							this.eMoveUp = true;
							this.eMoveDown = false;
						}
						else
						{
							this.eMoveUp = false;
							this.eMoveDown = true;
						}
					}
					else
					{
						if (this.body.position.y > this.player.position.y + 250)
						{
							this.eMoveUp = true;
							this.eMoveDown = false;
						}
						else if (this.body.position.y < this.player.position.y + 200)
						{
							this.eMoveUp = false;
							this.eMoveDown = true;
						}
						else
						{
							this.eMoveUp = true;
							this.eMoveDown = false;
						}
					}
				}
				else
				{
					if (this.body.position.x <= this.player.position.x)
					{
						if (this.body.position.x < this.player.position.x - 300)
						{
							this.eMoveLeft = false;
							this.eMoveRight = true;
						}
						else if (this.body.position.x > this.player.position.x - 250)
						{
							this.eMoveLeft = true;
							this.eMoveRight = false;
						}
						else
						{
							this.eMoveLeft = false;
							this.eMoveRight = true;
						}
					}
					else
					{
						if (this.body.position.x > this.player.position.x + 300)
						{
							this.eMoveLeft = true;
							this.eMoveRight = false;
						}
						else if (this.body.position.x < this.player.position.x + 250)
						{
							this.eMoveLeft = false;
							this.eMoveRight = true;
						}
						else
						{
							this.eMoveLeft = true;
							this.eMoveRight = false;
						}
					}

					if (this.body.position.y <= this.player.position.y)
					{
						if (this.body.position.y < this.player.position.y - 300)
						{
							this.eMoveUp = false;
							this.eMoveDown = true;
						}
						else if (this.body.position.y > this.player.position.y - 250)
						{
							this.eMoveUp = true;
							this.eMoveDown = false;
						}
						else
						{
							this.eMoveUp = false;
							this.eMoveDown = true;
						}
					}
					else
					{
						if (this.body.position.y > this.player.position.y + 300)
						{
							this.eMoveUp = true;
							this.eMoveDown = false;
						}
						else if (this.body.position.y < this.player.position.y + 250)
						{
							this.eMoveUp = false;
							this.eMoveDown = true;
						}
						else
						{
							this.eMoveUp = true;
							this.eMoveDown = false;
						}
					}
				}
			}
			else if (this.eType == this.enemyTypeEnum.LASER)
			{
				if (!this.fireBreak)
				{
					if (this.body.position.x <= this.player.position.x)
					{
						if (this.body.position.x < this.player.position.x - 450)
						{
							this.eMoveLeft = false;
							this.eMoveRight = true;
						}
						else if (this.body.position.x > this.player.position.x - 350)
						{
							this.eMoveLeft = true;
							this.eMoveRight = false;
						}
						else
						{
							this.eMoveLeft = true;
							this.eMoveRight = false;
						}
					}
					else
					{
						if (this.body.position.x > this.player.position.x + 450)
						{
							this.eMoveLeft = true;
							this.eMoveRight = false;
						}
						else if (this.body.position.x < this.player.position.x + 350)
						{
							this.eMoveLeft = false;
							this.eMoveRight = true;
						}
						else
						{
							this.eMoveLeft = false;
							this.eMoveRight = true;
						}
					}

					if (this.body.position.y <= this.player.position.y)
					{
						if (this.body.position.y < this.player.position.y - 450)
						{
							this.eMoveUp = false;
							this.eMoveDown = true;
						}
						else if (this.body.position.y > this.player.position.y - 350)
						{
							this.eMoveUp = true;
							this.eMoveDown = false;
						}
						else
						{
							this.eMoveUp = true;
							this.eMoveDown = false;
						}
					}
					else
					{
						if (this.body.position.y > this.player.position.y + 450)
						{
							this.eMoveUp = true;
							this.eMoveDown = false;
						}
						else if (this.body.position.y < this.player.position.y + 350)
						{
							this.eMoveUp = false;
							this.eMoveDown = true;
						}
						else
						{
							this.eMoveUp = false;
							this.eMoveDown = true;
						}
					}
				}
			}
			else
			{
				if (time < 1500)
				{
					if (this.body.position.x <= this.player.position.x)
					{
						if (this.body.position.x < this.player.position.x - 250)
						{
							this.eMoveLeft = false;
							this.eMoveRight = true;
						}
						else if (this.body.position.x > this.player.position.x - 200)
						{
							this.eMoveLeft = true;
							this.eMoveRight = false;
						}
						else
						{
							this.eMoveLeft = false;
							this.eMoveRight = true;
						}
					}
					else
					{
						if (this.body.position.x > this.player.position.x + 250)
						{
							this.eMoveLeft = true;
							this.eMoveRight = false;
						}
						else if (this.body.position.x < this.player.position.x + 200)
						{
							this.eMoveLeft = false;
							this.eMoveRight = true;
						}
						else
						{
							this.eMoveLeft = true;
							this.eMoveRight = false;
						}
					}

					if (this.body.position.y <= this.player.position.y)
					{
						if (this.body.position.y < this.player.position.y - 250)
						{
							this.eMoveUp = false;
							this.eMoveDown = true;
						}
						else if (this.body.position.y > this.player.position.y - 200)
						{
							this.eMoveUp = true;
							this.eMoveDown = false;
						}
						else
						{
							this.eMoveUp = false;
							this.eMoveDown = true;
						}
					}
					else
					{
						if (this.body.position.y > this.player.position.y + 250)
						{
							this.eMoveUp = true;
							this.eMoveDown = false;
						}
						else if (this.body.position.y < this.player.position.y + 200)
						{
							this.eMoveUp = false;
							this.eMoveDown = true;
						}
						else
						{
							this.eMoveUp = true;
							this.eMoveDown = false;
						}
					}
				}
				else
				{
					if (this.body.position.x <= this.player.position.x)
					{
						if (this.body.position.x < this.player.position.x - 300)
						{
							this.eMoveLeft = false;
							this.eMoveRight = true;
						}
						else if (this.body.position.x > this.player.position.x - 250)
						{
							this.eMoveLeft = true;
							this.eMoveRight = false;
						}
						else
						{
							this.eMoveLeft = false;
							this.eMoveRight = true;
						}
					}
					else
					{
						if (this.body.position.x > this.player.position.x + 300)
						{
							this.eMoveLeft = true;
							this.eMoveRight = false;
						}
						else if (this.body.position.x < this.player.position.x + 250)
						{
							this.eMoveLeft = false;
							this.eMoveRight = true;
						}
						else
						{
							this.eMoveLeft = true;
							this.eMoveRight = false;
						}
					}

					if (this.body.position.y <= this.player.position.y)
					{
						if (this.body.position.y < this.player.position.y - 300)
						{
							this.eMoveUp = false;
							this.eMoveDown = true;
						}
						else if (this.body.position.y > this.player.position.y - 250)
						{
							this.eMoveUp = true;
							this.eMoveDown = false;
						}
						else
						{
							this.eMoveUp = false;
							this.eMoveDown = true;
						}
					}
					else
					{
						if (this.body.position.y > this.player.position.y + 300)
						{
							this.eMoveUp = true;
							this.eMoveDown = false;
						}
						else if (this.body.position.y < this.player.position.y + 250)
						{
							this.eMoveUp = false;
							this.eMoveDown = true;
						}
						else
						{
							this.eMoveUp = true;
							this.eMoveDown = false;
						}
					}
				}
			}
		}
	}

//   ▄████████ ███▄▄▄▄      ▄████████   ▄▄▄▄███▄▄▄▄   ▄██   ▄        ███    █▄     ▄███████▄ ████████▄     ▄████████     ███        ▄████████ 
//  ███    ███ ███▀▀▀██▄   ███    ███ ▄██▀▀▀███▀▀▀██▄ ███   ██▄      ███    ███   ███    ███ ███   ▀███   ███    ███ ▀█████████▄   ███    ███ 
//  ███    █▀  ███   ███   ███    █▀  ███   ███   ███ ███▄▄▄███      ███    ███   ███    ███ ███    ███   ███    ███    ▀███▀▀██   ███    █▀  
// ▄███▄▄▄     ███   ███  ▄███▄▄▄     ███   ███   ███ ▀▀▀▀▀▀███      ███    ███   ███    ███ ███    ███   ███    ███     ███   ▀  ▄███▄▄▄     
//▀▀███▀▀▀     ███   ███ ▀▀███▀▀▀     ███   ███   ███ ▄██   ███      ███    ███ ▀█████████▀  ███    ███ ▀███████████     ███     ▀▀███▀▀▀     
//  ███    █▄  ███   ███   ███    █▄  ███   ███   ███ ███   ███      ███    ███   ███        ███    ███   ███    ███     ███       ███    █▄  
//  ███    ███ ███   ███   ███    ███ ███   ███   ███ ███   ███      ███    ███   ███        ███   ▄███   ███    ███     ███       ███    ███ 
//  ██████████  ▀█   █▀    ██████████  ▀█   ███   █▀   ▀█████▀       ████████▀   ▄████▀      ████████▀    ███    █▀     ▄████▀     ██████████ 

	eUpdate(time: number)
	{
		if (this.alive)
		{
			if (this.room.active)
			{
				this.eVelocityX = 0;
				this.eVelocityY = 0;

				if (this.game.time.now > this.fireTimer)
				{
					if (this.eType == this.enemyTypeEnum.BASE)
					{
						this.fireTimer = this.game.time.now + 2000;
					}
					else if (this.eType == this.enemyTypeEnum.RAPID)
					{
						this.fireTimer = this.game.time.now + 400;
					}
					else if (this.eType == this.enemyTypeEnum.LASER)
					{
						this.fireTimer = this.game.time.now + 10;
					}
					else
					{
						this.fireTimer = this.game.time.now + 4000;
					}
					this.eAim = true;
				}

				if (this.eAim)
				{
					this.aim = true;
				}

				this.weapon.trackSprite(this, 0, 0);

				this.ePathfinding(this.fireTimer - this.game.time.now);

				if ((this.eMoveUp || this.eMoveDown) && (this.eMoveLeft || this.eMoveRight) && !((this.eMoveUp && this.eMoveDown) || (this.eMoveLeft && this.eMoveRight)))
				{
					if (this.eMoveUp)
					{
						this.eVelocityY -= Math.sqrt(Math.pow(this.eSpeed, 2) / 2);
					}
					else
					{
						this.eVelocityY += Math.sqrt(Math.pow(this.eSpeed, 2) / 2);
					}

					if (this.eMoveLeft)
					{
						this.eVelocityX -= Math.sqrt(Math.pow(this.eSpeed, 2) / 2);
					}
					else
					{
						this.eVelocityX += Math.sqrt(Math.pow(this.eSpeed, 2) / 2);
					}
				}
				else
				{
					if (this.eMoveUp)
					{
						this.eVelocityY -= this.eSpeed;
					}
					if (this.eMoveDown)
					{
						this.eVelocityY += this.eSpeed;
					}

					if (this.eMoveLeft)
					{
						this.eVelocityX -= this.eSpeed;
					}
					if (this.eMoveRight)
					{
						this.eVelocityX += this.eSpeed;
					}
				}

				if (this.aim)
				{
					if (this.eType == this.enemyTypeEnum.LASER && !this.fireBreak)
					{
						var prediction = new Phaser.Rectangle(this.player.body.position.x, this.player.body.position.y, this.player.body.width, this.player.body.height);
						prediction.x = prediction.x + (this.player.body.velocity.x * 3);
						prediction.y = prediction.y + (this.player.body.velocity.y * 3);
						var fireDegree = this.game.physics.arcade.angleBetween(this.body, prediction);
						fireDegree = fireDegree * 57.2958;
						this.weapon.fireAngle = fireDegree;
					}
					else if (this.eType != this.enemyTypeEnum.LASER)
					{
						var fireDegree = this.game.physics.arcade.angleBetween(this.body, this.player.body);
						fireDegree = fireDegree * 57.2958;
						this.weapon.fireAngle = fireDegree;
					}

					if (this.eType == this.enemyTypeEnum.SHOTGUN)
					{
						this.weapon.fire();
						this.weapon.fireAngle -= 30;
						this.weapon.fire();
						this.weapon.fireAngle += 15;
						this.weapon.fire();
						this.weapon.fireAngle += 30;
						this.weapon.fire();
						this.weapon.fireAngle += 15;
						this.weapon.fire();
						this.secondShot = this.weapon.fireAngle;
						this.game.time.events.add(500, this.eSecondShot, this);
					}
					else if (this.eType == this.enemyTypeEnum.LASER)
					{
						this.weapon.fire();
						if (!this.fireBreak)
						{
							this.fireBreak = true;
							this.game.time.events.add(4000, this.eFireDelay, this);
						}
					}
					else if (this.eType == this.enemyTypeEnum.RAPID)
					{
						this.weapon.fire();
						if (!this.fireBreak)
						{
							this.fireBreak = true;
							this.game.time.events.add(6000, this.eFireDelay, this);
						}
					}
					else
					{
						this.weapon.fire();
					}

					this.eAim = false;
				}

				this.body.velocity.y = this.eVelocityY * time;
				this.body.velocity.x = this.eVelocityX * time;

				this.aim = false;
			}
		}
	}

	eSecondShot()
	{
		this.weapon.fireAngle = this.secondShot;
		this.weapon.fire();
		this.weapon.fireAngle -= 15;
		this.weapon.fire();
		this.weapon.fireAngle -= 15;
		this.weapon.fire();
		this.weapon.fireAngle -= 30;
		this.weapon.fire();
		this.weapon.fireAngle -= 15;
		this.weapon.fire();
	}

	eFireDelay()
	{
		if (this.eType == this.enemyTypeEnum.LASER)
		{
			this.fireTimer = this.game.time.now + 1500;
		}
		else
		{
			this.fireTimer = this.game.time.now + 2000;
		}
		this.fireBreak = false;
	}
}
