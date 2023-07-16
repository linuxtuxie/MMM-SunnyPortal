/*
 *
 * MMM-Sunnyportal
 *
 * Author: linuxtuxie
 * MIT Licensed.
 *
 */
var NodeHelper = require('node_helper');
var request = require('request');
var flow = require('flow');

// Uncomment the following 2 lines to perform a network capture with tcpdump for debugging purposes
// Start a network capture by running the below command
//  tcpdump -i [interface name eg. eth0] -w captured-packets.pcap
// Next run 
//  npm start debug
// Once you have captured the packets you can decode the HTTPS traffic with Wireshark by opening the captured-packets.pcap file
// Use the following settings in Wireshark: 
//  - Set 'tls' as display filter
//  - Select the /tmp/sslkey.log file in Preferences -> Protocols -> TLS -> (Pre)-Master-Secret log filename

//var sslkeylog = require('sslkeylog');
//sslkeylog.setLog('/tmp/sslkey.log').hookAll();

// The SunnyPortal website is very picky about which Browser versions it accepts, here I am using Firefox 84.0.1 (64bit) for Windows
var USERAGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:84.0) Gecko/20100101 Firefox/84.0';
var LOGIN_URL = '/Templates/Start.aspx';
var OPEN_INVERTER_URL = '/FixedPages/InverterSelection.aspx';
var SET_FILE_DATE_URL = '/FixedPages/InverterSelection.aspx';
var CURRENT_PRODUCTION_URL = '/Dashboard?_=1';
var DOWNLOAD_RESULTS_URL = '/Templates/DownloadDiagram.aspx?down=diag';
var NEXT_URL = ['/FixedPages/Dashboard.aspx', '/Templates/UserProfile.aspx', '/FixedPages/HoManEnergyRedesign.aspx', '/FixedPages/PlantProfile.aspx', '/FixedPages/HoManLive.aspx', '/Homan/ConsumerBalance#'];

/**
 * Sunny Portal API Node Library
 * For interfacing with Sunny Portal.
 *
 * @module
 * @param {Object} opts  Need to pass a url, username and password.
 */
