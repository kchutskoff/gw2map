
// Map Logic
// handles all map-related stuff
// all dbo objects are loaded at this point


// get URL query parameters
var URLquery = function(){
	var out = {};
	var q = window.location.search.substring(1).split('&');
	for (var i = 0; i < q.length; i++) {
		var pair = q[i].split('=');
		if(typeof out[pair[0]] === 'undefined'){
			out[pair[0]] = new Array();
		}
		out[pair[0]].push(pair[1]);
	};
	return out;
}();

// HELPER FUNCTIONS

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
var markerZoom = 8;
var startMapX = mapSize/2;
var startMapY = mapSize/2;
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
				startMapX = itemData.pos.x;
				startMapY = itemData.pos.y;
				break;
			}else if(entry.type == "zone"){
				var zoneData = dboMapZone[entry.localid];
				startMapX = (zoneData.area.right + zoneData.area.left) / 2;
				startMapY = (zoneData.area.bottom + zoneData.area.top) / 2;
				break;
			}else if(entry.type == "region"){
				var regionData = dboMapRegion[entry.localid];
				startMapX = regionData.label.x;
				startMapY = regionData.label.y;
				break;
			}
		}else
		{
			// position data, check if formatted as "number,number"
			var match = URLquery.target[i].match(/(\d.*)\,(\d.*)/);
			console.log(match);

			if(match){
				var tempX = parseInt(match[1], 10);
				var tempY = parseInt(match[2], 10);
				if(centerx && centery){
					startMapX = tempX;
					startMapY = tempY;
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

console.log(startMapX + ", " + startMapY + ", " + startMapZoom);


// on page load
$(document).ready(function(){

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
		zoom: startMapZoom,
		minZoom: minZoom,
		maxZoom: maxZoom,
		center: toLatLng(startMapX, startMapY),
		streetViewControl: false,
		mapTypeControl: false,
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

	$.getJSON( "https://api.guildwars2.com/v1/map_floor.json?continent_id=1&floor=0", function( data ) {

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
				$('#hover_window').html(target.name);
				$('#hover_window').stop().fadeIn({
					duration:200,
					queue: false,
				});
				if(target.type == "waypoint"){
					target.setIcon(iconTypes['waypointHover']);
				}

				var proj = pixelOverlay.getProjection();
				var pixel = proj.fromLatLngToContainerPixel(target.getPosition());
				var docWidth = $(document).width();
				var floatWidth = $('#hover_window').width();
				

				if(Math.round(pixel.x) + floatWidth + 20 >= docWidth){
					$('#hover_window').css({
						top: (Math.round(pixel.y) - 45) + "px",
						left: (Math.round(pixel.x) - (floatWidth + 10) ) + "px",
					});
				}else{
					$('#hover_window').css({
						top: (Math.round(pixel.y) - 45) + "px",
						left: (Math.round(pixel.x) + 0) + "px",
					});
				}

				
				
			};
		}

		function makeOutFunc(target){
			return function(e){ 
				if(target.type == "waypoint"){
					target.setIcon(iconTypes['waypoint']);
				}
				$('#hover_window').stop().fadeOut({
					duration:200,
					queue: false,
				});
			};
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
					map: gmap,
					icon: iconTypes[item.type],
					visible: markersStartVisible,
					name: itemName,
					type: item.type,
					zIndex: 100,
				});

				google.maps.event.addListener(tempMarker, "mouseover", makeOverFunc(tempMarker));
				google.maps.event.addListener(tempMarker, "mouseout", makeOutFunc(tempMarker));

				mapMarkers[item.type].push(tempMarker);
			}
		}
/*
		for(var rkey in data.regions){
			var region = data.regions[rkey];
			for(var mkey in region.maps){
				var map = region.maps[mkey];
				if($.inArray(map.name, map_whitelist) == -1){
					continue;
				}
				for(var key in map.points_of_interest){
					var POI = map.points_of_interest[key];

					var tempMarker;
					if(POI.type == "landmark"){
						tempMarker = new google.maps.Marker({
							position: p2ll(new google.maps.Point(POI.coord[0], POI.coord[1])),
							draggable: false,
							map: gmap,
							icon: landmarkIcon,
							visible: markersStartVisible,
							name: POI.name,
							type: POI.type,
							zIndex: 100,
						});

						markers_point_of_interest.push(tempMarker);

						google.maps.event.addListener(tempMarker, "mouseover", makeOverFunc(tempMarker));
						google.maps.event.addListener(tempMarker, "mouseout", makeOutFunc(tempMarker));

					}else if(POI.type == "waypoint"){
						tempMarker = new google.maps.Marker({
							position: p2ll(new google.maps.Point(POI.coord[0], POI.coord[1])),
							draggable: false,
							map: gmap,
							icon: waypointIcon,
							visible: markersStartVisible,
							name: POI.name,
							type: POI.type,
							zIndex: 100,
						});

						google.maps.event.addListener(tempMarker, "mouseover", makeOverFunc(tempMarker));
						google.maps.event.addListener(tempMarker, "mouseout", makeOutFunc(tempMarker));

						markers_waypoint.push(tempMarker);

					}else if(POI.type == "vista"){
						tempMarker = new google.maps.Marker({
							position: p2ll(new google.maps.Point(POI.coord[0], POI.coord[1])),
							draggable: false,
							map: gmap,
							icon: vistaIcon,
							visible: markersStartVisible,
							name: "Discovered Vista",
							type: POI.type,
							zIndex: 100,
						});

						markers_vista.push(tempMarker);

						google.maps.event.addListener(tempMarker, "mouseover", makeOverFunc(tempMarker));
						google.maps.event.addListener(tempMarker, "mouseout", makeOutFunc(tempMarker));
					}
				}

				for(var key in map.tasks){
					var task = map.tasks[key];
					
					var tempMarker = new google.maps.Marker({
						position: p2ll(new google.maps.Point(task.coord[0], task.coord[1])),
						draggable: false,
						map: gmap,
						icon: taskIcon,
						visible: markersStartVisible,
						name: task.objective + "\xA0\xA0<font style='color:#BBB;font-size:0.9em;'>(" + task.level + ")</font>",
						type: "task",
						zIndex: 100,
					});
					markers_heart.push(tempMarker);

					google.maps.event.addListener(tempMarker, "mouseover", makeOverFunc(tempMarker));
					google.maps.event.addListener(tempMarker, "mouseout", makeOutFunc(tempMarker));

				}

				for(var key in map.skill_challenges){
					var skill = map.skill_challenges[key];

					var tempMarker = new google.maps.Marker({
						position: p2ll(new google.maps.Point(skill.coord[0], skill.coord[1])),
						draggable: false,
						map: gmap,
						icon: skillpointIcon,
						visible: markersStartVisible,
						type: "skill",
						name: "Skill Point",
						zIndex: 100,
					});
					markers_skill.push(tempMarker);

					google.maps.event.addListener(tempMarker, "mouseover", makeOverFunc(tempMarker));
					google.maps.event.addListener(tempMarker, "mouseout", makeOutFunc(tempMarker));
					
				}

				var label_coord = new google.maps.Point(
					(map.continent_rect[0][0] + map.continent_rect[1][0]) / 2,
					(map.continent_rect[0][1] + map.continent_rect[1][1]) / 2
				);

				new MapLabel({
					map: gmap,
					fontColor: '#d6bb70',
					fontSize: 24,
					fontFamily: 'Menomonia',
					strokeWeight: 3,
					strokeColor: '#000',
					maxZoom: 9,
					minZoom: 7,
					position: p2ll(label_coord),
					text: map.name,
					level: map.min_level == 0 ? null : "(" + map.min_level + " - " + map.max_level + ")",
					levelColor: '#777',
					levelSize: 20,
					zIndex: 100,
				});
				

				map_info.push({
					name: map.name,
					min_level: map.min_level,
					max_level: map.max_level,
					map_rect: [	new google.maps.Point(map.continent_rect[0][0], map.continent_rect[0][1]), new google.maps.Point(map.continent_rect[1][0], map.continent_rect[1][1]) ],
				});
			}

			var reg_label_coord = new google.maps.Point(region.label_coord[0], region.label_coord[1]);

			new MapLabel({
				map: gmap,
				fontColor: '#d6bb70',
				fontSize: 24,
				fontFamily: 'Menomonia',
				strokeWeight: 3,
				strokeColor: '#000',
				maxZoom: 6,
				minZoom: 6,
				position: p2ll(reg_label_coord),
				text: region.name,
				zIndex: 100,
			});
		}
		*/
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


	var lastZoom = startMapZoom;

	function doAllMarkers(action, state, start){
		state = typeof state != 'undefined' ? state : 0;
		start = typeof start != 'undefined' ? start : 0;
		var count = 0;
		var max_count = 20;
		var delay = 0;
		if(state == 0){
			for (var i = start; i < mapMarkers['waypoint'].length; i++) {
				action(mapMarkers['waypoint'][i]);

				count++;
				if(count > max_count)
				{
					setTimeout(function(){ doAllMarkers(action, state, i); }, delay);
					return;
				}
			}
			state++;
			start = 0;
		}
		if(state == 1){
			for (var i = start; i < mapMarkers['skill'].length; i++) {
				action(mapMarkers['skill'][i]);

				count++;
				if(count > max_count)
				{
					setTimeout(function(){ doAllMarkers(action, state, i); }, delay);
					return;
				}
			}
			state++;
			start = 0;
		}
		if(state == 2){
			for (var i = start; i < mapMarkers['task'].length; i++) {
				action(mapMarkers['task'][i]);

				count++;
				if(count > max_count)
				{
					setTimeout(function(){ doAllMarkers(action, state, i); }, delay);
					return;
				}
			}
			state++;
			start = 0;
		}
		if(state == 3){
			for (var i = start; i < mapMarkers['vista'].length; i++) {
				action(mapMarkers['vista'][i]);

				count++;
				if(count > max_count)
				{
					setTimeout(function(){ doAllMarkers(action, state, i); }, delay);
					return;
				}
			}
			state++;
			start = 0;
		}
		if(state == 4){
			for (var i = start; i < mapMarkers['landmark'].length; i++) {
				action(mapMarkers['landmark'][i]);

				count++;
				if(count > max_count)
				{
					setTimeout(function(){ doAllMarkers(action, state, i); }, delay);
					return;
				}
			}
			state++;
			start = 0;
		}
	}

	google.maps.event.addListener(gmap, "zoom_changed", function(){
		var markerZoom = 8;
		if(gmap.getZoom() <= markerZoom && lastZoom > markerZoom){
			doAllMarkers(function(marker){
				marker.setVisible(false);
			});
		}else if(gmap.getZoom() > markerZoom && lastZoom <= markerZoom ){
			doAllMarkers(function(marker){
				marker.setVisible(true);
			});
		}
		lastZoom = gmap.getZoom();
	});






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
	

	// detect zone stuff
/*
	var currentZone = null;

	google.maps.event.addListener(gmap, 'center_changed', function(){
		var center = ll2p(gmap.getCenter());
		if(currentZone == null || 
			!(
				map_info[currentZone].map_rect[0].x < center.x &&
				map_info[currentZone].map_rect[1].x > center.x &&
				map_info[currentZone].map_rect[0].y < center.y &&
				map_info[currentZone].map_rect[1].y > center.y
			))
		{
			for (var i = map_info.length - 1; i >= 0; i--) {
				if(map_info[i].map_rect[0].x < center.x &&
					map_info[i].map_rect[1].x > center.x &&
					map_info[i].map_rect[0].y < center.y &&
					map_info[i].map_rect[1].y > center.y)
				{
					currentZone = i;
					$('#map_title').show()
					$('#map_title_content').text(map_info[i].name);
					return;
				}
			}
			currentZone = null;
			$('#map_title').hide();
		}	
	})
*/
});