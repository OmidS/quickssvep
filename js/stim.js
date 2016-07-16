function flickerBox(i, freq, txt, opts) {
	var objectThis = this;
	var id = i;
	var text = txt;
	var f = freq;
	/* opts */
	var fBackLoop = opts.fBackLoop;
	var showInfo = opts.showInfo;
	if (showInfo) var infos = opts.infos;
	var showEdit = opts.showEdit;
	var flickerText = opts.flickerText;
	var trackFreq = (fBackLoop||showInfo); // We need to track momentary frequency if we want to have a frequency stablizer feedback loop or we simply want to sho it or both!
	/* End of opts */
	var minf = f;
	var maxf = f;
	var avgf = 0;
	var cntf = 0;
	var eHT = 1/f/2*1000; // expected half period in ms
	var hT = 1/f/2*1000; // current half period in ms
	/* PID Controller for Frequency */
	var PID = {Kp: 0.5, Ki: 0, Kd: 0, P:0, I: 0, D: 0};
	this.setFlickerInterval = function(newHalfT){
		window.clearInterval(flickerIntervalID);
		flickerIntervalID = window.setInterval(this.flicker,newHalfT);
	}
	this.changeFreq = function (newf) {
		f = newf;
		minf = f;
		maxf = f;
		avgf = 0;
		cntf = 0;
		eHT = 1/f/2*1000; // expected half period in ms
	}
	this.stop = function () {
		window.clearInterval(flickerIntervalID);
		if (showInfo) {
			window.clearInterval(updateIntervalID);
		}
	}
	this.updateFreq = function() {
		newf = $(optsdiv).children("input").val();
		this.changeFreq(newf);
	}
	this.creatDOM = function() {
		var fboxcontainerdiv = document.createElement('div');
		fboxcontainerdiv.className = 'fboxcontainer';
		fboxcontainerdiv.setAttribute('id', id);
		var fboxdiv = document.createElement('div');
		fboxdiv.className = 'fbox';
		fboxdiv.innerHTML = text;
		var fboxdatadiv = document.createElement('div');
		fboxdatadiv.className = 'fboxdata';
		var fboxoptsdiv = document.createElement('div');
		var fboxoptsdiv = document.createElement('div');
		var fboxoptsdiv = document.createElement('div');
		var fboxoptsdivinp = document.createElement('input');
		fboxoptsdivinp.value = f;
		fboxoptsdiv.className = 'fboxopts';	
		fboxoptsdiv.appendChild(fboxoptsdivinp);
		fboxcontainerdiv.appendChild(fboxdiv);
		if (showInfo) fboxcontainerdiv.appendChild(fboxdatadiv);
		if (showEdit) fboxcontainerdiv.appendChild(fboxoptsdiv);
		var stimulatordiv = $("div.stimulator")[0];
		stimulatordiv.appendChild(fboxcontainerdiv);
	}
	this.creatDOM();
	var contdiv = $("div#"+id)[0]; 
	var squarediv = $(contdiv).children("div.fbox")[0]; 
    if (showInfo){
		var datadiv = $(contdiv).children("div.fboxdata")[0];
	}
    if (showEdit){
		var optsdiv = $(contdiv).children("div.fboxopts")[0];
		var optsdivinp = $(optsdiv).children("input")[0];
	}
	this.resetminmax = function (){
		minf = f;
		maxf = f;
		avgf = 0;
		cntf = 0;
	}  
	this.flicker = function() {
		if (flickerText==true) colorProperty = squarediv.style.color;
		else colorProperty = squarediv.style.backgroundColor;
		if (colorProperty!="white") {
			colorProperty = "white";
			if (trackFreq) {
				t3 = new Date().getTime();
				if (showInfo) {
					cf = 1000/(t3-t1); if (cf>maxf) maxf = cf; if (cf<minf) minf = cf;
					avgf = (avgf*cntf + cf) / (cntf+1); cntf++;
					if (!isFinite(avgf)) {minf = f;maxf = f;avgf = 0;cntf = 0;}
					var infoHTML = "";
					if (infos.curF) infoHTML += 'Freq: '+cf.toFixed(2)+'Hz<br />';
					//infoHTML += '(Goal: '+f+'Hz) ';
					//infoHTML += '(Freq: '+cf.toFixed(2)+'Hz) ';
					//infoHTML += '(Err: '+PID.P.toFixed(2)+'ms) ';
					if (infos.avgF) infoHTML += 'Avg: '+avgf.toFixed(2)+'Hz<br />';
					if (infos.rangeF) infoHTML += 'Range: '+minf.toFixed(2)+' <  f  < '+maxf.toFixed(2)+'<br />';
					if (infos.curPer) infoHTML += 'Period: '+(t3-t1)+'ms<br />';
					if (infos.curDuty) infoHTML += 'Duty: '+((t2-t1)/(t3-t1)*100).toFixed(2)+'%';
					datadiv.innerHTML = infoHTML;
				}
				if (fBackLoop) { // Here we implement a feedback to finetune frequency
					var lastError = PID.P;
					var dt = (t3-t1)/1000;
					var cHT = (t3-t1)/2; // current half period in ms
					var error = eHT - cHT;
					PID.P = error;
					PID.I += error * dt;
					if (dt>0) PID.D = (error - lastError) / dt;
					else PID.D = 0;
					hT += (PID.Kp * PID.P + PID.Ki * PID.I + PID.Kd * PID.D);
					if (hT <= 0) hT = eHT;
					//if ( (error > (ehT*0.01)) || (error < (-ehT*0.01) ) ) this.setFlickerInterval(chT - 0.01*error);
					//if ( (error > (ehT*0.01)) || (error < (-ehT*0.01) ) ) hT = chT - 0.01*error;
					//hT = cHT - 0.9*error;
					//if ( (chT-ehT) > (+ehT*0.001) ) resetFlickerInterval(flickerInterval, hT, flickerFunction);
					//if ( (chT-ehT) < (-ehT*0.001) ) resetFlickerInterval(flickerInterval, hT, flickerFunction);
				}
				t1 = new Date().getTime();
			}
		}else{
			colorProperty="black";
			if (trackFreq) t2 = new Date().getTime();
		}
		if (flickerText==true) squarediv.style.color = colorProperty;
		else squarediv.style.backgroundColor = colorProperty;
		flickerIntervalID = setTimeout(flickerFunction,hT);
	}
	// Things to do on first setup
	if (trackFreq) {
		var t1 = new Date().getTime();
		var t2 = new Date().getTime();
		var t3 = new Date().getTime();
	}
	if (flickerText==true) squarediv.style.backgroundColor = "black";
	else squarediv.style.backgroundColor = "white";
	var flickerFunction = this.flicker;
	var flickerIntervalID = setTimeout(flickerFunction,hT);
	if (showInfo) {
		var updateIntervalID = window.setInterval(this.resetminmax,60000);
	}
}

