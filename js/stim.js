function saveTextToFile(text, fileName) {
	const blob = new Blob([text], {type: 'text/plain;charset=utf-8'});
	if (!fileName) { fileName = 'export.json'; }
	saveAs(blob, fileName);
}
class flickerBox { 
	constructor(i, freq, txt, opts){
		this.id = i;
		this.text = txt;
		this.f = freq;
		/* opts */
		this.fBackLoop = opts.fBackLoop;
		this.showInfo = opts.showInfo;
		if (this.showInfo) this.infos = opts.infos;
		this.showEdit = opts.showEdit;
		this.flickerText = opts.flickerText;
		this.trackFreq = (this.fBackLoop||this.showInfo); // We need to track momentary frequency if we want to have a frequency stablizer feedback loop or we simply want to sho it or both!
		/* End of opts */
		this.minf = this.f;
		this.maxf = this.f;
		this.avgf = 0;
		this.cntf = 0;
		this.eHT = 1/this.f/2*1000; // expected half period in ms
		this.hT = 1/this.f/2*1000; // current half period in ms
		/* PID Controller for Frequency */
		this.PID = {Kp: 0.5, Ki: 0, Kd: 0, P:0, I: 0, D: 0};

		this.creatDOM();
		this.contdiv = $("div#"+this.id)[0]; 
		this.squarediv = $(this.contdiv).children("div.fbox")[0]; 
		if (this.showInfo){
			this.datadiv = $(this.contdiv).children("div.fboxdata")[0];
		}
		if (this.showEdit){
			this.optsdiv = $(this.contdiv).children("div.fboxopts")[0];
			this.optsdivinp = $(this.optsdiv).children("input")[0];
		}

		// Things to do on first setup
		if (this.trackFreq) {
			this.t1 = new Date().getTime();
			this.t2 = new Date().getTime();
			this.t3 = new Date().getTime();
		}
		this.switchTimes = [];
		if (this.flickerText==true) this.squarediv.style.backgroundColor = "black";
		else this.squarediv.style.backgroundColor = "white";
		if (this.showInfo) {
			this.updateIntervalID = window.setInterval( () => { this.resetminmax() },10000);
		}

		this.isOn = true;
		if (this.flickerText==true) {
			this.squarediv.style.color = 'white';
			this.squarediv.style.backgroundColor = 'black';
		} else {
			this.squarediv.style.color = 'black';
			this.squarediv.style.backgroundColor = 'white';
		}

		// Old DOM based animation method
		// this.flickerIntervalID = setTimeout(() => { this.flicker() },this.hT);
	}
	setFlickerInterval = function(newHalfT) {
		window.clearInterval(this.flickerIntervalID);
		this.flickerIntervalID = window.setInterval(this.flicker,newHalfT);
	}
	changeFreq = function(newf) {
		this.f = newf;
		this.minf = this.f;
		this.maxf = this.f;
		this.avgf = 0;
		this.cntf = 0;
		this.eHT = 1/this.f/2*1000; // expected half period in ms
	}
	stop = function() {
		window.clearInterval(this.flickerIntervalID);
		if (this.showInfo) {
			window.clearInterval(this.updateIntervalID);
		}
	}
	updateFreq = function() {
		newf = $(this.optsdiv).children("input").val();
		this.changeFreq(newf);
	}
	creatDOM = function() {
		var fboxcontainerdiv = document.createElement('div');
		fboxcontainerdiv.className = 'fboxcontainer';
		fboxcontainerdiv.setAttribute('id', this.id);
		var fboxdiv = document.createElement('div');
		fboxdiv.className = 'fbox';
		fboxdiv.innerHTML = this.text;
		var fboxdatadiv = document.createElement('div');
		fboxdatadiv.className = 'fboxdata';
		var fboxoptsdiv = document.createElement('div');
		var fboxoptsdiv = document.createElement('div');
		var fboxoptsdiv = document.createElement('div');
		var fboxoptsdivinp = document.createElement('input');
		fboxoptsdivinp.value = this.f;
		fboxoptsdiv.className = 'fboxopts';	
		fboxoptsdiv.appendChild(fboxoptsdivinp);
		fboxcontainerdiv.appendChild(fboxdiv);
		if (this.showInfo) fboxcontainerdiv.appendChild(fboxdatadiv);
		if (this.showEdit) fboxcontainerdiv.appendChild(fboxoptsdiv);
		var stimulatordiv = $("div.stimulator")[0];
		stimulatordiv.appendChild(fboxcontainerdiv);
	}
	
