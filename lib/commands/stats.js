const Dota2Api = require('dota2-api');
const cfg      = require('../../config.js');
const nameRegister = require('../commands/nameregister.js');

const dota     = Dota2Api.create(cfg.dotaToken, 570);


exports.messageHandler = (message) => { 
	//Ignore potential messages from the bot itself
	//Don't bother if the channel isn't avaliable.
  if (message.author === message.client.user || !message.guild
    || !message.guild.available) {
    return;
  }
  
  const content = message.content;
  if (!content.startsWith('-ks'))
	  return;
  
  if (content.includes('?'))
	  return message.reply('syntax: -ks [matchid] ([r|d]) \r\nReturns stats for the given match id. Optional: Specify team using r/d');
  
  //Check the match id is formatted correctly. 
  var matchId = TryParseInt(content.replace('-ks ', '').replace('d', '').replace('r', ''), -1);
  if (matchId === -1)
	  return message.reply('Match id was not an int. Value: ' + ccontent.replace('-ks ', '').replace('d', '').replace('r', ''));
  
  var team = content.substr(content.length - 1, 1);
  
  GetStats(matchId, team, message);
}

function GetStats(matchId, team, message) {
	if (isNaN(matchId))
		return 'match id is not an int'
	
	console.log('Finding match details for:' +matchId);
	
	dota.getMatchDetails({match_id:matchId}).then((data) => {
		var md = data.result;
		
		if (md == null)
			return 'match id did not return a match, or somethings wrong with the API';
		
		var players = GetPlayers(md.players, team);
		
		SortPlayers(players)
		
		return message.reply(CreateMessage(players));
	});
}

function SortPlayers(players) {
	players.sort(function(a, b) {return b.realScore - a.realScore;});
}

function CreateMessage(players) {
	var nameMax = getNameMax(players);
	var kdaMax = getKdaMax(players);
	var netWorthMax = getNetWorthMax(players);
	var heroDmgMax = getHeroDmgMax(players);
	
	var message = '\r\n'
		+ ValueToMaxLength('Player', nameMax)+'\t| '
		+ ValueToMaxLength('K/D/A', kdaMax) +'\t| ' 
		+ ValueToMaxLength('Net worth', netWorthMax)+'\t| '
		+ ValueToMaxLength('Hero D.', heroDmgMax) +'\t| '
		+ 'Score\r\n';
				
	for (var x = 0; x < (nameMax + kdaMax +netWorthMax + heroDmgMax)*2; x++)
	{
		message += '-';
	}
		
	console.log('Creating final message');
	for (var x = 0; x < players.length; x++) 
	{
		message += '\r\n'
		var player = players[x];
		
		var id = player.name == '' ? player.steamid : player.name;
		
		message += ValueToMaxLength(id, nameMax) + '\t| ' 
			+ ValueToMaxLength(GetKda(player), kdaMax) + '\t| ' 
			+ ValueToMaxLength(player.netWorth, netWorthMax) + '\t| ' 
			+ ValueToMaxLength(player.heroDmg, heroDmgMax) + '\t| ' 
			+ player.realScore;
	}
	console.log('Returning message: ' + message);
	
	return message;
}

function ValueToMaxLength(value, max) {
	while (value.toString().length < max)
		value += ' ';
	return value;
}

function getNameMax(players) {
	var max = 6;
	for (var x = 0; x < players.length; x++) 
	{
		var player = players[x];
		
		var id = player.name == '' ? player.steamid : player.name;
		
		var length = id.toString().length;
		if (length > max)
			max = length;
	}
	
	return max + 1;
}

function getKdaMax(players) {
	var max = 5;
	for (var x = 0; x < players.length; x++) 
	{
		var player = players[x];
		
		var length = GetKda(player).toString().length;
		if (length > max)
			max = length;
	}
	
	return max + 1;
}

function getNetWorthMax(players) {
	var max = 9;
	for (var x = 0; x < players.length; x++) 
	{
		var player = players[x];
		
		var length = player.netWorth.toString().length;
		if (length > max)
			max = length;
	}
	
	return max + 1;
}

function getHeroDmgMax(players) {
	var max = 7;
	for (var x = 0; x < players.length; x++) 
	{
		var player = players[x];
		
		var length = player.heroDmg.toString().length;
		if (length > max)
			max = length;
	}
	
	return max + 1;
}

function GetPlayers(players, teamToRank) {
	var parsedPlayers  = [];
	
	var maxLastHits = 0;
	
	var names = nameRegister.LoadAllNames();
	
	console.log('Creating the list of players and scores');
	for (var x = 0; x < players.length; x++)
	{
		var playerOrig = players[x];
		
		console.log('Checking player ' + (x+1));
		
		if (ShouldAddPlayer(teamToRank, playerOrig.player_slot))
			continue;
		
		console.log('Adding...');
		
		var player = CreatePlayer(playerOrig, names);
		
		player.score = AnalysePlayer(player);
		
		if (player.lastHits > maxLastHits)
			maxLastHits = player.lastHits;
		
		parsedPlayers.push(player);
	}
	
	console.log('Calculating the support adjustment');
	for (var x = 0; x < parsedPlayers.length; x++)
	{
		var player = parsedPlayers[x];
		
		player.realScore = CalculateRealScore(player, maxLastHits);
	}
	
	return parsedPlayers;
}

function CalculateRealScore(player, maxLastHits) {
	return Math.round(player.score * GetSupportFactor(player, maxLastHits));
}

function ShouldAddPlayer(teamToRank, playerSlot) {
	return parseInt(playerSlot) > 127 ? 
	'r' === teamToRank : 'd' === teamToRank;
}

function CreatePlayer(player, names) {
	return { 
		steamid: player.account_id,
		name: nameRegister.CheckListForName(player.account_id, names),
		score: 0,
		realScore: 0,
		kills: player.kills,
		deaths: player.deaths,
		assists: player.assists,
		heroDmg: player.hero_damage,
		buildingDmg: player.tower_damage,
		healing: player.hero_healing,
		netWorth: player.gold + player.gold_spent,
		lastHits: player.last_hits,
		role: ''
	}
}

function AnalysePlayer(player) {
	//Kills = 1000
	//Assists = 350
	//Deaths = -400
	//heroDmg = 0.75
	//buildingDmg = 1
	//healing = 1.2
	//netWorth = 0.75
	//lastHits = 20
	
	var score = 1500;
	
	score += player.kills * 700;
	score += player.assists * 350;
	score += player.deaths * -375;
	score += player.heroDmg * 0.85;
	score += player.buildingDmg * 1;
	score += player.healing * 1.4;
	score += player.netWorth * 0.65;
	score += player.lastHits * 15;
	
	return score;
}

function GetSupportFactor(player, maxLastHits)
{
	const percThreshold = 40;
	var lastHits = player.lastHits;
	
	var perc = Math.round(lastHits / parseFloat(maxLastHits)) * 100;
	
	if (player.steamid === 45300455)
		perc -= 140;
	
	if (perc > percThreshold)
		return 1;
	
	return (100 + (percThreshold - perc)) / 100.0;
}

function GetKda(player) {
	return player.kills + '/' + player.deaths + '/' + player.assists;
}

//Refactor this into a library if I ever actually do anything
function TryParseInt(str,defaultValue) {
     var retValue = defaultValue;
     if(str !== null) {
         if(str.length > 0) {
             if (!isNaN(str)) {
                 retValue = parseInt(str);
             }
         }
     }
     return retValue;
}

