var request = require("request"),
	async = require("async"),
	moment = require("moment"),
	uuid = require("node-uuid"),
	_ = require("lodash");

// var Browser = require('zombie-phantom');
// var browser = new Browser({
//   site: 'compass.onpeak.com'
// });

// browser.visit('/e/43EZP15', function() {
//   var text = browser.text('h1');
//   consoe.log("browser.text = %j", browser.text);
//   console.log(text);
// });

// var https = require('https');

// //The url we want is: 'www.random.org/integers/?num=1&min=1&max=10&col=1&base=10&format=plain&rnd=new'
// var options = {
//   host: 'compass.onpeak.com',
//   path: '/e/43EZP15',
//   method: 'GET',
//   headers: {
//   	'Content-Type': 'application/x-www-form-urlencoded',
//   	'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2227.1 Safari/537.36'		
//   }
// };

// https.request(options, function(response) {
// 	var str;

//   //another chunk of data has been recieved, so append it to `str`
//   response.on('data', function (chunk) { str += chunk; });

//   //the whole response has been recieved, so we just print it out here
//   response.on('end', function () { console.log(str); });
// }).end();



// var time = moment()/*.add(2, 'hours')*/.valueOf();
//            https://compass.onpeak.com/e/43EZP15/17/roomsPopup?hotel_id=16121&arrive=2015-03-06&depart=2015-03-07&_=1415834609313
// var url = "https://compass.onpeak.com/e/43EZP15/17/roomsPopup?hotel_id=16121&arrive=2015-03-06&depart=2015-03-07&_=" + time;
// console.log("url = %j", url);

// async.retry(3, apiMethod, function(err, result) {
//    consle.log("results")
// });

var loginUrl = "https://compass.onpeak.com/e/43EZP15";

//just need to change artic_beaker_cookie;

function lookForHotelFromApi(sessionId, headers, time) {
	var checkUrl = "https://compass.onpeak.com/e/43EZP15/" + sessionId + "/roomsPopup?hotel_id=16121&arrive=2015-03-06&depart=2015-03-07&_=" + time;

	console.log("checkUrl = %j", checkUrl);

	request.get(
		{
			url: checkUrl,
			followAllRedirects: true,
			headers: headers,
			json: true
		},
		function (err, resp, body) {
			if(resp.statusCode !== 200) {
				console.log("faiils")
				return;
			}

			var hotelMap = _.chain(body.roomTypes)
				.map(function (roomType) {
					var roomInfo = {
						name: roomType.name,
						blockName: roomType.blockName,
						avgRate: roomType.avgRate,
						blockId: roomType.blockId,
						occupants: roomType.occupants,
						minNights: roomType.minNights
					};

					return fullNightData = _.map(roomType.nights, function (night) {
						return _.extend(night, roomInfo);
					});
				})
				.flatten(true)
				.groupBy("date")
				.value();

			function availableFunction (day) {
				return day.availInfo === "AVAIL";
			}

			var thursdayAvailable = _.find(hotelMap["2015-03-05"], availableFunction) || false;
			var fridayAvailable = _.find(hotelMap["2015-03-06"], availableFunction) || false;
			var saturdayAvailable = _.find(hotelMap["2015-03-07"], availableFunction) || false;
			var sundayAvailable = _.find(hotelMap["2015-03-08"], availableFunction) || false;

			console.log("Thursday = %j", thursdayAvailable || "NOPE");
			console.log("Friday = %j", fridayAvailable || "NOPE");
			console.log("Saturday = %j", saturdayAvailable || "NOPE");
			console.log("Sunday = %j", sundayAvailable || "NOPE");


		}
	);
}


function signIntoWebsite () {
	var uuidStr = uuid.v1().replace("-", "");

	var headers = { 
		'User-Agent': 'request',
		Cookie: "arctic_beaker_cookie=" + uuidStr + "; GID=f6de7a025dc1db2bba1565c61dc0a89f;"
	};

	request.get(
		{
			url: loginUrl,
			followAllRedirects: true,
			headers: headers,
		}, 
		function (err, resp, body) {

			console.log("resp.statusCode = %j", resp.statusCode);
			if(resp.statusCode !== 200) {
				console.log("faiils")
				return;
			}
			
			var pidMatch = body.match(new RegExp("PID = \\\"([0-9]+)"))
			var sessionId = (pidMatch.length ? pidMatch[1] : NaN);

			console.log("sessionId = %j", sessionId);

			request.post(
				{
					url: "https://compass.onpeak.com/e/43EZP15/" + sessionId + "/categoryPassword",
					form : {
						categoryId: 15587,
						name: "PAX"
					},
					headers: headers
				},
				function(err, resp, body){
					console.log("err = %j", err);
					console.log("resp.statusCode = %j", resp.statusCode);
					console.log("body = %j", body);
					if(resp.statusCode !== 200) {
						console.log("faiils")
						return;
					}
					console.log("success1")

					lookForHotelFromApi(sessionId, headers, moment().add(5, 'minutes').valueOf());
				}
			);
		});
}

signIntoWebsite();