'use strict';

const cfg     = require('../config.js');
const Discord = require('discord.js');
const stats   = require('./commands/stats.js');
const nameRegister = require('./commands/nameregister.js');


const bot     = new Discord.Client();

const passToMessageHandlers = function(msg) {
	stats.messageHandler(msg);
}

bot.on('message', passToMessageHandlers);

bot.login(cfg.discordToken).then(() => {
  console.log('kankerstats ready!');
});

