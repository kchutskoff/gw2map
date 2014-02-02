// get URL query parameters
function loadQuerry(){
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
};

var URLquery = loadQuerry();