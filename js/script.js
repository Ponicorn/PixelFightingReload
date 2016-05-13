'use strict';

//Global var
let wrkr, intervalNoWorker, startDate, timerLoop, color1, color2 , ctx, size, step , sum1, oldArray, newArray, siblings, ratio1, ratiopercent, data, myChart, countChart, chartHisto,macTickChart,end, min1, min2;

//Init the fight
const setup = function() { 

	//Its not even started !
	end = false;

	// Init the start date 
	startDate = new Date();
	// We call the loop for the time here
	timerLoop = setInterval(updateTimer,1000);

	//We define two random color
	color1 = getRandomColor();
	color2 = getRandomColor();

	setTheColor();

	//Init the canvas
	canvasInitial();

	//Charts init
	initCharts();

	//Init the pixels array
	initialize();


	// We use here webworker, 
	// to have a loop that never go slow 
	// when the tab is inactive

	// we set the interval value at false by defaut,
	// so we can ignore it later if its not use
	intervalNoWorker = false;

	//We check if worker is avaible, or use the good'old setinterval instead
	if( typeof(Worker) !== 'undefined' ) {
		try{
			//Init the worker
			wrkr = new Worker('worker.js');

			//Make an interation when the worker send a tick
			wrkr.onmessage = function(event) {
				run();
			}
		} catch(er) {
			console.error(er);
			console.log('No web worker !');
			wrkr = false;
			intervalNoWorker = setInterval(run,2);
		}

	} else {
		//TODO : WebWorker unsupported
		wrkr = false;
		console.log('No web worker !');
		intervalNoWorker = setInterval(run,2);
	}


}

//Run the fight for a single round
const run = function() {

	//Get the ratio
	ratiopercent = ratio();

	//Calcul the fight
	calculate();

	//Draw the canvas
	draw();

	//Update the charts
	updateCharts(ratiopercent);

	//End?
	if( 0 < ratiopercent && ratiopercent < 1) {
		//Send it to the worker, if its the worker that we use
		if(wrkr) wrkr.postMessage('tick');
	} else { 
		//Draw final state
		draw();

		//Draw the full chart with all the value
		drawFullChart();

		//Stop the clock
		clearInterval(timerLoop);


		//If we used the interval, clear it
		if ( intervalNoWorker ) clearInterval(intervalNoWorker);

		
		end = true;

		console.log('Fin !');
	}

}










/*************************************/
/*        Canvas Manipulation        */
/*************************************/
const canvasInitial = function() {

	//Define basic values
	let width  = 500;
	let height = 500;

	//get the canvas, extract 
	let canvas = document.getElementById("scrawl");
	ctx = canvas.getContext("2d");

	//Define some constant for the futur drawing / calcul
	size = 125;
	step = 500 / size;
	sum1 = 0;

}

//Draw the canvas
const draw = function() {
	for( let i = 0 ; i < size ; i++ ) {
		for( let j = 0 ; j < size ; j++ ) {
			
			if( oldArray[i][j] === 1 ){
				ctx.fillStyle = color2;
			} else {
				ctx.fillStyle = color1;
			}

			ctx.fillRect( i*step, j*step, step, step );

		}
	}
}










/*************************************/
/*         Fighting mechanics        */
/*************************************/

// init the first iteration
const initialize = function() { 

	//Set the minimun at 50%;
	min1 = 50;
	min2 = 50;

	ratiopercent = 0.5;

	oldArray = new Array(size);
	newArray = new Array(size);
	siblings = new Array(size);
	ratio1   = new Array(size);

	//Define each pixel
	for( let i = 0 ; i < oldArray.length ; i++ ) {
		oldArray[i] = new Array(size);
		newArray[i] = new Array(size);
		siblings[i] = new Array(size);
		ratio1[i]   = new Array(size);
	}

	//Each row
	for ( let i = 0 ; i < size ; i++ ) {
		
		//Each pixel in row
		for ( let j = 0 ; j < size ; j++ ) {

			ratio1[i][j]   = 0;
			siblings[i][j] = 8;

			if( i === 0 || i === size - 1 ){
				siblings[i][j] = 5;
				if ( j === 0 || j === size - 1 ){
					siblings[i][j] = 3;
				}
			}

			if( j === 0 || j === size - 1 ){
				siblings[i][j] = 5;
				if ( i === 0 || i === size - 1 ){
					siblings[i][j] = 3;
				}
			}

			if( i < size/2 ){
				oldArray[i][j] = 1;
				sum1 += 1;
			} else {
				oldArray[i][j] = 0;
			} 

			newArray[i][j] = oldArray[i][j];

		}

	}
	sum1 = sum1 / ( size * size );
}

// Look arround each pixel, to get
// a ratio between 0 and 1, and prepare the random battle
// in the calculate function
const ratio = function() { 
	for( let i = 0 ; i < size ; i++ ) {
		for( let j = 0 ; j < size ; j++ ) {

			ratio1[i][j] = 0;

			if( i > 0 ) {
				ratio1[i][j] += oldArray[i - 1][j];
				if ( j > 0 )        ratio1[i][j] += oldArray[i - 1][j - 1];
				if ( j < size - 1 ) ratio1[i][j] += oldArray[i - 1][j + 1];
			}

			if( j > 0 )        ratio1[i][j] += oldArray[i][j - 1];
			if( j < size - 1 ) ratio1[i][j] += oldArray[i][j + 1];

			if( i < size - 1 ) {
				ratio1[i][j] += oldArray[i + 1][j];
				if ( j > 0 )        ratio1[i][j] += oldArray[i + 1][j - 1];
				if ( j < size - 1 ) ratio1[i][j] += oldArray[i + 1][j + 1];
			}

			ratio1[i][j] = ratio1[i][j] / siblings[i][j];
		}
	}

	return sum1;
}

