function MapData(settings){
	var onReady = (typeof settings === 'object' && typeof settings.onReady === 'function' ? settings.onReady : null);
	var toLoad = (typeof settings === 'object' && typeof settings.toLoad === 'object' ? settings.toLoad : null);

	var _mydata = [];
	var _loaded = [];

	function makeJSONgetter(tag, url){
		return function(){
		 	$.getJSON(url, function(data){
				_mydata[tag] = data;
				_loaded[tag] = true;
				testTriggerReady();
			});
		}
	}

	if(toLoad != null){
		for(var i = 0; i < toLoad.length; ++i){
			var tag = toLoad[i].name;
			_loaded[tag] = false;
			_mydata[tag] = {};
			makeJSONgetter(tag, toLoad[i].url)();
		}

	}

	this.get = function(id){
		return _mydata[id];
	}

	var testTriggerReady = function(){
		for(var i = 0; i < toLoad.length; ++i){
			if(!_loaded[tag]){
				return;
			}
		}
		if(typeof onReady === 'function'){
			onReady();
		}
	}
}

	