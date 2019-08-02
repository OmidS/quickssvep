function saveTextToFile(text, fileName) {
	const blob = new Blob([text], {type: 'text/plain;charset=utf-8'});
	if (!fileName) { fileName = 'export.json'; }
	saveAs(blob, fileName);
}
class flickerBox { 
	constructor(parentElem, i, freq, txt, opts){
		this.parentElem = parentElem;
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

		this.createDOM();
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
	setFlickerInterval(newHalfT) {
		window.clearInterval(this.flickerIntervalID);
		this.flickerIntervalID = window.setInterval(this.flicker,newHalfT);
	}
	changeFreq(newf) {
		this.f = newf;
		this.minf = this.f;
		this.maxf = this.f;
		this.avgf = 0;
		this.cntf = 0;
		this.eHT = 1/this.f/2*1000; // expected half period in ms
	}
	stop() {
		window.clearInterval(this.flickerIntervalID);
		if (this.showInfo) {
			window.clearInterval(this.updateIntervalID);
		}
	}
	updateFreq() {
		newf = $(this.optsdiv).children("input").val();
		this.changeFreq(newf);
	}
	createDOM() {
		this.containerElem = document.createElement('div');
		this.containerElem.className = 'fboxcontainer';
		this.containerElem.setAttribute('id', this.id);
		this.boxElem = document.createElement('div');
		this.boxElem.className = 'fbox';
		this.boxElem.innerHTML = this.text;
		this.containerElem.appendChild(this.boxElem);
		this.dataElem = document.createElement('div');
		this.dataElem.className = 'fboxdata';
		if (this.showInfo) this.containerElem.appendChild(this.dataElem);
		this.optionsElem = document.createElement('div');
		this.optionsElem.className = 'fboxopts';	
		if (this.showEdit) this.containerElem.appendChild(fboxoptsdiv);
		var fboxoptsdivinp = document.createElement('input');
		fboxoptsdivinp.value = this.f;
		this.optionsElem.appendChild(fboxoptsdivinp);
		this.parentElem.appendChild(this.containerElem);
	}
	
	resetminmax() {
		this.minf = this.f;
		this.maxf = this.f;
		this.avgf = 0;
		this.cntf = 0;
	}  
	trackFlickFreq( cTime ){
		if (this.isOn){
			this.t3 = cTime;
			if (this.showInfo) {
				var cf = 1000/(this.t3-this.t1); if (cf>this.maxf) this.maxf = cf; if (cf<this.minf) this.minf = cf;
				this.avgf = (this.avgf*this.cntf + cf) / (this.cntf+1); this.cntf++;
				if (!isFinite(this.avgf)) {this.minf = this.f;this.maxf = this.f;this.avgf = 0;this.cntf = 0;}
				var infoHTML = "";
				if (this.infos.curF) infoHTML += 'Freq: '+cf.toFixed(2)+'Hz&nbsp;';
				//infoHTML += '(Goal: '+f+'Hz) ';
				//infoHTML += '(Freq: '+cf.toFixed(2)+'Hz) ';
				//infoHTML += '(Err: '+PID.P.toFixed(2)+'ms) ';
				if (this.infos.avgF) infoHTML += 'Avg: '+this.avgf.toFixed(2)+'Hz&nbsp;';
				if (this.infos.rangeF) infoHTML += 'Range: '+this.minf.toFixed(2)+' <  f  < '+this.maxf.toFixed(2)+'&nbsp;';
				if (this.infos.curPer) infoHTML += 'Period: '+(this.t3-this.t1)+'ms&nbsp;';
				if (this.infos.curDuty) infoHTML += 'Duty: '+((this.t2-this.t1)/(this.t3-this.t1)*100).toFixed(2)+'%';
				this.datadiv.innerHTML = infoHTML;
			}
			this.t1 = this.t3;
		} else {
			this.t2 = this.t3;
		}
	}
	// Old DOM based animation method
	flicker() {
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
	updateState(cTime){
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

class SSVEP{
	constructor(parentElem){
		this.running = false;

		this.FPS = 60;
		this.boxesCount = 6;

		this.parentElem = parentElem;
		if ((this.parentElem === undefined) || !this.parentElem){ this.parentElem = document.body; }

		this.createSetupUI();
		this.createStimUI();
		
		const onWinResize = (e) => {
			this.updateStimUISizes();
		}
		window.onresize = onWinResize;

		this.activateSetupPage();
		// Check window url for initial setup
		var urlParams = new URLSearchParams(window.location.search);
		if (urlParams.has('setup')){ // Setup info provided
			const setupInfo = this.collectSetupInfo(); // Defaults
			const urlSetupInfo = JSON.parse(decodeURIComponent(urlParams.get('setup')));
			for (let k of Object.keys(urlSetupInfo)){
				setupInfo[k] = urlSetupInfo[k];
			}
			this.loadSetupInfo(setupInfo);
			this.startRun();
		}
	}

	createSetupUI(){
		this.setupUIElem = document.createElement('div');
		this.setupUIElem.classList.add('setupPage');
		this.parentElem.appendChild(this.setupUIElem);

		let footerHTML = `
		<div class="fRateEst">Estimated FPS: ...</div>
		<div class="warning">Note: The performance of this stimulator (the exact frequency of stimulations) highly depends on the machine and the web browser running it. It is not intended for academic use, rather it is a fast solution to test simple SSVEP setups. We sugest the latest version of <a href="https://www.google.com/intl/en/chrome/browser/">Google Chrome</a> for the best performance.</div>`;
		footerHTML += '<div class="versionInfo">Quick SSVEP - Last updated: 2019.08.01 - By <a href="https://omidsani.com"> Omid Sani</a> - Code: <a href="https://github.com/OmidS/quickssvep" target="_blank">GitHub</a></div>';
		var tableHTML = `<table><caption>Setup an SSVEP stimulator</caption><thead><tr><th>#</th><th>Frequency</th><th>Text</th><th></th></tr></thead><tbody></tbody>
		<tfoot><tr><td></td><td></td><td></td><td><div class="addBtn"></div></td></tr>
		<tr><td></td><td>Columns</td><td><input type="text" name="columns" value="3" placeholder="Columns"></td><td></td></tr>
		<tr><td></td>
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
		<td><div class="saveBtn"></div><br/>Save This Setup <br />
		<a class="autoLinkBtn" href="#">Get auto link</a>
		<input type="text" name="autolink" value="" placeholder="" style="display:none;">
		</td>
		<td><div class="dlLogBtn"></div><br/>Logs (<a class="wipeLogBtn" href="#">Delete</a>)</td>
		</tr></tfoot></table>`;
		var preDefHTML = '<table><caption>Predefined models</caption><tbody><tr><td><div class="loadBtn"></div><br/>Load</td></tr><tr><td><div class="fullKBBtn"></div><br/>Full KB</td></tr></tbody></table>';

		this.setupUIElem.innerHTML = '<form><div class="setupTable">'+tableHTML+'</div><div class="preDef">'+preDefHTML+'</div></form><div>'+footerHTML+'</div>';
		for (let i=0; i<this.boxesCount; i++) {
			$(this.setupUIElem).find("div.setupTable").find("tbody").append('<tr><td>'+(i+1)+'</td><td><input type="text" name="freq" value="'+(7+i)+'"></td><td><input type="text" name="text" value="'+String.fromCharCode("A".charCodeAt(0)+i)+'"></td><td><div class="removeBtn"></div></td></tr>');
		}
		// Bind button callbacks
		$(this.setupUIElem).find(".addBtn").click(() => {
			i = $(this.setupUIElem).find("div.setupTable").find("tbody").find("tr").size();
			$(this.setupUIElem).find("div.setupTable").find("tbody").append('<tr><td>'+(i+1)+'</td><td><input type="text" name="freq" value="'+(7+i)+'"></td><td><input type="text" name="text" value="'+String.fromCharCode("A".charCodeAt(0)+i)+'"></td><td><div class="removeBtn"></div></td></tr>');
			$(this.setupUIElem).find(".removeBtn").click(function(){
				$(this).parent("td").parent("tr").remove();		
			});	
		});
		$(this.setupUIElem).find(".removeBtn").click(function(){
			$(this).parent("td").parent("tr").remove();		
		});

		$(this.setupUIElem).find(".saveBtn").click(()=>{
			const setupInfo = this.collectSetupInfo();
			localStorage.setItem("JSSSVEPSetup", JSON.stringify(setupInfo));
		});
		$(this.setupUIElem).find(".dlLogBtn").click(()=>{
			let fileContent = JSON.stringify( JSON.parse(localStorage['SSVEPLog']), null, 2 );
			saveTextToFile( fileContent );
		});
		$(this.setupUIElem).find(".autoLinkBtn").click((event)=>{
			event.preventDefault();
			const setupInfo = this.collectSetupInfo();
			const arg = encodeURIComponent(JSON.stringify(setupInfo));
			var urlParams = new URLSearchParams(window.location.search);
			urlParams.set('setup', arg);
			const url = window.location.href.split('#')[0].split('?')[0] + '?' + urlParams.toString();
			const e = document.querySelector('div.setupPage tfoot input[name="autolink"]');
			e.value = url;
			e.style.display = 'block';
			e.select();
			document.execCommand("copy");
			// document.querySelector('div.setupPage tfoot .autoLinkBtn').href = url;
		});
		$(this.setupUIElem).find(".wipeLogBtn").click(()=>{
			let logsObj = JSON.parse(localStorage['SSVEPLog']);
			if (logsObj.length > 0){
				if (confirm('Are you sure you want to delete logs from '+logsObj.length+' run(s)?')){
					localStorage['SSVEPLog'] = '[]';
					console.log('Deleted '+ logsObj.length +' logs');
				}
			}
		});

		$(this.setupUIElem).find(".loadBtn").click(()=>{
			var setupInfo = JSON.parse( localStorage["JSSSVEPSetup"]);
			this.loadSetupInfo(setupInfo);
		});
	
		$(this.setupUIElem).find(".fullKBBtn").click(()=>{
			$(this.setupUIElem).find("div.setupTable").find("tbody").empty();
			this.boxesCount = 26;
			for (let i=0; i<this.boxesCount; i++) {
				$(this.setupUIElem).find("div.setupTable").find("tbody").append('<tr><td>'+(i+1)+'</td><td><input type="text" name="freq" value="'+((this.FPS)/(i+1)/2).toFixed(2)+'"></td><td><input type="text" name="text" value="'+String.fromCharCode("A".charCodeAt(0)+i)+'"></td><td><div class="removeBtn"></div></td></tr>');
			}
			document.querySelector('div.setupPage tfoot input[name="columns"]').value = 5;
			$(this.setupUIElem).find(".removeBtn").click(function(){
				$(this).parent("td").parent("tr").remove();		
			});			
		});

		this.setupUIElem.querySelector('form').onsubmit = (event) => {
			event.preventDefault();
			this.startRun();
		};
	}
	createStimUI(){
		this.stimUIElem = document.createElement('div');
		this.stimUIElem.classList.add('stimulator');
		this.parentElem.appendChild(this.stimUIElem);
	}

	activateSetupPage(){
		this.running = false;
		this.fBox = new Array();
		$(this.stimUIElem).addClass("displayNone");
		$(this.setupUIElem).removeClass("displayNone");		
		this.estimateRefreshRate();
	}

	loadSetupInfo(setupInfo){
		if (setupInfo===undefined || setupInfo===null) return;
		if (setupInfo.ver != 1) return;
		
		// Setup buttons
		$(this.setupUIElem).find("div.setupTable").find("tbody").find("tr").remove();
		
		this.boxesCount = setupInfo.boxes.length;
		for (let i=0; i<this.boxesCount; i++) {
			$(this.setupUIElem).find("div.setupTable").find("tbody").append('<tr><td>'+(i+1)+'</td><td><input type="text" name="freq" value="'+(setupInfo.boxes[i].f)+'"></td><td><input type="text" name="text" value="'+(setupInfo.boxes[i].text)+'"></td><td><div class="removeBtn"></div></td></tr>');
		}
	
		$(this.setupUIElem).find(".removeBtn").click(function(){
			$(this).parent("td").parent("tr").remove();		
		});	
		// Setup options
		// $(this.setupUIElem).find("tfoot").find('input[name="fBackLoop"]')[0].checked = setupInfo.boxOpts.fBackLoop;
		$(this.setupUIElem).find("tfoot").find('input[name="avgF"]')[0].checked = setupInfo.boxOpts.showInfo;
		
		$(this.setupUIElem).find("tfoot").find('input[name="flickerer"][value="text"]')[0].checked = setupInfo.boxOpts.flickerText;
		$(this.setupUIElem).find("tfoot").find('input[name="flickerer"][value="box"]')[0].checked = !setupInfo.boxOpts.flickerText;
		
		$(this.setupUIElem).find("tfoot").find('input[name="fontB"]')[0].checked = setupInfo.options.fontB;
		if (!isNaN(setupInfo.options.duration)) {
			const v = document.querySelector('div.setupPage tfoot input[name="duration"]');
			v.value = setupInfo.options.duration;
		}
		document.querySelector('div.setupPage tfoot input[name="columns"]').value = setupInfo.options.cols;
		
		var fontSSelect = $(this.setupUIElem).find("tfoot").find('select[name="fontS"]')[0];
		fontSSelect.selectedIndex = 0;
		if (setupInfo.options.fontS == 0.5) fontSSelect.selectedIndex = 1;		
	}

	estimateRefreshRate(){
		let histFrameCnt = 61;
		let histCnt = 0;
		let firstFrameTime = null;
		const requestFrame = (cTime) => {
			histCnt++;
			if (histCnt == 1) { firstFrameTime = cTime; };
			if (histCnt == histFrameCnt) {
				const FPSEst = (histCnt-1)/(cTime-firstFrameTime)*1000;
				// console.log('[QuickSSVEP] Estimated framerate (Hz): ' + (histCnt-1) + ' frames in '+(cTime-firstFrameTime)+'ms => ' + FPSEst.toFixed(3) + ' FPS');
				let reportStr = 'Estimated FPS: ' + FPSEst.toFixed(2) + ' → Reliable frequencies: ';
				let freqs = [];
				for (let i = 1; i<(0.5*(1+FPSEst)); i++){
					freqs.push( (FPSEst/i/2).toFixed(2) + '' );
				}
				reportStr += freqs.join(', ');
				const e = document.querySelector('.fRateEst');
				e.innerHTML = reportStr;
				if (histFrameCnt < 121){
					histFrameCnt += 60;
				} else {
					histCnt = 0;
					this.FPS = Math.round(FPSEst);
				}
			}
			if (!this.running){
				window.requestAnimationFrame(requestFrame);
			}
		}
		// Start animation
		window.requestAnimationFrame(requestFrame);
	}

	collectSetupInfo(){
		var boxOpts = {"showInfo":false, "showEdit":false, "flickerText":false, "fBackLoop":false
		, "infos":{"curF":true, "avgF":true, "rangeF":false, "curPer":false, "curDuty":false}};
		
		if ($(this.setupUIElem).find("tfoot").find('input[name="fBackLoop"]').is(':checked')) {
			boxOpts.fBackLoop = true;
		}
		
		if ($(this.setupUIElem).find("tfoot").find('input[name="avgF"]').is(':checked')) {
			boxOpts.showInfo = true;
		}
		
		if ($(this.setupUIElem).find("tfoot").find('input[name="flickerer"][value="text"]').is(':checked')) {
			boxOpts.flickerText = true;
		}
		
		var boxes = new Array();
		$(this.setupUIElem).find("div.setupTable").find("tbody").find("tr").each((index, element)=>{
			var freq = $(element).children("td").children('input[name="freq"]').val();
			var text = $(element).children("td").children('input[name="text"]').val();
			boxes[index] = { "f":freq , "text":text};
		});
		
		var options = {"cols":3, "fontS":1, "fontB":false, "duration": parseFloat('Inf')};
		if ($(this.setupUIElem).find("tfoot").find('input[name="fontB"]').is(':checked')) {
			options.fontB = true;
		}
		if ($(this.setupUIElem).find("tfoot").find('select[name="fontS"]').val() == 50) {
			options.fontS = 0.5;
		}
		const v = document.querySelector('div.setupPage tfoot input[name="duration"]');
		if (v){ options.duration = parseFloat( v.value ); }
		
		const e = document.querySelector('div.setupPage tfoot input[name="columns"]');
		if (e){ options.cols = parseInt( e.value ); }
		
		var setupInfo = {"ver": 1, "boxes": boxes, "boxOpts": boxOpts, "options": options};
		return setupInfo;
	}
	
	startRun() {
		this.running = true;
		$(this.setupUIElem).addClass('displayNone');
		
		var boxOpts = {"showInfo":false, "showEdit":false, "flickerText":false, "fBackLoop":false
		, "infos":{"curF":true, "avgF":true, "rangeF":false, "curPer":false, "curDuty":false}};
		
		if ($(this.setupUIElem).find("tfoot").find('input[name="fBackLoop"]').is(':checked')) {
			boxOpts.fBackLoop = true;
		}
		
		if ($(this.setupUIElem).find("tfoot").find('input[name="avgF"]').is(':checked')) {
			boxOpts.showInfo = true;
		}
		
		if ($(this.setupUIElem).find("tfoot").find('input[name="flickerer"][value="text"]').is(':checked')) {
			boxOpts.flickerText = true;
		}
		
		var boxes = new Array();
		$(this.setupUIElem).find("div.setupTable").find("tbody").find("tr").each((index, element)=>{
			var freq = $(element).children("td").children('input[name="freq"]').val();
			var text = $(element).children("td").children('input[name="text"]').val();
			boxes[index] = { "f":freq , "text":text , "opts":boxOpts};
		});
	
		var options = {"cols":3, "fontS":1, "fontB":false, "duration": parseFloat('Inf')};
		if ($(this.setupUIElem).find("tfoot").find('input[name="fontB"]').is(':checked')) {
			options.fontB = true;
		}
		if ($(this.setupUIElem).find("tfoot").find('select[name="fontS"]').val() == 50) {
			options.fontS = 0.5;
		}
		const v = document.querySelector('div.setupPage tfoot input[name="duration"]');
		if (v){ options.duration = parseFloat( v.value ); }
		const e = document.querySelector('div.setupPage tfoot input[name="columns"]');
		if (e){ options.cols = parseInt( e.value ); }
		
		this.startStimulation(boxes, options);
		
		return false;
	}

	startStimulation(boxInfos, options) {
		$(this.stimUIElem).removeClass('displayNone');
		// Creating some flicker boxes
		this.fBox = new Array();
		for (let i=0; i<boxInfos.length; i++) {
			this.fBox[i] = new flickerBox(this.stimUIElem, i, boxInfos[i].f, boxInfos[i].text, boxInfos[i].opts);	
			let e = this.fBox[i].optionsElem.querySelector('id');
			if (e) {
				$(e).change((ev)=>{
					this.fBox[i].updateFreq();
				});
			}
		}
		this.boxesCount = boxInfos.length;
		//setTimeout(fixStyle, 1000);
		$(this.stimUIElem).append('<div class="setupBtn"></div>');
	
		this.stimOptions = options;
		this.updateStimUISizes();
		window.scrollTo(0, 0);
	
		$("div.setupBtn").click( ()=>{ this.stopStimulation(); });
	
		this.startTime = new Date();
		this.stopTime = null;
		this.eventTimesRelTo = performance.timing.navigationStart / 1000;
		const animateFrame = (cTime) => {
			// const cTime = performance.now(); // Expect input to be ~
			// const absTime = performance.timing.navigationStart + cTime;
			for (let i=0; i<this.fBox.length; i++) {
				this.fBox[i].updateState(cTime);
			}
			if (this.stimOptions.duration){
				if ((new Date().getTime() - this.startTime.getTime()) > (this.stimOptions.duration*1000)){
					this.stopStimulation();
					return;
				}
			}
			if (this.stopTime === null) { // Not stopped yet
				window.requestAnimationFrame(animateFrame);
			}
		}
		// Start animation
		window.requestAnimationFrame(animateFrame);
	}

	stopStimulation() {
		this.stopTime = new Date();
		let logObject = {
			'runInfo': {
				"startTime": this.startTime,
				"stopTime": this.stopTime,
				"boxCount": this.boxesCount,
				"eventTimesRelTo": this.eventTimesRelTo,
				"FPS": this.FPS
			}
		};
		for (let i = 0; i<this.fBox.length; i++){
			this.fBox[i].stop();
			logObject[i] = {
				"text": this.fBox[i].text,
				"f": this.fBox[i].f,
				"flickerText": this.fBox[i].flickerText,
				"switchTimes": this.fBox[i].switchTimes
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
		$(this.stimUIElem).empty();
		this.activateSetupPage();
	}

	updateStimUISizes(){
		// Adjust style to fit the boxes appropriately
		var winWidth = document.body.clientWidth;
		var winHeight = window.innerHeight;
		if (this.running){
			var boxWidth = Math.floor(winWidth/this.stimOptions.cols);
			if (this.boxesCount < this.stimOptions.cols) boxWidth = Math.floor(winWidth/this.boxesCount);
			var boxHeight = winHeight/Math.ceil(this.boxesCount/(winWidth/boxWidth));
			for (let i = 0; i<this.fBox.length; i++){
				$(this.fBox[i].containerElem).css("width", boxWidth.toFixed(0)+"px");
				$(this.fBox[i].containerElem).css("height", boxHeight.toFixed(0)+"px");
				
				$(this.fBox[i].boxElem).css("line-height", boxHeight.toFixed(0)+"px");
				if (boxWidth < boxHeight) 
					$(this.fBox[i].boxElem).css("font-size", (boxWidth*this.stimOptions.fontS).toFixed(0)+"px");
				else
					$(this.fBox[i].boxElem).css("font-size", (boxHeight*this.stimOptions.fontS).toFixed(0)+"px");
				
				if (this.stimOptions.fontB == true) $(this.fBox[i].boxElem).css("font-weight", "bold");
				else $(this.fBox[i].boxElem).css("font-weight", "normal");
			}
		}
	}
}

window.SSVEP = SSVEP;