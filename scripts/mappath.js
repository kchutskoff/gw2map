"use strict";

function MapPath(map, data) {

	var paths = new Array();
	var pathTypes = new Array();
	var pathPoints = new Array();
	var registeredTypes = new Array();

	var userInput = false;
	var otherInput = false;

	var theMap = map;

	var editPath = new google.maps.Polyline({
		editable: false,
		map: theMap,
		suppressUndo: true,
		zIndex: 10,
		strokeColor: '#FFF',
		strokeOpacity: 0,
		strokeWeight: 8,
	});

	var that = this;

	google.maps.event.addListener(editPath.getPath(), 'insert_at', function(e){
		if(!otherInput)
		{
			var userInput = true;
			that.insertAt(e, editPath.getPath().getAt(e), pathTypes[e-1]);
			var userInput = false;
		}else{
		}
	});

	google.maps.event.addListener(editPath.getPath(), 'remove_at', function(e){
		if(!otherInput)
		{
			var userInput = true;
			that.removeAt(e);
			var userInput = false;
		}
	});

	google.maps.event.addListener(editPath.getPath(), 'set_at', function(e){
		if(!otherInput)
		{
			var userInput = true;
			that.setAt(e, editPath.getPath().getAt(e), pathTypes[e]);
			var userInput = false;
		}
	});

	google.maps.event.addListener(editPath, "mouseover", function(mpe){
		if(mpe.path == null && mpe.vertex == null && mpe.edge == null)
		{
			editPath.setEditable(true);
			editPath.setOptions({strokeOpacity: 0.25});
		}
	});

	google.maps.event.addListener(editPath, "mouseout", function(mpe){
		if(mpe.path == null && mpe.vertex == null && mpe.edge == null)
		{
			editPath.setEditable(false);
			editPath.setOptions({strokeOpacity: 0});
		}
	});

	google.maps.event.addListener(editPath, "rightclick", function(mpe){
		if(mpe.edge){
			pathTypes[mpe.edge]++;
			if(pathTypes[mpe.edge] >= registeredTypes.length){
				pathTypes[mpe.edge] = 0;
			}
			that.redraw();
		}else if(mpe.vertex){
			that.removeAt(mpe.vertex);
		}
		
	});

	this.addType = function(type){
		registeredTypes.push(type);
	}

	this.redraw = function(){
		// remove old paths
		for (var i = paths.length - 1; i >= 0; i--) {
			paths[i].setMap(null);
		};
		//console.log("Removed " + paths.length + " old paths");
		paths = new Array();

		if(pathPoints.length != 0){
			//console.log("drawing path");
			var curType = null;
			var curPath = null;
			// for each point
			for (var i = 0; i < pathPoints.length; i++) {
				//console.log("loop start");
				if(curPath != null){
					//console.log("Added point to current");
					curPath.getPath().push(pathPoints[i]);
				}
				if(pathTypes[i] != curType){
					//console.log("Type changed, making new subpath");
					// make a new subpath
					if(curPath != null){
						paths.push(curPath);
						//console.log("Pushed old path to paths");
					}
					//console.log("Added last point to new subpath");
					curType = pathTypes[i];
					curPath = new google.maps.Polyline(registeredTypes[curType]);
					curPath.setMap(theMap);
					curPath.getPath().push(pathPoints[i]);
				}
			};
			if(curPath != null){
				//console.log("Pushed last path to paths");
				paths.push(curPath);
			}
		}		
	};

	this.push = function(position, type){
		type = type !== 'undefined' ? 0 : type;
		pathTypes[pathPoints.length] = type;
		if(!userInput)
		{
			otherInput = true;
			editPath.getPath().push(position);
			otherInput = false;
		}
		this.insertAt(pathPoints.length, position, type);
	};

	this.insertAt = function(index, position, type){
		if(userInput)
		{
			otherInput = true;
			editPath.getPath().insertAt(index, position);
			otherInput = false;
		}
		pathPoints.splice(index, 0, position);
		pathTypes.splice(index, 0, type);
		this.redraw();

	};

	this.setAt = function(index, position, type){
		if(!userInput)
		{
			otherInput = true;
			editPath.getPath().setAt(index, position);
			otherInput = false;
		}
		pathPoints[index] = position;
		pathTypes[index] = type;
		this.redraw();
	};

	this.removeAt = function(index){
		if(!userInput)
		{
			otherInput = true;
			editPath.getPath().removeAt(index);
			otherInput = false;
		}
		pathPoints.splice(index, 1);
		pathTypes.splice(index, 1);
		this.redraw();
	};

	if(data.type){
		this.addType(data.type);
	}else if(data.vertices && data.types){
		// preload data
		var otherInput = true;
		// load types
		for (var i = 0; i < data.types.length; i++) {
			this.addType(data.types[i]);
		};
		for (var i = 0; i < data.vertices.length; i++) {
			pathPoints.push(data.vertices[i].pos);
			pathTypes.push(data.vertices[i].type);
			editPath.getPath().push(data.vertices[i].pos);
		};
		var otherInput = false;
		this.redraw();
	}
}