var SunnyPortal = function(opts) {

	if(!opts.url) {
		throw new Error('URL Option Must Be Defined');
	}
	if(!opts.username) {
		throw new Error('Username Must Be Defined');
	}
	if(!opts.password) {
		throw new Error('Password Must Be Defined');
	}

	var url = opts.url;
	var username = opts.username;
	var password = opts.password;
	var plantOID = "";

	var _login = function(datetype,callback) {
		var jar = request.jar(); // create new cookie jar
		var viewstate = null;
		var viewstategenerator = null;
		var clientbrowserversion = null;
		
		var requestOpts = {
			headers : {
				// We need to simulate a Browser which the SunnyPortal accepts...
				'User-Agent' : USERAGENT,
			},
			jar : jar,
			gzip : true,
			agentOptions : {
				rejectUnauthorized: false
			},
		};
		console.log("[_login] Trying to login to " + url + LOGIN_URL + "?ReturnUrl=%2f for accessing " + datetype + " data");
		// Let's first fetch the VIEWSTATE, VIEWSTATEGENERATOR & ClientBrowserVersion parameter values
		request.get(url + LOGIN_URL + "?ReturnUrl=%2f", requestOpts, function (err, httpResponse, body) {
			if (err) {
				console.error('[_login] Unable to fetch login page: ', err);
				callback(err);
				return ;
			}
			console.log("[_login] Cookie Value: " + jar.getCookieString(url));
			// Filter out both values for the VIEWSTATE & VIEWSTATEGENERATOR hidden parameter
			viewstate = body.match(/<input type="hidden" name="__VIEWSTATE" id="__VIEWSTATE" value="(.*)" \/>/)[1];
			viewstategenerator = body.match(/<input type="hidden" name="__VIEWSTATEGENERATOR" id="__VIEWSTATEGENERATOR" value="(.*)" \/>/)[1];
			// Filter out the ClientBrowserVersion value, we also need this one when we perform the POST request
			clientbrowserversion = body.match(/\$\('\#ClientBrowserVersion'\).val\('(.*)'\);\/\/]]\>/)[1]

			console.log("[_login] Fetched VIEWSTATE value: " + viewstate);
			console.log("[_login] Fetched VIEWSTATEGENERATOR value: " + viewstategenerator);
			console.log("[_login] Fetched ClientBrowserVersion: " + clientbrowserversion);
			
			requestOpts = {
				headers : {
					// We need to simulate a Browser which the SunnyPortal accepts...here I am Using Firefox 82.0.3 (64-bit) for Windows
					'User-Agent' : USERAGENT,
				},
				jar : jar,
				gzip : true,
				agentOptions : {
					rejectUnauthorized : false
				},
				form : {
					__VIEWSTATE : viewstate,
					__VIEWSTATEGENERATOR : viewstategenerator,
					ctl00$ContentPlaceHolder1$Logincontrol1$txtUserName : username,
					ctl00$ContentPlaceHolder1$Logincontrol1$txtPassword : password,
					ctl00$ContentPlaceHolder1$Logincontrol1$LoginBtn : 'Login',
					ctl00$ContentPlaceHolder1$hiddenLanguage : 'en-us',
					ctl00$ContentPlaceHolder1$Logincontrol1$ServiceAccess : 'true',
					ctl00$ContentPlaceHolder1$Logincontrol1$RedirectURL : '',
					ctl00$ContentPlaceHolder1$Logincontrol1$RedirectPlant : '',
					ctl00$ContentPlaceHolder1$Logincontrol1$RedirectPage : '',
					ctl00$ContentPlaceHolder1$Logincontrol1$RedirectDevice : '',
					ctl00$ContentPlaceHolder1$Logincontrol1$RedirectOther : '',
					ctl00$ContentPlaceHolder1$Logincontrol1$PlantIdentifier : '',
					__EVENTTARGET : '',
					__EVENTARGUMENT : '',
					ClientBrowserVersion : clientbrowserversion,
				},	
			};

			// Now Let's login by Posting the data
			request.post(url + LOGIN_URL + "?ReturnUrl=%2fFixedPages%2fDashboard.aspx", requestOpts, function (err, httpResponse, body) {
				if (err) {
					console.error('[_login] login failed: ', err);
					callback(err);
					return ;
				}

				// Hack to check for login. Should forward to one of the locations listed in the NEXT_URL variable.
				var loggedIn = false;
				for (var i = 0; i < NEXT_URL.length; i++) {
					if (httpResponse.headers.location && httpResponse.headers.location === NEXT_URL[i]) {
						loggedIn = true;
						console.log("[_login] SUCCESSFULLY LOGGED IN TO " + NEXT_URL[i]);
						callback(err, jar);
						break;
					}
				}
				//console.log("Cookie Value after login: " + jar.getCookieString(url));
				if (loggedIn === false) {
					console.log("[_login] Login Failed, no redirect to any of the known url's: " + NEXT_URL.join(", "));
					console.log("[_login] You are being redirected to the yet unkown url: " + httpResponse.headers.location);
					loginerror = body.match(/<span id="ctl00_ContentPlaceHolder1_Logincontrol1_ErrorLabel" class="base-error">(.*)<\/span>/)[1]
					console.log("[_login] Website Error Message: " + loginerror);
					callback(new Error("[_login] Login Failed, no redirect to any of the known url's: " + NEXT_URL.join(", ")));
				} 
			});
		});
	};

	var _openInverter = function(jar, callback) {

		var requestOpts = {
			headers : {
				// We need to simulate a Browser which the SunnyPortal accepts...here I am Using Firefox 82.0.3 (64-bit) for Windows
				'User-Agent' : USERAGENT,	
			},
			method : 'GET',
			jar : jar,
			gzip : true,
			agentOptions : {
				rejectUnauthorized: false
			},
		}

		request(url + OPEN_INVERTER_URL, requestOpts, function (err, httpResponse, body) {
			if (err) {
				console.error('[_openInverter] Could not open inverter')
				callback(err);
			}
			console.log("[_openInverter] HTTP Result: " + httpResponse.statusCode);
			// Filter out value for the ctl00_HiddenPlantOID hidden parameter
			plantOID = body.match(/<input type="hidden" name="ctl00\$HiddenPlantOID" id="ctl00_HiddenPlantOID" value="(.*)" \/>/)[1];
			console.log("[_openInverter] Fetched ctl00_HiddenPlantOID value: " + plantOID);
			callback(err, body);
		});
	};

	var _setFileDate = function(datetype, month, day, year, jar, callback) {				

		var requestOpts = {
			headers : {
				// We need to simulate a Browser which the SunnyPortal accepts...
				'User-Agent' : USERAGENT,			
			},
			jar : jar,
			gzip : true,
			agentOptions : {
				rejectUnauthorized : false
			},
			form : {
				__EVENTTARGET : '',
				__EVENTARGUMENT : '',
				ctl00$ContentPlaceHolder1$UserControlShowInverterSelection1$DeviceSelection$HiddenPlantOID : plantOID,				 
				ctl00$ContentPlaceHolder1$UserControlShowInverterSelection1$UseIntervalHour : '0',                 
				ctl00$HiddenPlantOID : plantOID
			},
        };
        // Depending on the datetype we are going to add the necessary hidden parameters to the form
        if (datetype == 'day') {
			requestOpts.form['ctl00$ContentPlaceHolder1$UserControlShowInverterSelection1$SelectedIntervalID'] = '3';
			requestOpts.form['ctl00$ContentPlaceHolder1$UserControlShowInverterSelection1$_datePicker$textBox'] = month + '/' + day + '/' + year;
        } else if (datetype == 'month') {
            requestOpts.form['ctl00$ContentPlaceHolder1$UserControlShowInverterSelection1$SelectedIntervalID'] = '4';
            requestOpts.form['ctl00$ContentPlaceHolder1$UserControlShowInverterSelection1$DatePickerMonth'] = month;
            requestOpts.form['ctl00$ContentPlaceHolder1$UserControlShowInverterSelection1$DatePickerYear'] = year;
        } else if (datetype == 'year') {
            requestOpts.form['ctl00$ContentPlaceHolder1$UserControlShowInverterSelection1$SelectedIntervalID'] = '5';
            requestOpts.form['ctl00$ContentPlaceHolder1$UserControlShowInverterSelection1$DatePickerYear'] = year;
		} else if (datetype == 'total') {
            requestOpts.form['ctl00$ContentPlaceHolder1$UserControlShowInverterSelection1$SelectedIntervalID'] = '6';
		}

		// If the datetype is day and the provided date is the current date, we may not post the SET_FILE_DATE_URL
		var now = new Date();
        if (datetype == 'day' && day == now.getDate() && month == now.getMonth()+1 && year == now.getFullYear()) {
			console.log ("[_setFileDate] Skip setting date because we are requesting power data for today");
			callback();
		} else {
			request.post(url + SET_FILE_DATE_URL, requestOpts, function (err, httpResponse, body) {
				if (err) {
					console.error('[_setFileDate] Setting File Date failed: ', err);
					callback(err);
					return ;
				};
			console.log("[_setFileDate] HTTP Result " + datetype + " for " + month + "/" + day +"/" + year + ": " + httpResponse.statusCode);
			callback(err, body);
		});
		}
	};

	var _downloadResults = function(jar, datetype, callback) {
		// This call is going to return a CSV file
		var requestOpts = {
			headers : {
				// We need to simulate a Browser which the SunnyPortal accepts...
				'User-Agent' : USERAGENT,
			},
			method : 'GET',
			jar : jar,
			gzip : true,
			agentOptions : {
				rejectUnauthorized : false
			},
			
		}

		request(url + DOWNLOAD_RESULTS_URL, requestOpts, function(err, httpResponse, body) {
			if (err) {
				console.error('[_downloadResults] CSV download for ' + datetype + ' failed: ', err);
				callback(err);
				return ;
            };
			console.log("[_downloadResults] HTTP Result for " + datetype + ": "+ httpResponse.statusCode);
			callback(err, body);
		});
	}

	/**
	* Returns the current production at this moment in time.
	*
	* @method currentProduction
	* @param {Number} month
	* @param {Number} day
	* @param {Number} year
	* @param {Function} callback A callback function once current production is received.  Will return a JSON object of the current status.
	*/
	var currentProduction = function(callback) {
		flow.exec(
			function() {
				_login('current', this);	
			},
			function(err, body) {
	
				var requestOpts = {
					headers : {
						// We need to simulate a Browser which the SunnyPortal accepts...
						'User-Agent' : USERAGENT,
					},
					method : 'GET',
					jar : jar,
					gzip : true,
					agentOptions : {
						rejectUnauthorized : false
					},		
				}

				// The timestamp is just ignored. Using 1.
				request(url + CURRENT_PRODUCTION_URL, requestOpts, function (err, httpResponse, body) {
					if (err) {
						console.error('[currentProduction] Could not get current production')
						callback(err);
					}
					callback(err, JSON.parse(body));
				});
			}
		);
	
	};

	/**
	* Returns historical production for a given day.
	*
    * @method historicalProduction
    * @param {String} datetype Determins if we need to fetch day, month or year data
	* @param {Number} month
	* @param {Number} day
	* @param {Number} year
	* @param {Function} callback A callback function once historical production is recieved. Will return a JSON object of the days production.
	*/
	var historicalProduction = function(datetype, month, day, year, callback) {
		// Due to app dependencies, you cannot just download the document.  
		// You need to crawl the application such that items get added to your session.  
		// Then you may download the days data.
		//
		// You could make this more efficient by not logging in everytime but... I just wanted something quick and dirty.
		var finalJar;
		flow.exec(
			function() {
				_login(datetype, this);
			},
			function(err, jar) {
				finalJar = jar;
				_openInverter(finalJar, this);
			},
			function(err, body) {
                _setFileDate(datetype, month, day, year, finalJar, this);
			},
			function(err, body) {
				_downloadResults(finalJar, datetype, this);
			},
			function(err, body) {
				var response = [[]];
                var power = [];
                var times = [];
                var date;
                var lineItems = body.split('\n');

                // Skip the first line of the CSV file. It is a header as the example shows below
                // Day CSV result 
				// ;SB1.5-1VL-40 966 / Power / Mean Values  [kW]0
				// 12:15 AM;
                // 12:30 AM;
                // 12:45 AM;0.453

                // Month CSV result
                // ;SB1.5-1VL-40 966 / Data logger object energy / Meter Change  [kWh]0
                // 1/1/20;0.124
                // 1/2/20;0.358
                // 1/3/20;0.157

                // Year CSV result
                // ;SB1.5-1VL-40 966 / Data logger object energy / Meter Change  [kWh]0
                // Jan 20;4.824
                // Feb 20;
                // Mar 20;
				console.log("Downloaded the following RAW data for " + datetype);
				console.log(body);
				for(i=1; i<lineItems.length; i++) {
					var entries = lineItems[i].split(';');
					if(entries[0] && entries[1]) {
                        if (datetype == 'day') {
						    var ampm = entries[0].split(' ')[1];
						    var time = entries[0].split(' ')[0];
						    var hour = parseInt(time.split(':')[0]);
						    var minute = parseInt(time.split(':')[1]);

						    if (ampm == 'PM' && hour < 12) {
							    hour += 12;
						    }
						    if (ampm == 'AM' && hour == 12) {
							    hour = 0;
                            }

                            //We need to substract 1 from the month because in Javascript: January=0 in Sunnyportal: January=1;
						    date = new Date(year, month-1, day, hour, minute);
						    // If set to midnight the next day, add another day. Their response is messed up
						    if (hour == 0 && minute == 0) {
							    date.setDate(date.getDate() + 1);
						    }
                        } else if (datetype == 'month') {
                            var d = entries[0].split('/')[1];
                            // I'm only interested in the day value...we are going to use the parameter value for month and year
                            date = new Date(year, month - 1 , d, 12, 0); // Using ISO Format
                        } else if (datetype == 'year') {
                            var m = entries[0].split(' ')[0];
                            // Because only the last 2 digits of the year are returned we are going to use the year parameter value... 
                            // we could prepend the returned value with 20...but then the script will fail in the next century ;)
                            var months = [
                                'Jan', 'Feb', 'Mar', 'Apr', 'May',
                                'Jun', 'Jul', 'Aug', 'Sep',
                                'Oct', 'Nov', 'Dec'
                                ];
                            date = new Date (year,months.indexOf(m), 1, 12, 0);
                        } else if  (datetype == 'total') {
							// We do not need an actual date, because entries[0] already contains the year data values.
							date = entries[0];
						}
                        // Add the date results to the array
                        times.push(date);
                        // Add the power results to the array
                        power.push(isNaN(parseFloat(entries[1])) ? 0 : parseFloat(entries[1]));
					}
				}
                response[0] = times;
                response[1] = power;
				callback(err, response);
			}
		);
    };

	return {
		currentProduction : currentProduction,
        historicalProduction : historicalProduction
	};

};