	resetminmax = function() {
		this.minf = this.f;
		this.maxf = this.f;
		this.avgf = 0;
		this.cntf = 0;
	}  
	trackFlickFreq = function( cTime ){
		if (this.isOn){
			this.t3 = cTime;
			if (this.showInfo) {
				var cf = 1000/(this.t3-this.t1); if (cf>this.maxf) this.maxf = cf; if (cf<this.minf) this.minf = cf;
				this.avgf = (this.avgf*this.cntf + cf) / (this.cntf+1); this.cntf++;
				if (!isFinite(this.avgf)) {this.minf = this.f;this.maxf = this.f;this.avgf = 0;this.cntf = 0;}
				var infoHTML = "";
				if (this.infos.curF) infoHTML += 'Freq: '+cf.toFixed(2)+'Hz<br />';
				//infoHTML += '(Goal: '+f+'Hz) ';
				//infoHTML += '(Freq: '+cf.toFixed(2)+'Hz) ';
				//infoHTML += '(Err: '+PID.P.toFixed(2)+'ms) ';
				if (this.infos.avgF) infoHTML += 'Avg: '+this.avgf.toFixed(2)+'Hz<br />';
				if (this.infos.rangeF) infoHTML += 'Range: '+this.minf.toFixed(2)+' <  f  < '+this.maxf.toFixed(2)+'<br />';
				if (this.infos.curPer) infoHTML += 'Period: '+(this.t3-this.t1)+'ms<br />';
				if (this.infos.curDuty) infoHTML += 'Duty: '+((this.t2-this.t1)/(this.t3-this.t1)*100).toFixed(2)+'%';
				this.datadiv.innerHTML = infoHTML;
			}
			this.t1 = this.t3;
		} else {
			this.t2 = this.t3;
		}
	}
	// Old DOM based animation method
	flicker = function() {
		let colorProperty;
		if (this.flickerText==true) colorProperty = this.squarediv.style.color;
		else colorProperty = this.squarediv.style.backgroundColor;
		if (colorProperty!="white") {
			colorProperty = "white";
			this.isOn = true;
		} else {
			colorProperty="black";
			this.isOn = false;
		}
		if (this.trackFreq) { 
			this.trackFlickFreq( new Date().getTime() ); 
			if (this.isOn && this.fBackLoop){ // Here we implement a feedback to finetune frequency
				var lastError = this.PID.P;
				var dt = (this.t3-this.t1)/1000;
				var cHT = (this.t3-this.t1)/2; // current half period in ms
				var error = this.eHT - cHT;
				this.PID.P = error;
				this.PID.I += error * dt;
				if (dt>0) this.PID.D = (error - lastError) / dt;
				else this.PID.D = 0;
				this.hT += (this.PID.Kp * this.PID.P + this.PID.Ki * this.PID.I + this.PID.Kd * this.PID.D);
				if (this.hT <= 0) this.hT = this.eHT;
				//if ( (error > (ehT*0.01)) || (error < (-ehT*0.01) ) ) this.setFlickerInterval(chT - 0.01*error);
				//if ( (error > (ehT*0.01)) || (error < (-ehT*0.01) ) ) hT = chT - 0.01*error;
				//hT = cHT - 0.9*error;
				//if ( (chT-ehT) > (+ehT*0.001) ) resetFlickerInterval(flickerInterval, hT, flickerFunction);
				//if ( (chT-ehT) < (-ehT*0.001) ) resetFlickerInterval(flickerInterval, hT, flickerFunction);
			}
		}
		if (this.flickerText==true) this.squarediv.style.color = colorProperty;
		else this.squarediv.style.backgroundColor = colorProperty;
		this.switchTimes.push( new Date() );
		this.flickerIntervalID = setTimeout( ()=> { this.flicker(); },this.hT);
	}
	// New performant WebAnimationsAPI based method
	updateState = function(cTime){
		const isOn = Math.floor(cTime / this.eHT)%2 == 0;
		if (isOn) {
			this.squarediv.style.opacity = 1;
		} else {
			this.squarediv.style.opacity = 0;
		}
		// Book-keeping on state switches
		if (isOn !== this.isOn){
			this.trackFlickFreq( cTime );
			this.switchTimes.push( cTime/1000 );
		}
		this.isOn = isOn;
	}
}