function fixStyle(options){
	// Adjust style to fit the boxes appropriately
	var winWidth = ($(window).width())*0.9;
	var winHeight = ($(window).height())*0.9;
	var boxWidth = winWidth/options.cols;
	if (boxesCount < options.cols) boxWidth = winWidth/boxesCount;
	var boxHeight = winHeight/Math.ceil(boxesCount/(winWidth/boxWidth));
	$("div.fboxcontainer").css("width", boxWidth.toFixed(0)+"px");
	$("div.fboxcontainer").css("height", boxHeight.toFixed(0)+"px");
	
	$("div.fbox").css("line-height", boxHeight.toFixed(0)+"px");
	if (boxWidth < boxHeight) 
		$("div.fbox").css("font-size", (boxWidth*options.fontS).toFixed(0)+"px");
	else
		$("div.fbox").css("font-size", (boxHeight*options.fontS).toFixed(0)+"px");
	
	if (options.fontB == true) $("div.fbox").css("font-weight", "bold");
	else $("div.fbox").css("font-weight", "normal");
	
	
	/*
	$("div.fbox").css("padding", function(index,value) {
		var fontsize = $("div.fbox").eq(index).css("font-size");
		return ((value-fontsize)/2).toFixed(0)+"px 0px";
	});
	*/
}

function creatBoxes(boxInfos, options)
{
	$("div.stimulator").removeClass('displayNone');
	// Creating some flicker boxes
	var fBox = new Array();
	for (i=0; i<boxInfos.length; i++) {
		fBox[i] = new flickerBox(i, boxInfos[i].f, boxInfos[i].text, boxInfos[i].opts);	
	}
	$("div.fboxopts").children("input").change(function(){
		var fBoxId = $(this).parent("div.fboxopts").parent("div.fboxcontainer").attr("id");
		fBox[fBoxId].updateFreq();
	});
	boxesCount = boxInfos.length;
	fixStyle(options);
	//setTimeout(fixStyle, 1000);
	$("div.stimulator").append('<div class="setupBtn"></div>');
	$("div.setupBtn").click(function(){
		$("div.fboxcontainer").each(function(){
			var fBoxId = $(this).attr("id");
			fBox[fBoxId].stop();
		});
		fBox = new Array();
		$("div.stimulator").empty();
		$("div.stimulator").addClass("displayNone");
		$("div.setupPage").removeClass("displayNone");		
	});
}

