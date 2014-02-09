"use strict";

$(document).ready(function(){
	$('#dialog_button_ok').click(function(){
		$('#dialog_window').fadeOut();
	});

	$('#dialog_window').draggable({
		cancel: '#dialog_main_window',
		handle: '#dialog_title_bar',
		containment: 'body'
	});

	if(typeof URLquery.edit != 'undefined'){
		$('#map_controls_edit').css('display', 'inline');
	}
/*
	var hoverTitleColor = $('#dialog_title_bar').css("background-color");
	var colorMatch = hoverTitleColor.match(/rgba\(([\d]+),\s?([\d]+),\s?([\d]+),\s?([\d\.]+)\)/);
	if(colorMatch == null){
		colorMatch = hoverTitleColor.match(/rgb\(([[\d]+),\s?([[\d]+),\s?([[\d]+)\)/);
	}
	if(colorMatch == null){
		console.error("Unable to get background color for #dialog_title_bar");
	}else{
		var MaxColor = Math.max(colorMatch[1], colorMatch[2], colorMatch[3]);
		var ColorAmount = 35;
		var hoverTitleColorHover = (colorMatch.length == 5 ? "rgba(" : "rgb(") + 
			(parseInt(colorMatch[1], 10) + Math.round((colorMatch[1] / MaxColor) * ColorAmount)) + " ," + 
			(parseInt(colorMatch[2], 10) + Math.round((colorMatch[2] / MaxColor) * ColorAmount)) + " ," + 
			(parseInt(colorMatch[3], 10) + Math.round((colorMatch[3] / MaxColor) * ColorAmount)) +  
			(colorMatch.length == 5 ? ", " + colorMatch[4] + ")" : ")");
		console.log(hoverTitleColorHover);
		$('#dialog_title_bar').hover(
			function(){
				// on mouse enter
				this.style.backgroundColor = hoverTitleColorHover;							
			},
			function(){
				// on mouse leave
				this.style.backgroundColor = hoverTitleColor;
			}
		);
	}
	
*/
});

function ShowUI(){
	$('#gw2map').fadeIn();
	$('#map_controls').fadeIn();
}

function AddItemToControl(id, title, icon, text, backgroundcolor, onclick, onhover){
	var divID = "control_item_" + id;
	// find if we have an old one, and update it
	var baseNode = document.getElementById(divID);
	var iconNode = null;
	var titleTextNode = null;
	var textTextNode = null;
	if(baseNode == null){
		// making a new one
		baseNode = document.createElement('div');
		baseNode.className = "map_control_item";
		baseNode.id = divID;

		if(backgroundcolor){
			baseNode.style.background = backgroundcolor;
		}

		var iconNode = document.createElement('img');
		iconNode.className = "map_control_icon";
		iconNode.src = icon;
		baseNode.appendChild(iconNode);

		var contentNode = document.createElement('div');
		contentNode.className = "map_control_item_content";
		baseNode.appendChild(contentNode);

		var titleNode = document.createElement('h1');
		contentNode.appendChild(titleNode);

		var titleTextNode = document.createTextNode(title);
		titleNode.appendChild(titleTextNode);

		var textNode = document.createElement('p');
		contentNode.appendChild(textNode);

		var textTextNode = document.createTextNode(text);
		textNode.appendChild(textTextNode);

		document.getElementById('map_controls').appendChild(baseNode);
	}else{
		var iconNode = baseNode.getElementsByTagName('img')[0];
		var titleTextNode = baseNode.getElementsByTagName('h1')[0].childNodes[0];
		var textTextNode = baseNode.getElementsByTagName('p')[0].childNodes[0];

		iconNode.src = icon;
		titleTextNode.nodeValue = title;
		textTextNode.nodeValue = text;

		if(backgroundcolor){
			baseNode.style.background = backgroundcolor;
		}
	}


	

	$()
}

function RemoveItemFromControl(id){
	var controls = document.getElementById('map_controls');
	var toRemove = controls.getElementById('control_itme_' + id);
	if(toRemove){
		controls.removeChild(toRemove);
	}
}

function RemoveAllItemsFromControl(){
	var controls = document.getElementById('map_controls');
	while(controls.children.length > 0){
		controls.removeChild(controls.firstChild);
	}
}

function UpdateTitle(string, useTag){
	if(typeof useTag !== 'undefined' && !useTag){
		document.title = string;
	}else if(typeof string !== 'undefined'){
		document.title = string + " - Gw2Traveller";
	}else{
		document.title = "Gw2Traveller";
	}
	
	window.history.pushState({},"", window.location); // updates the title in the history
}