function fixStyle(options){
	if (options == undefined) { options = styleOptions; }
	// Adjust style to fit the boxes appropriately
	var winWidth = document.body.clientWidth;
	var winHeight = window.innerHeight;
	var boxWidth = Math.floor(winWidth/options.cols);
	if (boxesCount < options.cols) boxWidth = Math.floor(winWidth/boxesCount);
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
	//setTimeout(fixStyle, 1000);
	$("div.stimulator").append('<div class="setupBtn"></div>');

	onWinResize = function (e){
		fixStyle(options);
	}
	window.onresize = onWinResize;
	fixStyle(options);

	let startTime = new Date();
	let stopTime = null;
	let eventTimesRelTo = 0;
	stopStimulation = function() {
		let stopTime = new Date();
		var boxElems = Array.from( document.querySelectorAll('div.fboxcontainer') );
		var logObject = {
			'runInfo': {
				"startTime": startTime,
				"stopTime": stopTime,
				"boxCount": boxesCount,
				"eventTimesRelTo": eventTimesRelTo
			}
		};
		for (let i = 0; i<boxElems.length; i++){
			let fBoxId = boxElems[i].getAttribute('id');
			fBox[fBoxId].stop();
			logObject[fBoxId] = {
				"text": fBox[fBoxId].text,
				"f": fBox[fBoxId].f,
				"flickerText": fBox[fBoxId].flickerText,
				"switchTimes": fBox[fBoxId].switchTimes
			};
		}
		let prevLog = localStorage['SSVEPLog'];
		if (prevLog === undefined) {
			prevLog = [];
		} else {
			prevLog = JSON.parse(prevLog);
			if (prevLog.length === undefined){
				let prevLogVal = prevLog;
				prevLog = [];
				prevLog.push(prevLogVal);
			}
		}
		prevLog.push(logObject);
		localStorage.setItem('SSVEPLog', JSON.stringify(prevLog));
		fBox = new Array();
		$("div.stimulator").empty();
		$("div.stimulator").addClass("displayNone");
		$("div.setupPage").removeClass("displayNone");		
		window.removeEventListener('onresize', onWinResize);
	}
	$("div.setupBtn").click(stopStimulation);

	eventTimesRelTo = performance.timing.navigationStart / 1000;
	animateFrame = function(cTime){
		// const cTime = performance.now(); // Expect input to be ~
		// const absTime = performance.timing.navigationStart + cTime;
		for (i=0; i<fBox.length; i++) {
			fBox[i].updateState(cTime);
		}
		if (options.duration){
			if ((new Date().getTime() - startTime.getTime()) > (options.duration*1000)){
				stopStimulation();
				return;
			}
		}
		if (stopTime === null) { // Not stopped yet
			window.requestAnimationFrame(animateFrame);
		}
	}
	// Start animation
	window.requestAnimationFrame(animateFrame);
}