//Fight mechanics
const calculate = function() {
	
	for( let i = 0 ; i < size ; i++ ) {
		for( let j = 0 ; j < size ; j++ ) {
			
			let help = Math.random();

			if( (ratio1[i][j]) > help )
				oldArray[i][j] = 1;
			else
				oldArray[i][j] = 0;

		}
	}

	sum1 = 0;
	
	for( let i = 0 ; i < size ; i++ ) {
		for( let j = 0 ; j < size ; j++ ) {
			
			if( oldArray[i][j] == 1 ) sum1 += 1;

		}
	}

	sum1 = sum1 / ( size * size );

}










/*************************************/
/*        Timer mechanic zone        */
/*************************************/

//Update the timer
const updateTimer = function() {
	
	//Difference between now and the start
	let actualDate = new Date();
	let diffDate = actualDate - startDate;

	//milliseconde to regular time
	let time = msToTime(diffDate);

	//Update the timer in the document
	document.querySelector("#chrono").innerHTML = time;
}


//Convert milliseconde to hh:mm:ss
//inspired from stackoverflow
const msToTime = function(s) {
	let ms, secs, mins, hrs;

	//Calcul each part
	ms   = s % 1000;
	s    = (s - ms) / 1000;
	secs = s % 60;
	s    = (s - secs) / 60;
	mins = s % 60;
	hrs  = (s - mins) / 60;

	//format date number
	if (secs < 10) secs = '0' + secs;
	if (mins < 10) mins = '0' + mins;
	if (hrs < 10)  hrs  = '0' + hrs;

	//Return formated date
	return hrs + ':' + mins + ':' + secs ;

}










/*************************************/
/*        Charts manipulation        */
/*************************************/
const initCharts = function() {

	//Initialise the chartist graph
	chartHisto = 100;

	// label & data
	let label = [];
	    data  = [];
	for ( let i = 0 ; i < chartHisto ; i ++ ){
		data.push(50);
		label.push('');
	}

	//Define options for the chart
	let options =  {
		low          : 0,
		high         : 100,
		showArea     : true,
		showPoint    : false,
		showLine     : false,
		fullWidth    : true,
		showLabel    : false,
		chartPadding : 0,
		axisX : {
			showGrid  : false,
			showLabel : false,
			offset    : 0
		},
		axisY : {
			showGrid  : false,
			showLabel : false,
			offset    : 0
		},
	};

	let labeldata = {
		label : label,
		series: [ data ]
	}

	//Draw the chart
	myChart = new Chartist.Line('#chart', labeldata, options);
	
	//Init the counter, for update it when it reach N tick
	countChart   = 0;
	macTickChart = 50;
}

const updateCharts = function(prct) { 

	//Update the actual progression
	let progression = Math.round(prct * 1000)/10;
	let percent1    = Math.round(prct * 100);
	let percent2    = 100 - percent1;
	document.querySelector("#progin").style.width = progression + '%';
	document.querySelector("#lib1").innerHTML = percent1 + '%';
	document.querySelector("#lib2").innerHTML = percent2 + '%';


	//Save the minimum value

	if( progression < min1 )         min1 = progression;
	if( (100 - progression) < min2 ) min2 = (100 - progression);

	console.log(min1);

	document.querySelector("#minValue1").style.left = min1 + '%';
	document.querySelector("#minValue2").style.left = (100 - min2) + '%';


	//We update the chart only every N tick
	if( countChart > 50 ) {
		data.push(progression);
		let series = [ data.slice( -1 * chartHisto) ];
		myChart.data.series = series;
		myChart.update();
		countChart = 0;
	}
	countChart++;
}	

const drawFullChart = function() {

	//We take all of the data, minu the n first element wich is placeholder value
	// n => chartHisto

	let arrayLength = data.length - chartHisto;
	let newData = {};

	newData.label  = new Array(arrayLength);
	newData.series = [ data.slice(-1 * arrayLength) ];

	myChart.data = newData;

	myChart.update();

}










/*************************************/
/*           Misc Functions          */
/*************************************/

//Return a random color
const getRandomColor = function() {
   	let letters = '0123456789ABCDEF'.split('');
    let color = '#';
    for (let i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

//(Re)load the colors
const setTheColor = function() {

	//Actual % domination
	document.querySelector("#progin").style.background = color2;
	document.querySelector("#prog").style.background   = color1;

	//Set the style for the chart
	document.querySelector('#stylingChartIsHard').innerHTML =
		'#chart .ct-area { fill      : ' + color2 + '; }'
	  + '#chart          { background: ' + color1 + '; }';

	//buttons
	document.querySelector("#color2").style.background = color2;
	document.querySelector("#color1").style.background = color1;
	document.querySelector("#bothcolor").style.background = 'linear-gradient(to right, ' + color2 + ' , ' + color1 + ')';

	//Minimum Value indicator
	document.querySelector("#minValue1").style.background = color2;
	document.querySelector("#minValue2").style.background = color1;


}	

//Change color1 or color2
const changeColor = function(n){
	
	if ( end ) return;

	if( n == 1 ) {
		color1 = getRandomColor();
	} else if( n == 2 )  {
		color2 = getRandomColor();
	} else {
		color1 = getRandomColor();
		color2 = getRandomColor();
	} 
	setTheColor();
}