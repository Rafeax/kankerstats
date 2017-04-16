var fs = require("fs");

function RegisterName(name, steamId) {
	var existingNames = LoadAllNames();
}

exports.messageHandler = function (name, steamId) {
	
}

function LoadAllNames() {	
	var names = fs.readFileSync('nameregister.txt', 'utf8');
		
	var keyPairs = names.split(';');
	
	var nameArray = [];
	
	for(var x = 0; x < keyPairs.length; x++) 
	{
		if (typeof(keyPairs[x]) == 'undefined' || nameArray[x] === '')
			continue;
				
		var namePair = keyPairs[x].split(',');
		nameArray.push({
			name: namePair[0],
			steamId: parseInt(namePair[1])
		});
	}
	
	return nameArray;
}

exports.LoadAllNames = function () {
	return LoadAllNames();
}

exports.CheckIdForName = function(steamId) {
	var names = LoadAllNames();
	
	var steamId = parseInt(steamId);
	
	for(var x = 0; x < names.length; x++)
	{
		if (names[x].steamId === steamId)
			return names[x].name;
	}
	
	return steamId.toString();
}

exports.CheckListForName = function(steamId, names) {
	var steamId = parseInt(steamId);

	
	for(var x = 0; x < names.length; x++)
	{
		if (names[x].steamId === steamId) {
			console.log('Steam id ' + steamId + ' matched name:' + names[x].name);
			return names[x].name;
		}
	}
	
	return steamId.toString();
}