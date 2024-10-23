const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const collectBlock = require('mineflayer-collectblock');
const autoEat = require('mineflayer-auto-eat');
const say = require('say');
const { Vec3 } = require('vec3');

// لا تحتاج لتعريف mineflayer مرة أخرى
// const mineflayer = require('mineflayer'); // هذا السطر يجب إزالته

let reconnecting = false;

function createBot() {
  const bot = mineflayer.createBot({
    host: 'localhost', // عنوان السيرفر
    port: 25565,       // بورت السيرفر
    username: 'SpeedRunnerBot', // اسم البوت
  });

  bot.loadPlugin(pathfinder);
  bot.loadPlugin(collectBlock.plugin);
  bot.loadPlugin(autoEat.plugin);

  bot.once('spawn', () => {
    bot.autoEat.options = {
      priority: 'foodPoints',
      startAt: 14,
      bannedFood: []
    };

    say.speak('I am ready to start speedrunning the game.');

    const defaultMove = new Movements(bot, require('prismarine-physics')(bot.version));
    bot.pathfinder.setMovements(defaultMove);

    gatherResources(); // بدء جمع الموارد
  });

  // خوارزمية الدفاع عن نفسه
  bot.on('entityHurt', (entity) => {
    if (entity === bot.entity) {
      bot.chat("I'm being attacked!");
      defendSelf();
    }
  });

  function defendSelf() {
    const enemy = bot.nearestEntity(e => e.type === 'mob' && e.position.distanceTo(bot.entity.position) < 16);
    if (enemy) {
      bot.chat("Engaging enemy: " + enemy.name);
      bot.lookAt(enemy.position.offset(0, enemy.height, 0), true, () => {
        bot.attack(enemy);
      });
    }
  }

  // تجنب هجمات التنين
  function dodgeDragonAttack() {
    const dragonFireball = bot.nearestEntity(e => e.name === 'ender_dragon_fireball');
    if (dragonFireball) {
      const fireballPos = dragonFireball.position;
      const avoidPos = bot.entity.position.plus(new Vec3(-3, 0, -3));
      bot.pathfinder.setGoal(new goals.GoalNear(avoidPos.x, avoidPos.y, avoidPos.z, 1));
      bot.chat('Dodging dragon fireball!');
    }
  }

  function fightEnderDragon() {
    bot.chat("Fighting the Ender Dragon...");
    setInterval(() => {
      dodgeDragonAttack(); // تجنب الهجمات
      const dragon = bot.nearestEntity(e => e.name === 'ender_dragon');
      if (dragon) {
        bot.chat("Attacking the dragon!");
        bot.lookAt(dragon.position.offset(0, dragon.height / 2, 0), true, () => {
          bot.attack(dragon);
        });
      }
    }, 1000); // كرر كل ثانية
  }

  // إعادة الاتصال التلقائي
  bot.on('end', () => {
    if (!reconnecting) {
      reconnecting = true;
      bot.chat('Lost connection, reconnecting...');
      setTimeout(() => {
        reconnecting = false;
        createBot(); // إعادة الاتصال
      }, 5000); // إعادة الاتصال بعد 5 ثوانٍ
    }
  });

  bot.on('goal_reached', () => {
    bot.chat('Goal reached!');
  });

  bot.on('death', () => {
    bot.chat('I died! Respawning...');
    bot.once('spawn', () => {
      bot.chat('Respawned! Continuing tasks...');
      gatherResources(); // إعادة المهمة بعد الموت
    });
  });
}

createBot();
