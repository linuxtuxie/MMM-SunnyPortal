/* Magic Mirror
 * Module: MMM-SunnyPortal
 * Displays scalable chart.js graphs representing the current, monthly and yearly power output of SunnyPortal solar panels
*/

Module.register("MMM-SunnyPortal",{
	// Default module config.
	defaults: {	  
	  url: 'https://www.sunnyportal.com',	  
	  updateInterval: 900,
	  width: 500,
	  height: 400,
	  username : '',
	  password : '',
	  plantOID : '',
	  chartcolor1: '#121212',
	  chartcolor2: '#909090',
	  convertUnits: true,
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
		password: this.config.password
	  });
	},

	socketNotificationReceived: function(notification, payload) {
	  var msgDay = document.getElementById("msgDay");
	  var msgMonth = document.getElementById("msgMonth");
	  var msgYear = document.getElementById("msgYear");

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
	  }  else if (notification == "SUNNYPORTAL_TOTAL") {
		// no data received from node_helper.js
		if (!payload.data || payload.data.length == 0) {
		  msgYear.innerHTML = this.translate("NODATA");
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
	
	  var container1 = document.createElement("div");
	  container1.className = "sunnyPortalContainer";
	  
	  // Let's add the Day items
	  var graphDay = document.createElement("canvas");
	  graphDay.className = "small thin light";
	  graphDay.id = "sunnyportalDayGraph";	  
	  graphDay.width = this.config.width;
	  graphDay.style.display = "none";
	  container1.appendChild(graphDay);
	  var msgDay = document.createElement("div");
	  msgDay.id = "msgDay";
	  msgDay.className = "small bright";
	  container1.appendChild(msgDay);
	  msgDay.innerHTML = this.translate("LOADING");

	  var container2 = document.createElement("div");
	  container2.className = "sunnyPortalContainer";

	  // Let's add the Month items
	  var graphMonth = document.createElement("canvas");
	  graphMonth.className = "small thin light";
	  graphMonth.id = "sunnyportalMonthGraph";	  
	  graphMonth.width = this.config.width;
	  graphMonth.style.display = "none";
	  container2.appendChild(graphMonth);	  
	  
	  
	   // Let's add the Year items
	   var graphYear = document.createElement("canvas");
	   graphYear.className = "small thin light";
	   graphYear.id = "sunnyportalYearGraph";	  
	   graphYear.width = this.config.width;
	   graphYear.style.display = "none";
	   container2.appendChild(graphYear);

	   var msgMonth = document.createElement("div");
	   msgMonth.id = "msgMonth";
	   msgMonth.className = "small bright";	   
	   container2.appendChild(msgMonth);
	   msgMonth.innerHTML = this.translate("LOADING");
	   var msgYear = document.createElement("div");
	   msgYear.id = "msgYear";
	   msgYear.className = "small bright";
	   container2.appendChild(msgYear);
	   msgYear.innerHTML = this.translate("LOADING");

	  var container3 = document.createElement("div");
	  container3.className = "sunnyPortalContainer";

	  var graphTotal = document.createElement("canvas");
	  graphTotal.className = "small thin light";
	  graphTotal.id = "sunnyportalTotalGraph";
	  graphTotal.width = this.config.width;
	  graphTotal.style.display = "none";
	  container3.appendChild(graphTotal);
	  var msgTotal = document.createElement("div");
	  msgTotal.id = "msgTotal";
	  msgTotal.className = "small bright";
	  container3.appendChild(msgTotal);
	  msgTotal.innerHTML = this.translate("LOADING");

	   var container = document.createElement("div");
	   container.appendChild(container1);
	   container.appendChild(container2);
	   container.appendChild(container3);

	  return container;
	},
  
	/* 
	* Draw chart using chart.js node module
	* For config options visit https://www.chartjs.org/docs/latest/
	*/
	drawDayChart: function(power, times) {
	  var graph = document.getElementById("sunnyportalDayGraph");
	  graph.style.display = "block";
	  graph.width = this.config.width;
	  graph.height = this.config.height/2;
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
		graph.width = this.config.width/2-10;
		graph.height = this.config.height/2;
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
		graph.width = this.config.width/2-10;
		graph.height = this.config.height/2;
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
		graph.width = this.config.width;
		graph.height = this.config.height/2;
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
  
