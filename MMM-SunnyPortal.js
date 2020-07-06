/* Magic Mirror
 * Module: MMM-SunnyPortal
 * Displays scalable chart.js graphs representing the current, monthly and yearly power output of SunnyPortal solar panels
 *
 * Author: linuxtuxie
 * Based upon original Sunnyportal API: https://github.com/mkorthuis/sunnyportal-api
 * MIT Licensed.
 *
 */

Module.register("MMM-SunnyPortal",{
	// Default module config.
	defaults: {	  
	  url: 'https://www.sunnyportal.com',	  
	  updateInterval: 900,
	  width: 500,
	  height: 400,
	  username : '',  //Required!
	  password : '',  //Required!
	  plantOID : '',
	  chartcolor1: '#121212',
	  chartcolor2: '#909090',
	  convertUnits: true,
	  includeGraphs: ['all'], //Default ['all'] (uses default order) or define an array with 1-4 elements like: ['day', 'month', 'year', 'total']
	},

  
	// Define required scripts. Chart.js needed for the graph.
	getScripts: function() {
	  return [
		'modules/MMM-SunnyPortal/node_modules/chart.js/dist/Chart.bundle.js',
		'moment.js'
	  ];
	},
  
	// Define required styles.
	getStyles: function() {
	  return ["MMM-SunnyPortal.css"];
	},
  
	getTranslations: function() {
		return {
			en: "translations/en.json",
			nl: "translations/nl.json",
			fr: "translations/fr.json"
		};
	},
  
	// Override start method.
	start: function() {
	  console.log("Starting module: " + this.name);

	  // Set locale.
      moment.locale(config.language);

	  this.payload = false;
	  refresh = (this.config.updateInterval <= 900 ? 900 : this.config.updateInterval) * 1000;
	  this.sendSocketNotification("START_SUNNYPORTAL", {
		updateInterval: refresh,
		url: this.config.url,
		username: this.config.username,
		password: this.config.password,
		includeGraphs: this.config.includeGraphs
	  });
	},

	socketNotificationReceived: function(notification, payload) {
	  var msgDay = document.getElementById("msgDay");
	  var msgMonth = document.getElementById("msgMonth");
	  var msgYear = document.getElementById("msgYear");
	  var msgTotal = document.getElementById("msgTotal");

	  // was not able to receive data
	  if (notification == "ERROR") {
		msgDay.innerHTML=payload.error;
		return;
	  } else if (notification == "SUNNYPORTAL_DAY") {
		// no data received from node_helper.js
		if (!payload.data || payload.data.length == 0) {
		  msgDay.innerHTML = this.translate("NODATA");
		  return;
		} else {
			console.log("Going to draw Day chart with the following data: ");
			console.log(" - times: " + payload.data[0]);
			console.log(" - power: " + payload.data[1]);
			var total = 0;
			for (power of payload.data[1]) {
				total += power*0.25;
			}
			if (this.config.convertUnits && total >=1000) {
				// Only show 2 digits, display in MWh
				total = Math.round( (total / 1000) * 100 + Number.EPSILON ) / 100;
				msgDay.innerHTML = this.translate("DAYOUTPUT") + total.toLocaleString(config.language) + "&hairsp;MWh";
			} else {
				// Only show 2 digits, display in kWH
				total = Math.round( total * 100 + Number.EPSILON ) / 100;
				msgDay.innerHTML = this.translate("DAYOUTPUT") + total.toLocaleString(config.language) + "&hairsp;kWh";
			}
		  this.drawDayChart(payload.data[1], payload.data[0]);
		}
	} else if (notification == "SUNNYPORTAL_MONTH") {
		// no data received from node_helper.js
		if (!payload.data || payload.data.length == 0) {
		  msgMonth.innerHTML = this.translate("NODATA");
		  return;
		} else {
			console.log("Going to draw Month chart with the following data: ");
			console.log(" - times: " + payload.data[0]);
			console.log(" - power: " + payload.data[1]);			
			var total = 0;
			for (power of payload.data[1]) {
				total += power;
			}
			if (this.config.convertUnits && total >=1000) {
				// Only show 2 digits, display in MWh
				total = Math.round( (total / 1000) * 100 + Number.EPSILON ) / 100;
				msgMonth.innerHTML = this.translate("MONTHOUTPUT") + total.toLocaleString(config.language) + "&hairsp;MWh";
			} else {
				// Only show 2 digits, display in kWH
				total = Math.round( total * 100 + Number.EPSILON ) / 100;
				msgMonth.innerHTML = this.translate("MONTHOUTPUT") + total.toLocaleString(config.language) + "&hairsp;kWh";
			}
		  this.drawMonthChart(payload.data[1], payload.data[0]);
		}
	} else if (notification == "SUNNYPORTAL_YEAR") {
		// no data received from node_helper.js
		if (!payload.data || payload.data.length == 0) {
		  msgYear.innerHTML = this.translate("NODATA");
		  return;
		} else {
			console.log("Going to draw Year chart with the following data: ");
			console.log(" - times: " + payload.data[0]);
			console.log(" - power: " + payload.data[1]);		
			var total = 0;
			for (power of payload.data[1]) {
				total += power;
			}
			if (this.config.convertUnits && total >=1000) {
				// Only show 2 digits, display in MWh
				total = Math.round( (total / 1000) * 100 + Number.EPSILON ) / 100;
				msgYear.innerHTML = this.translate("YEAROUTPUT") + total.toLocaleString(config.language) + "&hairsp;MWh";
			} else {
				// Only show 2 digits, display in kWH
				total = Math.round( total * 100 + Number.EPSILON ) / 100;
				msgYear.innerHTML = this.translate("YEAROUTPUT") + total.toLocaleString(config.language) + "&hairsp;kWh";
			}
		  this.drawYearChart(payload.data[1], payload.data[0]);
		}
	  } else if (notification == "SUNNYPORTAL_TOTAL") {
		// no data received from node_helper.js
		if (!payload.data || payload.data.length == 0) {
		  msgTotal.innerHTML = this.translate("NODATA");
		  return;
		} else {
			console.log("Going to draw Total chart with the following data: ");
			console.log(" - times: " + payload.data[0]);
			console.log(" - power: " + payload.data[1]);
			var total = 0;
			for (power of payload.data[1]) {
				total += power;
			}
			if (this.config.convertUnits && total >=1000) {
				// Only show 2 digits, display in MWh
				total = Math.round( (total / 1000) * 100 + Number.EPSILON ) / 100;
				msgTotal.innerHTML = this.translate("TOTALOUTPUT") + total.toLocaleString(config.language) + "&hairsp;MWh";
			} else {
				// Only show 2 digits, display in kWH
				total = Math.round( total * 100 + Number.EPSILON ) / 100;
				msgTotal.innerHTML = this.translate("TOTALOUTPUT") + total.toLocaleString(config.language) + "&hairsp;kWh";
			}
		  this.drawTotalChart(payload.data[1], payload.data[0]);
		}
	  }
	},
  
	// Override dom generator.
	getDom: function() {
		
		// Create a div table based on the selection in this.config.includeGraphs
		var include = this.config.includeGraphs;
		var includeDayIndex = -1, includeMonthIndex = -1, includeYearIndex = -1, includeTotalIndex = -1;
		var tablesize;

		// Get the indexes of the includeGraphs
		if ((Array.isArray(include)) && (include.length <= 4) && (include[0].toLowerCase() !== "all")) {
			tablesize = include.length; // set table to 1, 2, 3 or 4 cells
			includeDayIndex = include.findIndex(item =>
                "Day".toLowerCase() === item.toLowerCase());
			includeMonthIndex = include.findIndex(item =>
                "Month".toLowerCase() === item.toLowerCase());
			includeYearIndex = include.findIndex(item =>
                "Year".toLowerCase() === item.toLowerCase());
			includeTotalIndex = include.findIndex(item =>
                "Total".toLowerCase() === item.toLowerCase());
		} else {
			tablesize = 4; //default to "all" or if includeGrahps is malformed
			includeDayIndex = 0;
			includeMonthIndex = 1;
			includeYearIndex = 2;
			includeTotalIndex = 3;
		}
		
		// Build the table
		var container = document.createElement("div");

		if (tablesize == 1) { // Table with 1 graph
			var container1 = document.createElement("div");
			container1.className = "sunnyPortalContainer";
			container1.style.width = this.config.width + "px";
			var graph1 = document.createElement("canvas");
			graph1.className = "small thin light";
			graph1.style.width = this.config.width + "px";
			graph1.style.height = this.config.height - 30 + "px";
			graph1.style.display = "none";
			var msg1 = document.createElement("div");
			msg1.className = "small bright";
			msg1.style.width = this.config.width + "px";
			msg1.style.height = 30 + "px";
			if (includeDayIndex == 0) {
				graph1.id = "sunnyportalDayGraph";
				msg1.id = "msgDay";
			} else if (includeMonthIndex == 0) {
				graph1.id = "sunnyportalMonthGraph";
				msg1.id = "msgMonth";
			} else if (includeYearIndex == 0) {
				graph1.id = "sunnyportalYearGraph";
				msg1.id = "msgYear";
			} else {
				graph1.id = "sunnyportalTotalGraph";
				msg1.id = "msgTotal";
			}
			container1.appendChild(graph1);
			container1.appendChild(msg1);
			msg1.innerHTML = this.translate("LOADING");
			container.appendChild(container1);
			return container;
		} else if (tablesize == 2) { // Table with 2 graphs
			var container1 = document.createElement("div");
			container1.className = "sunnyPortalContainer";
			container1.style.width = this.config.width + "px";
			var graph1 = document.createElement("canvas");
			graph1.className = "small thin light";
			graph1.style.width = this.config.width + "px";
			graph1.style.height = this.config.height / 2 - 60 + "px";
			graph1.style.display = "none";
			var msg1 = document.createElement("div");
			msg1.className = "small bright";
			msg1.style.width = this.config.width + "px";
			msg1.style.height = 30 + "px";
			if (includeDayIndex == 0) {
				graph1.id = "sunnyportalDayGraph";
				msg1.id = "msgDay";
			} else if (includeMonthIndex == 0) {
				graph1.id = "sunnyportalMonthGraph";
				msg1.id = "msgMonth";
			} else if (includeYearIndex == 0) {
				graph1.id = "sunnyportalYearGraph";
				msg1.id = "msgYear";
			} else {
				graph1.id = "sunnyportalTotalGraph";
				msg1.id = "msgTotal";
			}
			container1.appendChild(graph1);
			container1.appendChild(msg1);
			msg1.innerHTML = this.translate("LOADING");

			var container2 = document.createElement("div");
			container2.className = "sunnyPortalContainer";
			container2.style.width = this.config.width + "px";
			var graph2 = document.createElement("canvas");
			graph2.className = "small thin light";
			graph2.style.width = this.config.width + "px";
			graph2.style.height = this.config.height / 2 - 60 + "px";
			graph2.style.display = "none";
			var msg2 = document.createElement("div");
			msg2.className = "small bright";
			msg2.style.width = this.config.width + "px";
			msg2.style.height = 30 + "px";
			if (includeDayIndex == 1) {
				graph2.id = "sunnyportalDayGraph";
				msg2.id = "msgDay";
			} else if (includeMonthIndex == 1) {
				graph2.id = "sunnyportalMonthGraph";
				msg2.id = "msgMonth";
			} else if (includeYearIndex == 1) {
				graph2.id = "sunnyportalYearGraph";
				msg2.id = "msgYear";
			} else {
				graph2.id = "sunnyportalTotalGraph";
				msg2.id = "msgTotal";
			}
			container2.appendChild(graph2);
			container2.appendChild(msg2);
			msg2.innerHTML = this.translate("LOADING");
			container.appendChild(container1);
			container.appendChild(container2);
			return container;
		} else if (tablesize == 3) { // Table with 3 graphs
			var container1 = document.createElement("div");
			container1.className = "sunnyPortalContainer";
			container1.style.width = this.config.width + "px";
			
			var graph1 = document.createElement("canvas");
			graph1.className = "small thin light";
			graph1.style.width = this.config.width + "px";
			graph1.style.height = this.config.height / 2 - 60 + "px";
			graph1.style.display = "none";
			var msg1 = document.createElement("div");
			msg1.className = "small bright";
			msg1.style.width = this.config.width + "px";
			msg1.style.height = 30 + "px";
			if (includeDayIndex == 0) {
				graph1.id = "sunnyportalDayGraph";
				msg1.id = "msgDay";
			} else if (includeMonthIndex == 0) {
				graph1.id = "sunnyportalMonthGraph";
				msg1.id = "msgMonth";
			} else if (includeYearIndex == 0) {
				graph1.id = "sunnyportalYearGraph";
				msg1.id = "msgYear";
			} else {
				graph1.id = "sunnyportalTotalGraph";
				msg1.id = "msgTotal";
			}
			container1.appendChild(graph1);
			container1.appendChild(msg1);
			msg1.innerHTML = this.translate("LOADING");

			var container2 = document.createElement("div");
			container2.className = "sunnyPortalContainer";
			container2.style.width = this.config.width + "px";
			
			var graph2 = document.createElement("canvas");
			graph2.className = "small thin light";
			graph2.style.width = this.config.width / 2 + "px";
			graph2.style.height = this.config.height / 2 - 60 + "px";
			graph2.style.display = "none";
			graph2.style.cssFloat = "left";
			
			var graph3 = document.createElement("canvas");
			graph3.className = "small thin light";
			graph3.style.width = this.config.width / 2 + "px";
			graph3.style.height = this.config.height / 2 - 60 + "px";
			graph3.style.display = "none";
			graph3.style.cssFloat = "right";

			var msg2 = document.createElement("div");
			msg2.className = "small bright";
			msg2.style.cssFloat = "left";
			msg2.style.width = this.config.width / 2 + "px";
			msg2.style.height = 30 + "px";

			if (includeDayIndex == 1) {
				graph2.id = "sunnyportalDayGraph";
				msg2.id = "msgDay";
			} else if (includeMonthIndex == 1) {
				graph2.id = "sunnyportalMonthGraph";
				msg2.id = "msgMonth";
			} else if (includeYearIndex == 1) {
				graph2.id = "sunnyportalYearGraph";
				msg2.id = "msgYear";
			} else {
				graph2.id = "sunnyportalTotalGraph";
				msg2.id = "msgTotal";
			}

			var msg3 = document.createElement("div");
			msg3.className = "small bright";
			msg3.style.cssFloat = "right";
			msg3.style.width = this.config.width / 2 + "px";
			msg3.style.height = 30 + "px";

			if (includeDayIndex == 2) {
				graph3.id = "sunnyportalDayGraph";
				msg3.id = "msgDay";
			} else if (includeMonthIndex == 2) {
				graph3.id = "sunnyportalMonthGraph";
				msg3.id = "msgMonth";
			} else if (includeYearIndex == 2) {
				graph3.id = "sunnyportalYearGraph";
				msg3.id = "msgYear";
			} else {
				graph3.id = "sunnyportalTotalGraph";
				msg3.id = "msgTotal";
			}
			container2.appendChild(graph2);
			container2.appendChild(graph3);
			container2.appendChild(msg2);
			container2.appendChild(msg3);
			msg2.innerHTML = this.translate("LOADING");
			msg3.innerHTML = this.translate("LOADING");
			container.appendChild(container1);
			container.appendChild(container2);
			return container;
		} else { // Table with 4 graphs
			var container1 = document.createElement("div");
			container1.className = "sunnyPortalContainer";
			container1.style.width = this.config.width + "px";
			
			var graph1 = document.createElement("canvas");
			graph1.className = "small thin light";
			graph1.style.width = this.config.width / 2 + "px";
			graph1.style.height = this.config.height / 2 - 60 + "px";
			graph1.style.display = "none";
			graph1.style.cssFloat = "left";

			var graph2 = document.createElement("canvas");
			graph2.className = "small thin light";
			graph2.style.width = this.config.width / 2 + "px";
			graph2.style.height = this.config.height / 2 - 60 + "px";
			graph2.style.display = "none";
			graph2.style.cssFloat = "right";

			var msg1 = document.createElement("div");
			msg1.className = "small bright";
			msg1.style.cssFloat = "left";
			msg1.style.width = this.config.width / 2 + "px";
			msg1.style.height = 30 +"px";

			if (includeDayIndex == 0) {
				graph1.id = "sunnyportalDayGraph";
				msg1.id = "msgDay";
			} else if (includeMonthIndex == 0) {
				graph1.id = "sunnyportalMonthGraph";
				msg1.id = "msgMonth";
			} else if (includeYearIndex == 0) {
				graph1.id = "sunnyportalYearGraph";
				msg1.id = "msgYear";
			} else {
				graph1.id = "sunnyportalTotalGraph";
				msg1.id = "msgTotal";
			}

			var msg2 = document.createElement("div");
			msg2.className = "small bright";
			msg2.style.cssFloat = "right";
			msg2.style.width = this.config.width / 2 + "px";
			msg2.style.height = 30 + "px";
			
			if (includeDayIndex == 1) {
				graph2.id = "sunnyportalDayGraph";
				msg2.id = "msgDay";
			} else if (includeMonthIndex == 1) {
				graph2.id = "sunnyportalMonthGraph";
				msg2.id = "msgMonth";
			} else if (includeYearIndex == 1) {
				graph2.id = "sunnyportalYearGraph";
				msg2.id = "msgYear";
			} else {
				graph2.id = "sunnyportalTotalGraph";
				msg2.id = "msgTotal";
			}
			container1.appendChild(graph1);
			container1.appendChild(graph2);
			container1.appendChild(msg1);
			msg1.innerHTML = this.translate("LOADING");
			container1.appendChild(msg2);
			msg2.innerHTML = this.translate("LOADING");

			var container2 = document.createElement("div");
			container2.className = "sunnyPortalContainer";
			container2.style.width = this.config.width + "px";
			
			var graph3 = document.createElement("canvas");
			graph3.className = "small thin light";
			graph3.style.width = this.config.width / 2 + "px";
			graph3.style.height = this.config.height / 2 - 60 + "px";
			graph3.style.display = "none";
			graph3.style.cssFloat = "left";

			var graph4 = document.createElement("canvas");
			graph4.className = "small thin light";
			graph4.style.width = this.config.width / 2 + "px";
			graph4.style.height = this.config.height / 2 - 60 + "px";
			graph4.style.display = "none";
			graph4.style.cssFloat = "right";

			var msg3 = document.createElement("div");
			msg3.className = "small bright";
			msg3.style.cssFloat = "left";
			msg3.style.width = this.config.width / 2 + "px";
			msg3.style.height = 30 + "px";
			
			if (includeDayIndex == 2) {
				graph3.id = "sunnyportalDayGraph";
				msg3.id = "msgDay";
			} else if (includeMonthIndex == 2) {
				graph3.id = "sunnyportalMonthGraph";
				msg3.id = "msgMonth";
			} else if (includeYearIndex == 2) {
				graph3.id = "sunnyportalYearGraph";
				msg3.id = "msgYear";
			} else {
				graph3.id = "sunnyportalTotalGraph";
				msg3.id = "msgTotal";
			}

			var msg4 = document.createElement("div");
			msg4.className = "small bright";
			msg4.style.cssFloat = "right";
			msg4.style.width = this.config.width / 2 + "px";
			msg4.style.height = 30 + "px";

			if (includeDayIndex == 3) {
				graph4.id = "sunnyportalDayGraph";
				msg4.id = "msgDay";
			} else if (includeMonthIndex == 3) {
				graph4.id = "sunnyportalMonthGraph";
				msg4.id = "msgMonth";
			} else if (includeYearIndex == 3) {
				graph4.id = "sunnyportalYearGraph";
				msg4.id = "msgYear";
			} else {
				graph4.id = "sunnyportalTotalGraph";
				msg4.id = "msgTotal";
			}
			container2.appendChild(graph3);
			container2.appendChild(graph4);
			container2.appendChild(msg3);
			container2.appendChild(msg4);
			msg3.innerHTML = this.translate("LOADING");
			msg4.innerHTML = this.translate("LOADING");
			container.appendChild(container1);
			container.appendChild(container2);
			return container;
		}
	},
  
	/* 
	* Draw chart using chart.js node module
	* For config options visit https://www.chartjs.org/docs/latest/
	*/
	drawDayChart: function(power, times) {
	  var graph = document.getElementById("sunnyportalDayGraph");
	  graph.style.display = "block";
	  //graph.width = this.config.width;
	  //graph.height = this.config.height/2;
	  var ctx = graph.getContext("2d");
	  var gradient = ctx.createLinearGradient(0,150,0,0);
	  gradient.addColorStop(0,this.config.chartcolor1);
      gradient.addColorStop(1,this.config.chartcolor2);
	  Chart.defaults.global.defaultFontSize = 14;
	  
	  var sunnyportalChart = new Chart(ctx, {
		type: 'line',
		   data: {
		  labels: times,
		  datasets: [{
			data: power,
			backgroundColor: gradient,
			borderColor: gradient,
			borderWidth: 1,
			pointRadius: 0,
			fill: 'origin'
		  }],
		},
		options: {
		  responsive: false,
		  maintainAspectRatio: true,
		  animation: {
		  duration: 0,
		  },
		  scales: {
			yAxes: [{
			  display: true,
			  scaleLabel: {
				display: true,
				labelString: 'kW',
				fontColor: '#FFFFFF',
				fontSize:16
				},
			  ticks: {				
				display: true,
				fontColor: '#DDD',
				fontSize: 14,
			  }
			}],
			xAxes: [{
			  type: "time",
			  beginAtZero: true,
			  offset: true,
			  time: {
				unit: 'hour',
				unitStepSize: 0.5,	
				displayFormats: {
				  hour: 'HH:mm'
				},
			  },
			  gridLines: {
				display: true,
				borderDash: [5, 5]
			  },
			  ticks: {
				fontColor: '#DDD',
				fontSize: 16,
			  }
			}]
		  },
	
		  legend: { display: false, },
		  borderColor: 'white',
		  borderWidth: 1,
		  cubicInterpolationMode: "default",
		}
	  });
	},
	
	drawMonthChart: function(power, times) {
		var graph = document.getElementById("sunnyportalMonthGraph");
		graph.style.display = "block";
		//graph.width = this.config.width/2-10;
		//graph.height = this.config.height/2;
		var ctx = graph.getContext("2d");
 	    var gradient = ctx.createLinearGradient(0,150,0,0);
	    gradient.addColorStop(0,this.config.chartcolor1);
        gradient.addColorStop(1,this.config.chartcolor2);
		Chart.defaults.global.defaultFontSize = 14;

		var sunnyportalChart = new Chart(ctx, {
		  type: 'bar',
			 data: {
			labels: times,
			datasets: [{
			  data: power,
			  backgroundColor: gradient,
			  borderColor: gradient,
			  borderWidth: 1,
			  pointRadius: 0,
			  fill: 'origin'
			}],
		  },
		  options: {
			responsive: false,
			maintainAspectRatio: true,
			animation: {
			duration: 0,
			},
			scales: {
			  yAxes: [{
				display: true,
				scaleLabel: {
				  display: true,
				  labelString: 'kWh',
				  fontColor: '#FFFFFF',
				  fontSize:16
				  },
				ticks: {				
				  display: true,
				  fontColor: '#DDD',
				  fontSize: 14,
				}
			  }],
			  xAxes: [{
				type: "time",
				beginAtZero: true,
				offset: true,
				time: {
				  unit: 'day',
				  unitStepSize: 0.5,			
				  displayFormats: {
					day: 'D'
				  },
				},
				gridLines: {
				  display: true,
				  borderDash: [5, 5]
				},
				ticks: {
				  fontColor: '#DDD',
				  fontSize: 16,
				}
			  }]
			},
			legend: { display: false, },
			borderColor: 'white',
			borderWidth: 1,
			cubicInterpolationMode: "default",
		  }
		});
	},
	
	drawYearChart: function(power, times) {
		var graph = document.getElementById("sunnyportalYearGraph");
		graph.style.display = "block";
		//graph.width = this.config.width/2-10;
		//graph.height = this.config.height/2;
		var ctx = graph.getContext("2d");
		var gradient = ctx.createLinearGradient(0,150,0,0);
		gradient.addColorStop(0,this.config.chartcolor1);
		gradient.addColorStop(1,this.config.chartcolor2);
		Chart.defaults.global.defaultFontSize = 14;

		var sunnyportalChart = new Chart(ctx, {
		  type: 'bar',
			 data: {
			labels: times,
			datasets: [{
			  data: power,
			  backgroundColor: gradient,
			  borderColor: gradient,
			  borderWidth: 1,
			  pointRadius: 0,
			  fill: 'origin'
			}],
		  },
		  options: {
			responsive: false,
			maintainAspectRatio: true,
			animation: {
			duration: 0,
			},
			scales: {
			  yAxes: [{
				display: true,
				scaleLabel: {
				  display: true,
				  labelString: 'kWh',
				  fontColor: '#FFFFFF',
				  fontSize:16
				  },
				ticks: {				
				  display: true,
				  fontColor: '#DDD',
				  fontSize: 14,
				}
			  }],
			  xAxes: [{
				type: "time",
				beginAtZero: true,
				offset: true,
				time: {
				  unit: 'month',
				  unitStepSize: 0.5,
				  displayFormats: {
					month: 'MMM'
				  },
				},
				gridLines: {
				  display: true,
				  borderDash: [5, 5]
				},
				ticks: {
				  callback: function(value, index){
				    return moment.monthsShort(index % 12, "MMM");
				  },
				  fontColor: '#DDD',
				  fontSize: 16,
				  autoSkip: false,
				  minRotation: 0,
				  source: 'data',
				}
			  }]
			},		
			legend: { display: false, },
			borderColor: 'white',
			borderWidth: 1,
			cubicInterpolationMode: "default",
		  }
		});
	},

	drawTotalChart: function(power, times) {
		var graph = document.getElementById("sunnyportalTotalGraph");
		graph.style.display = "block";
		//graph.width = this.config.width;
		//graph.height = this.config.height/2;
		var ctx = graph.getContext("2d");
		var gradient = ctx.createLinearGradient(0,150,0,0);
		gradient.addColorStop(0,this.config.chartcolor1);
		gradient.addColorStop(1,this.config.chartcolor2);
		Chart.defaults.global.defaultFontSize = 14;

		var sunnyportalChart = new Chart(ctx, {
		  type: 'bar',
			 data: {
			labels: times,
			datasets: [{
			  data: power,
			  backgroundColor: gradient,
			  borderColor: gradient,
			  borderWidth: 1,
			  pointRadius: 0,
			  fill: 'origin'
			}],
		  },
		  options: {
			responsive: false,
			maintainAspectRatio: true,
			animation: {
			duration: 0,
			},
			scales: {
			  yAxes: [{
				display: true,
				scaleLabel: {
				  display: true,
				  labelString: 'kWh',
				  fontColor: '#FFFFFF',
				  fontSize:16
				  },
				ticks: {
				  display: true,
				  fontColor: '#DDD',
				  fontSize: 14,
				}
			  }],
			  xAxes: [{
				type: "time",
				beginAtZero: true,
				offset: true,
				time: {
				  unit: 'year',
				  unitStepSize: 0.5,
				  displayFormats: {
					year: 'YYYY'
				  },
				},
				gridLines: {
				  display: true,
				  borderDash: [5, 5]
				},
				ticks: {
				  fontColor: '#DDD',
				  fontSize: 16,
				  autoSkip: false,
				  minRotation: 0,
				  source: 'data',
				}
			  }]
			},
			legend: { display: false, },
			borderColor: 'white',
			borderWidth: 1,
			cubicInterpolationMode: "default",
		  }
		});
	},

  });
  
