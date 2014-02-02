
// Map Logic
// handles all map-related stuff
// all dbo objects are loaded at this point




// HELPER FUNCTIONS

function toChatCode(id){
	// convert id to 2 bytes, reverse bytes, add 0x04 to the front and 0x00 0x00 to the back, encode to base 64, surround in [& and ];
	return '[&'+btoa(String.fromCharCode(0x04, id % 256, Math.floor(id/256), 0x00, 0x00))+']';
}

function distanceFromSegment(p, a, b){
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    var L = (dx*dx) + (dy*dy);
    if(L == 0){
    	return Math.sqrt((p.x - a.x) * (p.x - a.x) + (p.y - a.y) * (p.y - a.y));
    }
    var r = ((p.x - a.x) * dx + (p.y - a.y) * dy) / L;
    if(r > 1){
    	return Math.sqrt((p.x - b.x) * (p.x - b.x) + (p.y - b.y) * (p.y - b.y));
    }else if(r < 0){
    	return Math.sqrt((p.x - a.x) * (p.x - a.x) + (p.y - a.y) * (p.y - a.y));
    }
    dx = a.x + r * dx;
    dy = a.y + r * dy;
    return Math.sqrt((p.x - dx) * (p.x - dx) + (p.y - dy) * (p.y - dy));
}

// CONVERSION FUNCTIONS

function fromLatLngToPoint(ll, max_zoom){
	var point = new google.maps.Point(0, 0),
	origin = new google.maps.Point(128, 128),
	tiles = 1 << max_zoom,
	bound = function(value, min, max){
		if (min != null) value = Math.max(value, min);
		if (max != null) value = Math.min(value, max);
		return value;
	},
	sin_y = bound(Math.sin(ll.lat() * (Math.PI / 180)), -0.9999, 0.9999);
	point.x = origin.x + ll.lng() * (256 / 360);
	point.y = origin.y + 0.5 * Math.log((1 + sin_y) / (1 - sin_y)) * -(256 / (2 * Math.PI));
	return new google.maps.Point(Math.floor(point.x * tiles), Math.floor(point.y * tiles));
}

function fromPointToLatLng(point, max_zoom){
	var size = (1 << max_zoom) * 256,
	lat = (2 * Math.atan(Math.exp((point.y - size/2) / -(size/(2 * Math.PI)))) - (Math.PI / 2)) * (180/Math.PI),
	lng = (point.x - size/2) * (360/size);
	return new google.maps.LatLng(lat, lng);
}

// process URL query
var minZoom = 5;
var maxZoom = 11;
var mapSize = Math.max(dboMapInfo.size.x, dboMapInfo.size.y);
var markerZoom = 9;
var waypointZoom = 8;
var startMapPos = {x: mapSize/2, y: mapSize/2};
var startMapZoom = 8;
var markersStartVisible = startMapZoom > markerZoom;

// process target
if(typeof URLquery.target != 'undefined'){
	for(var i = 0; i < URLquery.target.length; ++i)
	{
		// try each target in order
		// is it an pubid target?
		if(URLquery.target[i] in dboPublicRegistry)
		{
			var entry = dboPublicRegistry[URLquery.target[i]];
			if(entry.type == "item"){
				var itemData = dboMapItem[entry.localid];
				startMapPos = itemData.pos;
				if(typeof URLquery.zoom == 'undefined'){
					startMapZoom = maxZoom;
				}
				break;
			}else if(entry.type == "zone"){
				var zoneData = dboMapZone[entry.localid];
				startMapPos = {x: (zoneData.area.right + zoneData.area.left) / 2, y: (zoneData.area.bottom + zoneData.area.top) / 2};
				if(typeof URLquery.zoom == 'undefined'){
					startMapZoom = maxZoom;
				}
				break;
			}else if(entry.type == "region"){
				var regionData = dboMapRegion[entry.localid];
				startMapPos = regionData.label;
				if(typeof URLquery.zoom == 'undefined'){
					startMapZoom = maxZoom;
				}
				break;
			}
		}else
		{
			// position data, check if formatted as "number,number"
			var match = URLquery.target[i].match(/(\d.*)\,(\d.*)/);

			if(match){
				var tempX = parseInt(match[1], 10);
				var tempY = parseInt(match[2], 10);
				if(tempX && tempY){
					startMapPos = {x: tempX, y: tempY};
				}	
			}
		}
	}
}

