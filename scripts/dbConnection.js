"use strict";

function DBConnection(){
	// for now, going to load everything synchronously.
	var dbo = {};

	var loadFlatFile = function(fileName){
		$.ajax({
			url: "data/" + fileName + ".json",
			async: false,
			dataType: "json",
			success: function(data){
				dbo[fileName] = data;
			}
			error: function(jqXHR, textStatus, errorThrown){
				console.warn("Failed to get " + fileName + ".json - " + textStatus + " " + errorThrown);
			}
		});
	}

	loadFlatFile("dboMapInfo");
	loadFlatFile("dboMapItem");
	loadFlatFile("dboMapRegion");
	loadFlatFile("dboMapZone");
	loadFlatFile("dboPublicRegistry");

	// returns an object name and position used to initialize the map (or null if doesn't exist)
	this.resolveTarget = function(target){
		// with flat files, this requires the publicregistry and mapItem
		var dboMapItem  = dbo["dboMapItem"];
		var dboMapZone  = dbo["dboMapZone"];
		var dboMapRegion  = dbo["dboMapRegion"];
		var dboPublicRegistry = dbo["dboPublicRegistry"];

		if(target in dboPublicRegistry){
			entry = dboPublicRegistry[target];
			switch(entry){
				case "item":
				var item = dboMapItem[entry.localid];
				return {name: item.name, pos: item.pos};
				break;

				case "zone":
				var zone = dboMapZone[entry.localid];
				return {name: zone.name, pos: {x: (zone.area.right + zone.area.left) / 2, y: (zone.area.bottom + zone.area.top) / 2}};
				break;

				case "region":
				var region = dboMapRegion[entry.localid];
				return {name: region.name, pos: region.label};
				break;

				default:
				return null;
			}
		}
	}

	// items is optional, including an array of strings (or one string) will only load those types
	// not specifying items will load all items
	this.getZoneItems = function(zone, items){
		// with flat files, this requires the map
	}

	// gets everything required for the map to load
	this.getMapInfo = function(){
		// returns map size and regions
	}

	this.getZoneRoutes = function(zone){
		
	}
}