function setupStimulator(){
	if (typeof boxesCount==="undefined") boxesCount = 6;
	var footerHTML = '<div>Note: The performance of this stimulator (the exact frequency of stimulations) highly depends on the machine and the web browser running it. It is not intended for academic use, rather it is a fast solution to test simple SSVEP setups. We sugest the latest version of <a href="https://www.google.com/intl/en/chrome/browser/">Google Chrome</a> for the best performance.</div>';
	footerHTML += '<div class="versionInfo">Quick SSVEP - Last updated: 2019.08.01 - By <a href="https://omidsani.com"> Omid Sani</a></div>';
	var createHTML = `<table><caption>Setup an SSVEP stimulator</caption><thead><tr><th>#</th><th>Frequency</th><th>Text</th><th></th></tr></thead><tbody></tbody>
	<tfoot><tr><td></td><td></td><td></td><td><div class="addBtn"></div></td></tr><tr><td></td>
	<td>Font Size: <select name="fontS"><option value="100" selected="selected">100%</option><option value="50">50%</option></select></td>
	<td>
	<!--<input type="checkbox" name="fBackLoop" checked="checked">Feedback Control Loop<br />-->
	<input type="checkbox" name="avgF">Show Averages</td>
	</td><td></td></tr><tr><td></td>
	<td><input type="checkbox" name="fontB" checked="checked">Bold Font</td>
	<td><input type="radio" name="flickerer" value="text" checked="checked">Flicker Texts<br/>
	<input type="radio" name="flickerer" value="box">Flicker Boxes
	</td></tr><tr><td></td>
	<td><input type="text" name="duration" value="" placeholder="Duration (seconds)"></td>
	<td></td><td></td></tr>
	<tr><td></td>
	<td><input type="submit" name="submit" value="" class="playBtn"><br/>Run</td>
	<td><div class="saveBtn"></div><br/>Save This Setup</td>
	<td><div class="dlLogBtn"></div><br/>Logs (<a class="wipeLogBtn" href="#">Delete</a>)</td>
	</tr></tfoot></table>`;
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
		, "infos":{"curF":true, "avgF":true, "rangeF":false, "curPer":false, "curDuty":false}};
		
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
		
		var options = {"cols":3, "fontS":1, "fontB":false, "duration": parseFloat('Inf')};
		if ($("div.setupPage").find("tfoot").find('input[name="fontB"]').is(':checked')) {
			options.fontB = true;
		}
		if ($("div.setupPage").find("tfoot").find('select[name="fontS"]').val() == 50) {
			options.fontS = 0.5;
		}
		const v = document.querySelector('div.setupPage tfoot input[name="duration"]');
		if (v){ options.duration = parseFloat( v.value ); }
		
		var setupInfo = {"ver": 1, "boxes": boxes, "boxOpts": boxOpts, "options": options};
		localStorage.setItem("JSSSVEPSetup", JSON.stringify(setupInfo));
	});
	$("div.setupPage").find(".dlLogBtn").click(function(){
		let fileContent = JSON.stringify( JSON.parse(localStorage['SSVEPLog']), null, 2 );
		saveTextToFile( fileContent );
	});
	$("div.setupPage").find(".wipeLogBtn").click(function(){
		let logsObj = JSON.parse(localStorage['SSVEPLog']);
		if (logsObj.length > 0){
			if (confirm('Are you sure you want to delete logs from '+logsObj.length+' run(s)?')){
				localStorage['SSVEPLog'] = '[]';
				console.log('Deleted '+ logsObj.length +' logs');
			}
		}
		
	});
	$("div.setupPage").find(".loadBtn").click(function(){
		var setupInfo = JSON.parse( localStorage["JSSSVEPSetup"]);
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
		// $("div.setupPage").find("tfoot").find('input[name="fBackLoop"]')[0].checked = setupInfo.boxOpts.fBackLoop;
		$("div.setupPage").find("tfoot").find('input[name="avgF"]')[0].checked = setupInfo.boxOpts.showInfo;
		
		$("div.setupPage").find("tfoot").find('input[name="flickerer"][value="text"]')[0].checked = setupInfo.boxOpts.flickerText;
		$("div.setupPage").find("tfoot").find('input[name="flickerer"][value="box"]')[0].checked = !setupInfo.boxOpts.flickerText;
		
		$("div.setupPage").find("tfoot").find('input[name="fontB"]')[0].checked = setupInfo.options.fontB;
		if (!isNaN(setupInfo.options.duration)) {
			const v = document.querySelector('div.setupPage tfoot input[name="duration"]');
			v.value = setupInfo.options.duration;
		}
		
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
		, "infos":{"curF":true, "avgF":true, "rangeF":false, "curPer":false, "curDuty":false}};
		
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
	
		var options = {"cols":3, "fontS":1, "fontB":false, "duration": parseFloat('Inf')};
		if ($("div.setupPage").find("tfoot").find('input[name="fontB"]').is(':checked')) {
			options.fontB = true;
		}
		if ($("div.setupPage").find("tfoot").find('select[name="fontS"]').val() == 50) {
			options.fontS = 0.5;
		}
		const v = document.querySelector('div.setupPage tfoot input[name="duration"]');
		if (v){ options.duration = parseFloat( v.value ); }
		
		
		creatBoxes(boxes, options);
		
		return false;
	});
}

// Store the function in a global property referenced by a string -> Good for minifying
window['setupStimulator'] = setupStimulator;