// process zoom
if(typeof URLquery.zoom != 'undefined'){
	for(var i = 0; i < URLquery.zoom.length; ++i){
		var tempZoom = parseInt(URLquery.zoom[i]);
		if(tempZoom && tempZoom >= minZoom && tempZoom <= maxZoom){
			startMapZoom = tempZoom;
			markersStartVisible = startMapZoom > markerZoom;
			break;
		}
	}
}

// on page load
$(document).ready(function(){

	var loadStart = new Date().getTime();

	var max_zoom = function(){
		return maxZoom;
	};

	var ll2p = function(latlng){
		var p = fromLatLngToPoint(latlng, max_zoom());
		p.x -= (mapSize*8), p.y -= (mapSize*8);
		return p;
	};

	var p2ll = function(point){
		point.x += (mapSize*8), point.y += (mapSize*8);
		return fromPointToLatLng(point, max_zoom());
	};

	function toLatLng(x,y){
		return p2ll(new google.maps.Point(x, y));
	}

// Map Declaration
	var gmap = new google.maps.Map(document.getElementById("gw2map") , {
		disableDoubleClickZoom: true,
		zoom: startMapZoom,
		minZoom: minZoom,
		maxZoom: maxZoom,
		center: toLatLng(startMapPos.x, startMapPos.y),
		streetViewControl: false,
		mapTypeControl: false,
		zoomControlOptions: {
			position: google.maps.ControlPosition.RIGHT_BOTTOM,
		},
		panControl: false,
		backgroundColor: '#000',
		mapTypeId: "1", // string for gmaps' sake
//		mapTypeControlOptions: {
//			mapTypeIds: ["1","2"]
//		}
	});

// to translate map coordinates to pixel coordinates to display the mouse-over div for map items

	var pixelOverlay = new google.maps.OverlayView();
	pixelOverlay.draw = function(){};
	pixelOverlay.setMap(gmap);

// functions to drive the map



	var get_tile = function(coords,zoom){
		var zOffset = 4;
		var offset = (1 << (zoom - 1));
		var actualX = coords.x - offset;
		var actualY = coords.y - offset;
		var actualZ = zoom - zOffset;
		if(actualY < 0 || actualX < 0 || actualY >= (1 << actualZ) || actualX >= (1 << actualZ)){
			return "http://wiki-de.guildwars2.com/images/6/6f/Kartenhintergrund.png";
		}
		return "https://tiles.guildwars2.com/"+gmap.getMapTypeId()+"/1/"+actualZ+"/"+actualX+"/"+actualY+".jpg";
	};

// defining map settings

	var tile_size = new google.maps.Size(256,256);

	var tyria = new google.maps.ImageMapType({
		maxZoom: 11,
		alt: "Tyria",
		name: "Tyria",
		tileSize: tile_size,
		getTileUrl: get_tile
	});
/*		
	var mists = new google.maps.ImageMapType({
		maxZoom: 10,
		alt: "The Mists",
		name: "The Mists",
		tileSize: tile_size,
		getTileUrl: get_tile
	});
*/
	gmap.mapTypes.set("1",tyria);
//	gmap.mapTypes.set("2",mists);

	var mapMarkers = {};
	mapMarkers['waypoint'] = new Array();
	mapMarkers['landmark'] = new Array();
	mapMarkers['task'] = new Array();
	mapMarkers['skill'] = new Array();
	mapMarkers['vista'] = new Array();

	var dboMapPaths = {}; // paths indexed by zoneid, eventually from an external file
	// for testing
	for(var key in dboMapZone){
		dboMapPaths[key] = {};
		dboMapPaths[key]['0'] = {name: "Map Exploration"};
	}

// Organize it like a DB would in tables (or arrays of objects on a lookup-key).
// example follows:

/*
	dboPublicRegistry[pubid] = {
		type,
		localid
	}

	dboMapItem[itemid] = {
		pubid,
		itemid,
		zoneid (foreign),
		type,
		name,
		pos{
			x,
			y
		},
		level
	}

	dboMapZone[zoneid] = {
		pubid,
		zoneid,
		regionid (foreign),
		name,
		lavel{
			min,
			max
		},
		area{
			top,
			bottom,
			left,
			right
		},
		items = [] // list of items in zone, by itemid
	}

	dboMapRegion[regionid] = {
		pubid,
		regionid,
		name,
		label{
			x,
			y
		},
		zones = [] // list of zones in region, by zoneid
	}

	lookup of values via pubid is easy. Lookup type and localid via the publicRegistry. get item information from specific table
*/
/*
	// declared in data file
	var dboPublicRegistry = {};
	var dboMapItem = {};
	var dboMapZone = {};
	var dboMapRegion = {};
	var dboMapInfo = {};
*/

//	$.getJSON( "https://api.guildwars2.com/v1/map_floor.json?continent_id=1&floor=0", function( data ) {

	var iconTypes = {};

	iconTypes["waypoint"] = {
		url: "images/icon_waypoint.png",
		anchor: new google.maps.Point(14,14),
		scaledSize: new google.maps.Size(28,28),
	};

	iconTypes["waypointHover"] = {
		url: "images/icon_waypoint_hover.png",
		anchor: new google.maps.Point(14,14),
		scaledSize: new google.maps.Size(28,28),
	};

	iconTypes["landmark"] = {
		url: "images/icon_POI.png",
		anchor: new google.maps.Point(11,11),
		scaledSize: new google.maps.Size(22,22),
	};

	iconTypes["vista"] = {
		url: "images/icon_vista.png",
		anchor: new google.maps.Point(11,11),
		scaledSize: new google.maps.Size(22,22),
	};

	iconTypes["skill"] = {
		url: "images/icon_skillpoint.png",
		anchor: new google.maps.Point(11,11),
		scaledSize: new google.maps.Size(22,22),
	};

	iconTypes["task"] = {
		url: "images/icon_heart.png",
		anchor: new google.maps.Point(11,11),
		scaledSize: new google.maps.Size(22,22),
	};

	function makeOverFunc(target){
		return function(e){
			// waypoint icon
			if(target.mapItem.type == "waypoint"){
				target.setIcon(iconTypes['waypointHover']);
			}
			// task special name
			if(target.mapItem.type == "task"){
				$('#hover_window').html(target.mapItem.name + String.fromCharCode(160,160) + "<font style='color:#BBB;font-size:0.9em;'>(" + target.mapItem.level + ")</font>");
			}else{
				$('#hover_window').html(target.mapItem.name);
			}
			// show pop-up text
			$('#hover_window').stop().fadeIn({
				duration:200,
				queue: false,
			});
			// get future position and current size of textbox
			var proj = pixelOverlay.getProjection();
			var pixel = proj.fromLatLngToContainerPixel(target.getPosition());
			var docWidth = $(window).width();
			var floatWidth = $('#hover_window').width();			
			// if textbox is going to overflow, flip it to go the other direction
			if(Math.round(pixel.x) + floatWidth + 20 >= docWidth){
				$('#hover_window').css({
					top: (Math.round(pixel.y) - 45) + "px",
					left: (Math.round(pixel.x) - (floatWidth + 10) ) + "px",
				});
			}else{ // otherwise go normal direction
				$('#hover_window').css({
					top: (Math.round(pixel.y) - 45) + "px",
					left: (Math.round(pixel.x) + 0) + "px",
				});
			}

			
			
		};
	}

	function makeOutFunc(target){
		return function(e){ 
			if(target.mapItem.type == "waypoint"){
				target.setIcon(iconTypes['waypoint']);
			}
			$('#hover_window').stop().fadeOut({
				duration:200,
				queue: false,
			});
		};
	}

	function makeClickFunc(target){
		return function(e){
			$('#dialog_title').text(target.mapItem.name);

			var output = "<p>Direct Link: ?target=" +  target.mapItem.pubid + "</p>";

			if(target.mapItem.type == "waypoint" || target.mapItem.type == "landmark"){
				output += "<p>Chat Code: " + toChatCode(target.mapItem.itemid).replace('&', '&amp;') + "</p>";

				output += "<p>ID Code: " + target.mapItem.itemid;
			}

			$('#dialog_content').html(output);

			if(!$('#dialog_window').is(':visible'))
			{
				$('#dialog_window').fadeIn();

				$('#dialog_window').css({
					'left': (($(window).width() - $('#dialog_window').width())/2) + 'px', 
					'top': (($(window).height() - $('#dialog_window').height())/2) + 'px'
				});
			}
		}
	}

	// for each region

	for(var key in dboMapRegion){
		var region = dboMapRegion[key];

		new MapLabel({
			map: gmap,
			fontColor: '#d6bb70',
			fontSize: 24,
			fontFamily: 'Menomonia',
			strokeWeight: 3,
			strokeColor: '#000',
			maxZoom: 6,
			minZoom: 6,
			position: toLatLng(region.label.x, region.label.y),
			text: region.name,
			zIndex: 100,
		});
	}

	// for each zone
	for(var key in dboMapZone){
		var zone = dboMapZone[key];

		new MapLabel({
			map: gmap,
			fontColor: '#d6bb70',
			fontSize: 24,
			fontFamily: 'Menomonia',
			strokeWeight: 3,
			strokeColor: '#000',
			maxZoom: 9,
			minZoom: 7,
			position: toLatLng((zone.area.left + zone.area.right) / 2, (zone.area.top + zone.area.bottom) / 2),
			text: zone.name,
			level: zone.level.min == 0 ? null : "(" + zone.level.min + " - " + zone.level.max + ")",
			levelColor: '#777',
			levelSize: 20,
			zIndex: 100,
		});
	}

	// for each item
	for(var key in dboMapItem){
		var item = dboMapItem[key];

		var itemName = item.name;
		if(item.type == 'task'){
			itemName += String.fromCharCode(160,160) + "<font style='color:#BBB;font-size:0.9em;'>(" + item.level + ")</font>";
		}

		if(typeof iconTypes[item.type] != 'undefined'){
			tempMarker = new google.maps.Marker({
				position: toLatLng(item.pos.x, item.pos.y),
				draggable: false,
				icon: iconTypes[item.type],
				mapItem: item,
				zIndex: 100,
			});

			google.maps.event.addListener(tempMarker, "mouseover", makeOverFunc(tempMarker));
			google.maps.event.addListener(tempMarker, "mouseout", makeOutFunc(tempMarker));
			google.maps.event.addListener(tempMarker, "click", makeClickFunc(tempMarker));

			mapMarkers[item.type].push(tempMarker);
		}
	}

	var MarkerMan = new MarkerManager(gmap, {borderPadding: 0});
	google.maps.event.addListener(MarkerMan, 'loaded', function(){
		for(var key in mapMarkers){
			if(key == 'waypoint'){
				MarkerMan.addMarkers(mapMarkers[key], waypointZoom);
			}else{
				MarkerMan.addMarkers(mapMarkers[key], markerZoom);
			}
			
		}
		MarkerMan.refresh();
	});

	// map center
	// hold map in place
	google.maps.event.addListener(gmap, 'center_changed', function(){
		var bounds = gmap.getBounds();
		var ne = ll2p(bounds.getNorthEast());
		var sw = ll2p(bounds.getSouthWest());
		var pos = ll2p(gmap.getCenter());
		//console.log("center: " + pos.x + ", " + pos.y);
		//console.log("NE: " + ne.x + ", " + ne.y);
		//console.log("SW: " + sw.x + ", " + sw.y);

		var force = false;

		if(sw.y - ne.y >= mapSize){
			if(pos.y != mapSize/2){
				pos.y = mapSize/2;
				force = true;
			}
		}else if(ne.y < 0){
			pos.y -= ne.y;
			force = true;
		}else if(sw.y > mapSize){
			pos.y -= (sw.y - mapSize);
			force = true;
		}

		if(ne.x - sw.x >= mapSize){
			if(pos.x != mapSize/2){
				pos.x = mapSize/2;
				force = true;
			}
		}else if(sw.x < 0){
			pos.x -= sw.x;
			force = true;
		}else if(ne.x > mapSize){
			pos.x -= (ne.x - mapSize);
			force = true;
		}

		if(force == true){
			//console.log("set center: " + pos.x + ", " + pos.y);
			gmap.setCenter(p2ll(pos));
			
		}

	});

	// detect zone stuff

	var currentZone = null;
	var isEditMode = false;
	var isLocked = false;

	function updateControls(){
		if(currentZone != null){
			// get paths in the zone
			if(currentZone.zoneid in dboMapPaths && dboMapPaths[currentZone.zoneid].length != 0){
				var currentPaths = dboMapPaths[currentZone.zoneid];
				$('#map_controls_title').text(currentZone.name);
				$('#map_controls_subtitle').text("Exploration routes").show();
				$('#map_controls_error').hide();

				$('#map_controls_content').empty();
				for(var key in currentPaths){
					var path = currentPaths[key];

					AddItemToControl(path.name, false, function(){console.log("Hello World");});
				}
			}else{
				// no paths for zone
				$('#map_controls_subtitle').hide();
				$('#map_controls_error').text("This zone does not have any routes.").show();
			}
		}else{

			$('#map_controls_title').text("No Zone Selected");
			$('#map_controls_subtitle').text("Double-click on a zone to get started")
			$('#map_controls_error').hide();
			$('#map_controls_content').empty();
		}
	}

	updateControls();

	$('#map_title').hide();

	function updateCurrentZone(p){
		if(currentZone == null || 
			(
				currentZone.area.top >= p.y ||
				currentZone.area.bottom <= p.y ||
				currentZone.area.left >= p.x ||
				currentZone.area.right <= p.x
			))
		{
			for(var key in dboMapZone){
				var zone = dboMapZone[key];

				if(zone.area.top < p.y &&
					zone.area.bottom > p.y &&
					zone.area.left < p.x &&
					zone.area.right > p.x)
				{
					currentZone = zone;
					//$('#map_title').show()
					//$('#map_title_content').text(zone.name);

					updateControls();
					return;
				}
			}
			//currentZone = null;
			//updateControls();
			//$('#map_title').hide();
		}	
	};

	//updateCurrentZone(startMapPos);

	google.maps.event.addListener(gmap, 'dblclick', function(e){
		var p = ll2p(e.latLng);
		updateCurrentZone(p);
	});

	//google.maps.event.addListener(gmap, 'center_changed', updateCurrentZone)

	// testing path stuff

	var pathStyleNormal = {
		editable: false,
		map: gmap,
		suppressUndo: true,
		zIndex: 9,
		strokeOpacity: 1,
		strokeWeight: 3,
		strokeColor: '#4F4',
	};

	var pathStyleUnderground = {
		editable: false,
		map: gmap,
		suppressUndo: true,
		zIndex: 9,
		strokeOpacity: 0,
		strokeWeight: 2,
		strokeColor: '#F62',
		icons:  [{
	    	icon: {
			    path: 'M 1,-2 1,2 -1,2 -1,-2 z',
			    fillOpacity: 1,
			    strokeWeight: 0,
		  	},
	    	offset: '0px',
	    	repeat: '12px',
	    }],
	};

	var myPath = new MapPath(gmap, {
		types: [pathStyleNormal, pathStyleUnderground],
		vertices: [
			{
				pos: p2ll(new google.maps.Point(4000,4000)),
				type: 0,
			},
			{
				pos: p2ll(new google.maps.Point(6000,6000)),
				type: 0,
			},
			{
				pos: p2ll(new google.maps.Point(12000,7000)),
				type: 1,
			},
			{
				pos: p2ll(new google.maps.Point(9000,10000)),
				type: 0,
			},
			{
				pos: p2ll(new google.maps.Point(10000,11000)),
				type: 0,
			},
		],
	});   	

	
	//ShowUI();

	google.maps.event.addListener(gmap, 'rightclick', function(e){
		var point = ll2p(e.latLng);
		console.log(point.x + ", " + point.y);
	});

	// once the map loads, show everything
	google.maps.event.addListenerOnce(gmap, 'idle', function(){
		ShowUI();
		// need to resize to have the whole map show
		google.maps.event.trigger(gmap, 'resize');
		gmap.setCenter(toLatLng(startMapPos.x, startMapPos.y));
	});

});