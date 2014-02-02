function DBConnection(){
	
}

DBConnection.prototype.resolveTarget = function(target){
	// with flat files, this requires the publicregistry and mapItem
}

// items is optional, including an array of strings (or one string) will only load those types
// not specifying items will load all items
DBConnection.prototype.getZoneItems = function(region, items){
	// with flat files, this requires the map
}

// gets everything required for the map to load
DBConnection.prototype.getMapInfo = function(){
	// returns map size and regions
}