function setupStimulator(){
	if (typeof boxesCount==="undefined") boxesCount = 6;
	var footerHTML = '<div>Note: The performance of this stimulator (the exact frequency of stimulations) highly depends on the machine and the web browser running it. It is not intended for academic use, rather it is a fast solution to test simple SSVEP setups. We sugest the latest version of <a href="https://www.google.com/intl/en/chrome/browser/">Google Chrome</a> for the best performance.</div>';
	footerHTML += '<div class="versionInfo">JS SSVEP Stimulator version 2014.01.01 - By Omid Sani</div>';
	var createHTML = '<table><caption>Setup an SSVEP stimulator</caption><thead><tr><th>#</th><th>Frequency</th><th>Text</th><th></th></tr></thead><tbody></tbody><tfoot><tr><td></td><td></td><td></td><td><div class="addBtn"></div></td></tr><tr><td></td><td>Font Size: <select name="fontS"><option value="100" selected="selected">100%</option><option value="50">50%</option></select></td><td><input type="checkbox" name="fBackLoop" checked="checked">Feedback Control Loop<br /><input type="checkbox" name="avgF">Show Averages</td></td><td></td></tr><tr><td></td><td><input type="checkbox" name="fontB" checked="checked">Bold Font</td><td><input type="radio" name="flickerer" value="text" checked="checked">Flicker Texts<br/><input type="radio" name="flickerer" value="box">Flicker Boxes</td></tr><tr><td></td><td><input type="submit" name="submit" value="" class="playBtn"><br/>Run</td><td><div class="saveBtn"></div><br/>Save This Setup</td><td></td></tr></tfoot></table>';
	var preDefHTML = '<table><caption>Predefined models</caption><tbody><tr><td><div class="loadBtn"></div><br/>Load</td></tr><tr><td><div class="fullKBBtn"></div><br/>Full KB</td></tr></tbody></table>';
	$("div.setupPage").append('<form><div class="setupTable">'+createHTML+'</div><div class="preDef">'+preDefHTML+'</div></form><div>'+footerHTML+'</div>');
	for (i=0; i<boxesCount; i++) {
		$("div.setupPage").find("div.setupTable").find("tbody").append('<tr><td>'+(i+1)+'</td><td><input type="text" name="freq" value="'+(7+i)+'"></td><td><input type="text" name="text" value="'+String.fromCharCode("A".charCodeAt(0)+i)+'"></td><td><div class="removeBtn"></div></td></tr>');
	}
	$("div.setupPage").find(".addBtn").click(function(){
		i = $("div.setupPage").find("div.setupTable").find("tbody").find("tr").size();
		$("div.setupPage").find("div.setupTable").find("tbody").append('<tr><td>'+(i+1)+'</td><td><input type="text" name="freq" value="'+(7+i)+'"></td><td><input type="text" name="text" value="'+String.fromCharCode("A".charCodeAt(0)+i)+'"></td><td><div class="removeBtn"></div></td></tr>');
		$("div.setupPage").find(".removeBtn").click(function(){
			$(this).parent("td").parent("tr").remove();		
		});	
	});
	$("div.setupPage").find(".removeBtn").click(function(){
		$(this).parent("td").parent("tr").remove();		
	});
	$("div.setupPage").find(".saveBtn").click(function(){
		var boxOpts = {"showInfo":false, "showEdit":false, "flickerText":false, "fBackLoop":false
		, "infos":{"curF":false, "avgF":true, "rangeF":false, "curPer":false, "curDuty":false}};
		
		if ($("div.setupPage").find("tfoot").find('input[name="fBackLoop"]').is(':checked')) {
			boxOpts.fBackLoop = true;
		}
		
		if ($("div.setupPage").find("tfoot").find('input[name="avgF"]').is(':checked')) {
			boxOpts.showInfo = true;
		}
		
		if ($("div.setupPage").find("tfoot").find('input[name="flickerer"][value="text"]').is(':checked')) {
			boxOpts.flickerText = true;
		}
		
		var boxes = new Array();
		$("div.setupPage").find("div.setupTable").find("tbody").find("tr").each(function(index, element){
			var freq = $(element).children("td").children('input[name="freq"]').val();
			var text = $(element).children("td").children('input[name="text"]').val();
			boxes[index] = { "f":freq , "text":text};
		});
		
		var options = {"cols":3, "fontS":1, "fontB":false};
		if ($("div.setupPage").find("tfoot").find('input[name="fontB"]').is(':checked')) {
			options.fontB = true;
		}
		if ($("div.setupPage").find("tfoot").find('select[name="fontS"]').val() == 50) {
			options.fontS = 0.5;
		}
		
		var setupInfo = {"ver": 1, "boxes": boxes, "boxOpts": boxOpts, "options": options};
		$.cookie("JSSSVEPSetup", JSON.stringify(setupInfo), {expires: 3650});
	});
	$("div.setupPage").find(".loadBtn").click(function(){
		var setupInfo = JSON.parse($.cookie("JSSSVEPSetup"));
		if (setupInfo===null) return;
		if (setupInfo.ver != 1) return;
		
		// Setup buttons
		$("div.setupPage").find("div.setupTable").find("tbody").find("tr").remove();
		
		boxesCount = setupInfo.boxes.length;
		for (i=0; i<boxesCount; i++) {
			$("div.setupPage").find("div.setupTable").find("tbody").append('<tr><td>'+(i+1)+'</td><td><input type="text" name="freq" value="'+(setupInfo.boxes[i].f)+'"></td><td><input type="text" name="text" value="'+(setupInfo.boxes[i].text)+'"></td><td><div class="removeBtn"></div></td></tr>');
		}
	
		$("div.setupPage").find(".removeBtn").click(function(){
			$(this).parent("td").parent("tr").remove();		
		});	
		// Setup options
		$("div.setupPage").find("tfoot").find('input[name="fBackLoop"]')[0].checked = setupInfo.boxOpts.fBackLoop;
		$("div.setupPage").find("tfoot").find('input[name="avgF"]')[0].checked = setupInfo.boxOpts.showInfo;
		
		$("div.setupPage").find("tfoot").find('input[name="flickerer"][value="text"]')[0].checked = setupInfo.boxOpts.flickerText;
		$("div.setupPage").find("tfoot").find('input[name="flickerer"][value="box"]')[0].checked = !setupInfo.boxOpts.flickerText;
		
		$("div.setupPage").find("tfoot").find('input[name="fontB"]')[0].checked = setupInfo.options.fontB;
		
		var fontSSelect = $("div.setupPage").find("tfoot").find('select[name="fontS"]')[0];
		fontSSelect.selectedIndex = 0;
		if (setupInfo.options.fontS == 0.5) fontSSelect.selectedIndex = 1;		
	});
	

	$("div.setupPage").find(".fullKBBtn").click(function(){
		$("div.setupPage").find("div.setupTable").find("tbody").empty();
		boxesCount = 26;
		for (i=0; i<boxesCount; i++) {
			$("div.setupPage").find("div.setupTable").find("tbody").append('<tr><td>'+(i+1)+'</td><td><input type="text" name="freq" value="'+((12+i)/2).toFixed(1)+'"></td><td><input type="text" name="text" value="'+String.fromCharCode("A".charCodeAt(0)+i)+'"></td><td><div class="removeBtn"></div></td></tr>');
		}
		$("div.setupPage").find(".removeBtn").click(function(){
			$(this).parent("td").parent("tr").remove();		
		});			
	});
	$("div.setupPage").find("form").submit(function(event) {
		event.preventDefault();
		$("div.setupPage").addClass('displayNone');
		
		var boxOpts = {"showInfo":false, "showEdit":false, "flickerText":false, "fBackLoop":false
		, "infos":{"curF":false, "avgF":true, "rangeF":false, "curPer":false, "curDuty":false}};
		
		if ($("div.setupPage").find("tfoot").find('input[name="fBackLoop"]').is(':checked')) {
			boxOpts.fBackLoop = true;
		}
		
		if ($("div.setupPage").find("tfoot").find('input[name="avgF"]').is(':checked')) {
			boxOpts.showInfo = true;
		}
		
		if ($("div.setupPage").find("tfoot").find('input[name="flickerer"][value="text"]').is(':checked')) {
			boxOpts.flickerText = true;
		}
		
		var boxes = new Array();
		$("div.setupPage").find("div.setupTable").find("tbody").find("tr").each(function(index, element){
			var freq = $(element).children("td").children('input[name="freq"]').val();
			var text = $(element).children("td").children('input[name="text"]').val();
			boxes[index] = { "f":freq , "text":text , "opts":boxOpts};
		});
	
		var options = {"cols":3, "fontS":1, "fontB":false};
		if ($("div.setupPage").find("tfoot").find('input[name="fontB"]').is(':checked')) {
			options.fontB = true;
		}
		if ($("div.setupPage").find("tfoot").find('select[name="fontS"]').val() == 50) {
			options.fontS = 0.5;
		}
		
		
		creatBoxes(boxes, options);
		
		return false;
	});
}

// Store the function in a global property referenced by a string -> Good for minifying
window['setupStimulator'] = setupStimulator;