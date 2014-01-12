$(document).ready(function(){
	$('#dialog_button_ok').click(function(){
		$('#dialog_window').fadeOut();
	});

	$('#dialog_window').draggable({
		cancel: '#dialog_main_window',
		handle: '#dialog_title_bar',
		containment: 'body'
	});
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
