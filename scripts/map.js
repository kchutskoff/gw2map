$(document).ready(function(){

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

	var gmap = new google.maps.Map(document.getElementById("gw2map") , {
		zoom: 8,
		minZoom: 5,
		maxZoom: 11,
		center: new google.maps.LatLng(0, 0),
		streetViewControl: false,
		backgroundColor: '#000',
		mapTypeId: "1", // string for gmaps' sake
		mapTypeControlOptions: {
			mapTypeIds: ["1","2"]
		}
	});

	var pixelOverlay = new google.maps.OverlayView();
	pixelOverlay.draw = function(){};
	pixelOverlay.setMap(gmap);

	var mapSize = 32768;

	var max_zoom = function(){
		return gmap.getMapTypeId() === "1" ? 11 : 10
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

	var tile_size = new google.maps.Size(256,256);

	var tyria = new google.maps.ImageMapType({
		maxZoom: 11,
		alt: "Tyria",
		name: "Tyria",
		tileSize: tile_size,
		getTileUrl: get_tile
	});
		
	var mists = new google.maps.ImageMapType({
		maxZoom: 10,
		alt: "The Mists",
		name: "The Mists",
		tileSize: tile_size,
		getTileUrl: get_tile
	});

	gmap.mapTypes.set("1",tyria);
	gmap.mapTypes.set("2",mists);

	gmap.setCenter(p2ll(new google.maps.Point(mapSize/2, mapSize/2)));

	google.maps.event.addListener(gmap, "mousemove", function(e){
		var p = ll2p(e.latLng);

		//console.log("[" + p.x + ", " + p.y + "]");
	});


	var exportDiv = document.createElement('div');
	exportDiv.style.padding = '5px';

	// Set CSS for the control border
	var controlUI = document.createElement('div');
	controlUI.style.backgroundColor = 'white';
	controlUI.style.borderStyle = 'solid';
	controlUI.style.borderWidth = '1px';
	controlUI.style.borderRadius = '2px';
	controlUI.style.borderColor = 'grey';
	controlUI.style.cursor = 'pointer';
	controlUI.style.textAlign = 'center';
	controlUI.title = 'Click to export';
	controlUI.style.padding = '1px';
	exportDiv.appendChild(controlUI);

	// Set CSS for the control interior
	var controlText = document.createElement('div');
	controlText.style.fontFamily = 'Arial,sans-serif';
	controlText.style.fontSize = '12px';
	controlText.style.paddingLeft = '4px';
	controlText.style.paddingRight = '4px';
	controlText.innerHTML = '<b>Export</b>';
	controlUI.appendChild(controlText);

	var lastValidPosition = ll2p(gmap.getCenter());

	function boundCheck(){
		var bounds = gmap.getBounds();
		var ne = ll2p(bounds.getNorthEast());
		var sw = ll2p(bounds.getSouthWest());
		var pos = ll2p(gmap.getCenter());

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
			gmap.setCenter(p2ll(pos));
		}

	}

	google.maps.event.addListener(gmap, 'center_changed', boundCheck);


	var allPaths = new Array();

	// Setup the click event listeners: simply set the map to
	// Chicago
	google.maps.event.addDomListener(controlUI, 'click', function() {
		var pathData = new Array();
		for (var i = allPaths.length - 1; i >= 0; i--) {
			var path = allPaths[i];
			var pathPoints = new Array();
			for(var j = path.polyMarkers.length - 1; j >= 0; j--){
				var marker = path.polyMarkers[j];
				var p = ll2p(marker.getPosition());
				pathPoints.push(p);
			}
			pathData.push(pathPoints);
		};
		console.log(JSON.stringify(pathData));
	});

	exportDiv.index = 1;
	gmap.controls[google.maps.ControlPosition.TOP_RIGHT].push(exportDiv);
			
	var editPath = null;

	PolyPath.prototype.polyEdit = {
	    strokeColor: '#0B0',
	    strokeOpacity: 1.0,
	    strokeWeight: 3,
	    icons: [{
	    	icon: {
			    path: 'M 0,-2 1,0 -1,0 z',
			    fillOpacity: 1,
			    strokeWeight: 1,
			    scale: 5
		  	},
	    	offset: '100%',
	    	repeat: '100px',
	    }],
	};

	PolyPath.prototype.polyDone = {
	    strokeColor: '#B00',
	    strokeOpacity: 1.0,
	    strokeWeight: 3,
	    icons: [{
	    	icon: {
			    path: 'M 0,-2 1,0 -1,0 z',
			    fillOpacity: 1,
			    strokeWeight: 1,
			    scale: 5
		  	},
	    	offset: '100%',
	    	repeat: '100px',
	    }],
	};

	PolyPath.prototype.polyUnderground = {
	    strokeColor: '#D70',
	    strokeOpacity: 1.0,
	    strokeWeight: 3,
	    icons: [],
	};

	PolyPath.prototype.iconNormal = {
		path: google.maps.SymbolPath.CIRCLE,
		scale: 6,
		strokeWeight: 1,
		strokeColor: '#FFF',
		fillColor: '#999',
		fillOpacity: 1.0
		//anchor: new google.maps.Point(12,12)
	};

	PolyPath.prototype.iconHover = {
		path: google.maps.SymbolPath.CIRCLE,
		scale: 6,
		strokeWeight: 1,
		strokeColor: '#FFF',
		fillColor: '#CCC',
		fillOpacity: 1.0
		//anchor: new google.maps.Point(12,12)
	};

	PolyPath.prototype.InsertLatLng = function(LatLng, hovered, index){
		var path = this.polyLine.getPath();
		var that = this;
		index = typeof index != 'undefined' ? index : path.getLength();
		path.insertAt(index, LatLng);

		var marker = new google.maps.Marker({
			position: LatLng,
			draggable: true,
			map: this.map,
			icon: this.iconHover,
		});

		if(!hovered){
			marker.setIcon(this.iconNormal);
		}

		this.polyMarkers.splice(index, 0, marker);

		google.maps.event.addListener(marker, "drag", function(e){
			var path = that.polyLine.getPath();
			path.insertAt(that.polyMarkers.indexOf(marker), e.latLng);
			path.removeAt(that.polyMarkers.indexOf(marker) + 1);
		});

		google.maps.event.addListener(marker, "click", function(e){
			//if(marker == that.polyMarkers[that.polyMarkers.length-1]){
			that.SetActive(false);
			editPath = null;
			//}
		});

		google.maps.event.addListener(marker, "rightclick", function(e){
			var path = that.polyLine.getPath();
			var index = that.polyMarkers.indexOf(marker);
			path.removeAt(index);
			marker.setMap(null);
			that.polyMarkers.splice(index, 1);
		});

		google.maps.event.addListener(marker, "mouseover", function(e){
			marker.setIcon(that.iconHover);
		});
		google.maps.event.addListener(marker, "mouseout", function(e){
			marker.setIcon(that.iconNormal);
		});
	};

	PolyPath.prototype.SetActive = function(bool){
		this.edit = bool;
		if(this.polyMarkers.length < 2){
			if(bool == false){
				allPaths.splice(allPaths.indexOf(this), 1);
				this.polyLine.setMap(null);
				for(var i = 0; i < this.polyMarkers.length; ++i){
					this.polyMarkers[i].setMap(null);
				}
				polyMarkers = null;
				polyLine = null;
			}
		}else{
			for(var i = 0; i < this.polyMarkers.length; ++i){
				this.polyMarkers[i].setVisible(bool);
				this.polyMarkers[i].setIcon(this.iconNormal);
			}
			if(bool == true)
			{
				this.polyLine.setOptions(this.polyEdit);
			}else{
				this.polyLine.setOptions(this.polyDone);
			}
		}
	};

	PolyPath.prototype.setVisible = function(bool){
		this.SetActive(false);
		this.polyLine.setVisible(bool);
	}

	PolyPath.prototype.ToggleUnderground = function(pos){
		if(pos > 0 && pos < this.polyMarkers.length){
			var test = new google.maps.Polyline(this.polyUnderground);
			test.setMap(this.map);
			test.getPath().push(this.polyLine.getPath().getAt(pos-1));
			test.getPath().push(this.polyLine.getPath().getAt(pos));
		}
	}


	function PolyPath(map){
		var that = this;
		this.polyLine = new google.maps.Polyline(this.polyEdit);
		this.polyLine.setMap(map);
		this.polyMarkers = new Array();
		this.edit = true;
		this.map = map
		this.undergrounds = new Array();

		google.maps.event.addListener(this.polyLine, "click", function(e){
			if(that.edit == true){
				var pixel = ll2p(e.latLng);
				var path = that.polyLine.getPath();
				var best = -1;
				var bestBy = 0;
				/// iterate over markers, starting from 1 to length -1
				for(var i = 1; i < path.getLength(); ++i)
				{
					var p1 = ll2p(path.getAt(i-1));
					var p2 = ll2p(path.getAt(i));
					var d = distanceFromSegment(pixel, p1, p2);

					if(best < 0 || d < bestBy)
					{
						best = i;
						bestBy = d;
					}
				}
				// add a node here
				that.InsertLatLng(e.latLng, true, best);
			}else{
				if(editPath != null){
					editPath.SetActive(false);
				}
				editPath = that;
				editPath.SetActive(true);
			}	
		});

		google.maps.event.addListener(this.polyLine, "rightclick", function(e){
			if(that.edit == true){
				var pixel = ll2p(e.latLng);
				var path = that.polyLine.getPath();
				var best = -1;
				var bestBy = 0;
				/// iterate over markers, starting from 1 to length -1
				for(var i = 1; i < path.getLength(); ++i)
				{
					var p1 = ll2p(path.getAt(i-1));
					var p2 = ll2p(path.getAt(i));
					var d = distanceFromSegment(pixel, p1, p2);

					if(best < 0 || d < bestBy)
					{
						best = i;
						bestBy = d;
					}
				}
				// add am underground path here
				that.ToggleUnderground(best);
			}
		});
	};

	google.maps.event.addListener(gmap, "click", function(e){
		if(editPath != null){
			editPath.InsertLatLng(e.latLng, true);
		}else{
			editPath = new PolyPath(gmap);
			editPath.InsertLatLng(e.latLng, true);
			allPaths.push(editPath);
		}
	});

	function loadLines(lines){
		for (var i = lines.length - 1; i >= 0; i--) {
			var line = lines[i];
			var tempPath = new PolyPath(gmap);
			for (var j = line.length - 1; j >= 0; j--) {
				var point = line[j];
				tempPath.InsertLatLng(p2ll(point));
			};
			tempPath.SetActive(false);
			allPaths.push(tempPath);
		};
	}

	if(typeof GW2MapLoadData == 'function'){
		console.log("Loading data...");
		loadLines(GW2MapLoadData());
	}else{
		console.log("Data is unavailable.");
	}

	var markers_waypoint = new Array();
	var markers_point_of_interest = new Array();
	var markers_heart = new Array();
	var markers_skill = new Array();
	var markers_vista = new Array();

	$.getJSON( "https://api.guildwars2.com/v1/map_floor.json?continent_id=1&floor=0", function( data ) {
		//console.log(data);
		var points_of_interest = new Array();
		var tasks = new Array();
		var skill_challenges = new Array();
		for(var rkey in data.regions){
			var region = data.regions[rkey];
			for(var mkey in region.maps){
				var map = region.maps[mkey];
				for(var key in map.points_of_interest){
					var k = map.points_of_interest[key].poi_id;
					if(!(k in points_of_interest)){
						//console.log("Adding " + k + " to POIs");
						points_of_interest[k] = map.points_of_interest[key];
					}else
					{
						//console.log("Already have " + k + " in POIs");
					}
				}

				for(var key in map.tasks){
					var k = map.tasks[key].task_id;
					if(!(k in tasks)){
						//console.log("Adding " + k + " to tasks");
						tasks[k] = map.tasks[key];
					}else
					{
						//console.log("Already have " + k + " in tasks");
					}
				}

				for(var key in map.skill_challenges){
					//console.log("Adding " + key + " to POIs");
					skill_challenges.push(map.skill_challenges[key]);
				}
			}
		}

		var waypointIcon = {
			url: "https://render.guildwars2.com/file/32633AF8ADEA696A1EF56D3AE32D617B10D3AC57/157353.png",
			anchor: new google.maps.Point(12,12),
			scaledSize: new google.maps.Size(24,24),
		};

		var waypointHoverIcon = {
			url: "https://render.guildwars2.com/file/95CE3F6B0502232AD90034E4B7CE6E5B0FD3CC5F/157354.png",
			anchor: new google.maps.Point(12,12),
			scaledSize: new google.maps.Size(24,24),
		};

		var landmarkIcon = {
			url: "https://render.guildwars2.com/file/25B230711176AB5728E86F5FC5F0BFAE48B32F6E/97461.png",
			anchor: new google.maps.Point(9,9),
			scaledSize: new google.maps.Size(18,18),
		};

		var vistaIcon = {
			url: "images/vista.png",
			anchor: new google.maps.Point(11,11),
			scaledSize: new google.maps.Size(22,22),
		};

		var skillpointIcon = {
			url: "images/skillpoint.png",
			anchor: new google.maps.Point(11,11),
			scaledSize: new google.maps.Size(22,22),
		};

		var taskIcon = {
			url: "https://render.guildwars2.com/file/B3DEEC72BBEF0C6FC6FEF835A0E275FCB1151BB7/102439.png",
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
					target.setIcon(waypointHoverIcon);
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
					target.setIcon(waypointIcon);
				}
				$('#hover_window').stop().fadeOut({
					duration:200,
					queue: false,
				});
			};
		}

		for(var key in points_of_interest){
			var POI = points_of_interest[key];
			var tempMarker;
			if(POI.type == "landmark"){
				tempMarker = new google.maps.Marker({
					position: p2ll(new google.maps.Point(POI.coord[0], POI.coord[1])),
					draggable: false,
					map: gmap,
					icon: landmarkIcon,
					visible: true,
					name: POI.name,
					type: POI.type,
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
					visible: true,
					name: POI.name,
					type: POI.type,
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
					visible: true,
					name: "Discovered Vista",
					type: POI.type,
				});

				markers_vista.push(tempMarker);

				google.maps.event.addListener(tempMarker, "mouseover", makeOverFunc(tempMarker));
				google.maps.event.addListener(tempMarker, "mouseout", makeOutFunc(tempMarker));
			}
		}

		for(var key in tasks){
			var task = tasks[key];
			var tempMarker = new google.maps.Marker({
				position: p2ll(new google.maps.Point(task.coord[0], task.coord[1])),
				draggable: false,
				map: gmap,
				icon: taskIcon,
				visible: true,
				name: task.objective + "\xA0\xA0<font style='color:#BBB;font-size:0.9em;'>(" + task.level + ")</font>",
				type: "task",
			});
			markers_heart.push(tempMarker);

			google.maps.event.addListener(tempMarker, "mouseover", makeOverFunc(tempMarker));
			google.maps.event.addListener(tempMarker, "mouseout", makeOutFunc(tempMarker));

		}

		for(var key in skill_challenges){
			var skill = skill_challenges[key];
			var tempMarker = new google.maps.Marker({
				position: p2ll(new google.maps.Point(skill.coord[0], skill.coord[1])),
				draggable: false,
				map: gmap,
				icon: skillpointIcon,
				visible: true,
				type: "skill",
				name: "Skill Point",
			});
			markers_skill.push(tempMarker);

			google.maps.event.addListener(tempMarker, "mouseover", makeOverFunc(tempMarker));
			google.maps.event.addListener(tempMarker, "mouseout", makeOutFunc(tempMarker));
		}
	});

	var lastZoom = gmap.getZoom();

	function doAllMarkers(action, state, start){
		state = typeof state != 'undefined' ? state : 0;
		start = typeof start != 'undefined' ? start : 0;
		var count = 0;
		var max_count = 20;
		var delay = 0;
		if(state == 0){
			for (var i = start; i < markers_skill.length; i++) {
				action(markers_skill[i]);

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
			for (var i = start; i < markers_heart.length; i++) {
				action(markers_heart[i]);

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
			for (var i = start; i < markers_vista.length; i++) {
				action(markers_vista[i]);

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
			for (var i = start; i < markers_point_of_interest.length; i++) {
				action(markers_point_of_interest[i]);

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
		var markerZoom = 6;
		var pathZoom = 7;
		if(gmap.getZoom() <= markerZoom && lastZoom > markerZoom){
			doAllMarkers(function(marker){
				marker.setVisible(false);
			});
		}else if(gmap.getZoom() > markerZoom && lastZoom <= markerZoom ){
			doAllMarkers(function(marker){
				marker.setVisible(true);
			});
		}

		if(gmap.getZoom() <= pathZoom && lastZoom > pathZoom){
			for (var i = allPaths.length - 1; i >= 0; i--) {
				var path = allPaths[i];
				path.setVisible(false);
			};
			editPath = null;
		}else if(gmap.getZoom() > pathZoom && lastZoom <= pathZoom ){
			for (var i = allPaths.length - 1; i >= 0; i--) {
				var path = allPaths[i];
				path.setVisible(true);
			};
		}

		lastZoom = gmap.getZoom();
	});

});