module.exports = NodeHelper.create({
    // Override start method.
    start: function() {
	  console.log("Starting node helper for: " + this.name);
	  this.started = false;
      return;
    },

	// Override socketNotificationReceived method.
	socketNotificationReceived: function(notification, payload) {

		// We save this.started (update timer) status, to prevent mutiple timer restarts
        // for each new client connection/instance.
		var self = this;

		var include = payload.includeGraphs;
		var includeDayIndex, includeMonthIndex, includeYearIndex, includeTotalIndex;
		// Get the indexes of the includeGraphs
		if ((Array.isArray(include)) && (include.length <= 4) && (include[0].toLowerCase() !== "all")) {
			includeDayIndex = include.findIndex(item =>
				"Day".toLowerCase() === item.toLowerCase());
			includeMonthIndex = include.findIndex(item =>
				"Month".toLowerCase() === item.toLowerCase());
			includeYearIndex = include.findIndex(item =>
				"Year".toLowerCase() === item.toLowerCase());
			includeTotalIndex = include.findIndex(item =>
				"Total".toLowerCase() === item.toLowerCase());
			if (includeTotalIndex !== -1) self.processTotalData(self);
		} else {
			includeDayIndex = 0;
			includeMonthIndex = 1;
			includeYearIndex = 2;
			includeTotalIndex = 3;
		}

		function startup(payload) {
			var sunnyPortal = new SunnyPortal(payload);

			var now = new Date();
			var month = now.getMonth()+1;
			var day = now.getDate();
			var year = now.getFullYear();
			if (includeDayIndex !== -1) {
				sunnyPortal.historicalProduction('day', month, day, year, function(err, data) {
					self.dayData = data;
					self.processDayData(self);
				});
				}

			if (includeMonthIndex !== -1) {
				sunnyPortal.historicalProduction('month', month, day, year, function(err, data) {
					self.monthData = data;
					self.processMonthData(self);
				});
			}

			if (includeYearIndex !== -1) {
				sunnyPortal.historicalProduction('year', month, day, year, function(err, data) {
					self.yearData = data;
					self.processYearData(self);
				});
			}

			if (includeTotalIndex !== -1) {
				sunnyPortal.historicalProduction('total', month, day, year, function(err, data) {
					self.totalData = data;
					self.processTotalData(self);
				});
			}
		}

		if (notification === "START_SUNNYPORTAL" && this.started == false) {				
			console.log("SocketNotification START_SUNNYPORTAL received for the first time...setting updateInterval to " + payload.updateInterval + "ms");
			startup(payload); // When the MagicMirror module is called the first time, we are immediatly going to fetch data
   			setInterval(function() { startup(payload) }, payload.updateInterval); // Now let's schedule the job
			self.started = true;
		} else if (notification === "START_SUNNYPORTAL" && this.started == true) {
			console.log("SocketNotification START_SUNNYPORTAL received");
			if (includeDayIndex !== -1) self.processDayData(self);
			if (includeMonthIndex !== -1) self.processMonthData(self);
			if (includeYearIndex !== -1) self.processYearData(self);
			if (includeTotalIndex !== -1) self.processTotalData(self);
		}
  },

  processDayData: function(self) {
    console.log("Starting function processDayData with data: " + self.dayData);

    // Send all to script
    self.sendSocketNotification('SUNNYPORTAL_DAY', {
        data: self.dayData
    });
  },

  processMonthData: function(self) {
    console.log("Starting function processMonthData with data: " + self.monthData);

    // Send all to script
    self.sendSocketNotification('SUNNYPORTAL_MONTH', {
        data: self.monthData
    });
  },

  processYearData: function(self) {
    console.log("Starting function processYearData with data: " + self.yearData);

    // Send all to script
    self.sendSocketNotification('SUNNYPORTAL_YEAR', {
        data: self.yearData
    });
  },

  processTotalData: function(self) {
    console.log("Starting function processTotalData with data: " + self.totalData);

    // Send all to script
    self.sendSocketNotification('SUNNYPORTAL_TOTAL', {
        data: self.totalData
    });
  },

});
