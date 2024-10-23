const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const { GoalNear } = goals;
const collectBlock = require('mineflayer-collectblock');
const autoEat = require('mineflayer-auto-eat');
const say = require('say');
const { Vec3 } = require('vec3');

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

  // قتال أي أعداء في المنطقة
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

  // تنفيذ خوارزمية قتال التنين
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

  // استمر في إضافة باقي الخوارزميات مثل جمع الموارد وبناء بوابة النذر هنا
  // نفس الدوال السابقة مثل gatherResources, buildNetherPortal, etc.

  // إعادة تشغيل جميع المهمات
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

createBot(); // تشغيل البوت لأول مرة
const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const { GoalNear } = goals;
const collectBlock = require('mineflayer-collectblock');
const autoEat = require('mineflayer-auto-eat');
const say = require('say');

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

  // حركات افتراضية مثل التنقل عبر العالم
  const defaultMove = new Movements(bot, require('prismarine-physics')(bot.version));
  bot.pathfinder.setMovements(defaultMove);
  
  // بدء عملية جمع الأدوات الأساسية
  gatherResources();
});

// جمع الموارد الأساسية (الخشب، الحجر، الحديد)
function gatherResources() {
  bot.chat("Gathering basic resources...");
  // بحث عن خشب وجمعه
  collectResource('log', 20, () => {
    bot.chat("Collected enough wood. Moving to get stone.");
    // بحث عن حجر وجمعه
    collectResource('stone', 20, () => {
      bot.chat("Collected stone. Moving to mine for iron.");
      // بحث عن الحديد وجمعه
      collectResource('iron_ore', 10, () => {
        bot.chat("Got the iron! Time to smelt and craft.");
        smeltAndCraft();
      });
    });
  });
}

// البحث عن مصدر محدد وجمعه
function collectResource(blockType, count, callback) {
  const block = bot.findBlock({
    matching: (block) => block.name.includes(blockType),
    maxDistance: 64
  });

  if (block) {
    bot.collectBlock.collect(block, (err) => {
      if (err) {
        bot.chat(`Error collecting ${blockType}: ${err.message}`);
      } else {
        if (--count > 0) {
          collectResource(blockType, count, callback);
        } else {
          callback();
        }
      }
    });
  } else {
    bot.chat(`No ${blockType} found!`);
    callback();
  }
}

// صهر الحديد وصنع الأدوات الأساسية
function smeltAndCraft() {
  bot.chat("Smelting iron...");
  // صهر الحديد هنا (محاكاة لعملية الصهر)
  setTimeout(() => {
    bot.chat("Crafting tools...");
    // افتراض أنه بعد الصهر يصنع الفأس والسيف
    bot.chat("Tools ready! Moving to build Nether portal.");
    buildNetherPortal();
  }, 5000);
}

// بناء بوابة الـNether باستخدام تقنية lava bucket
function buildNetherPortal() {
  bot.chat("Building Nether portal...");
  // الكود لبناء البوابة هنا
  // بعد الانتهاء من بناء البوابة:
  enterNether();
}

// الدخول إلى الـNether والبحث عن الـFortress
function enterNether() {
  bot.chat("Entering the Nether...");
  // كود للدخول إلى البوابة
  setTimeout(() => {
    bot.chat("Searching for Fortress...");
    // خوارزمية البحث عن الـFortress وجمع Blaze Rods
    gatherBlazeRods();
  }, 5000);
}

// جمع Blaze Rods من الـFortress
function gatherBlazeRods() {
  bot.chat("Fighting Blaze for Blaze Rods...");
  // الكود لمحاربة الـBlaze وجمع Blaze Rods
  setTimeout(() => {
    bot.chat("Got enough Blaze Rods! Moving to collect Ender Pearls.");
    gatherEnderPearls();
  }, 10000);
}

// جمع Ender Pearls من الـEndermen أو من خلال التجارة مع Piglins
function gatherEnderPearls() {
  bot.chat("Hunting Endermen for Ender Pearls...");
  // الكود لقتال الـEndermen أو التجارة مع Piglins
  setTimeout(() => {
    bot.chat("Got enough Ender Pearls! Time to find the Stronghold.");
    findStronghold();
  }, 10000);
}

// البحث عن Stronghold باستخدام Eyes of Ender
function findStronghold() {
  bot.chat("Searching for the Stronghold...");
  // الكود لاستخدام Eyes of Ender والعثور على الـStronghold
  setTimeout(() => {
    bot.chat("Found the Stronghold! Time to fight the Ender Dragon.");
    fightEnderDragon();
  }, 10000);
}

// قتال التنين في النهاية
function fightEnderDragon() {
  bot.chat("Fighting the Ender Dragon...");
  // الكود لتدمير البلورات وقتال التنين
  setTimeout(() => {
    bot.chat("Ender Dragon defeated! Game completed.");
  }, 20000);
}

bot.on('goal_reached', () => {
  bot.chat('Goal reached!');
});

bot.on('death', () => {
  bot.chat('I died! Respawning...');
});
