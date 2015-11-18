var request = require("request"),
  async = require("async"),
  moment = require("moment"),
  uuid = require("node-uuid"),
  _ = require("lodash"),
  args = process.argv.slice(2);



var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

var begin = args[0];


function findAllPossibleCodes() {
  var prefix = "43";
  var suffix = "16";

  return _.chain(alphabet)
    .map(function (l) {
      return _.map(alphabet, function (m) {
        return _.map(alphabet, function (n) {
          return l + m + n;
        })
      })
    })
    .flatten(true)
    .map(function (middle) {
      return prefix + middle + suffix;
    })
    .value();
}

var allCodes = findAllPossibleCodes();

var index = _.findIndex(allCodes, function (code) {return (begin || _.first(allCodes)) === code; });

var checkCodes = allCodes.slice(index);


var checked = 0;
var update = 500;

async.mapSeries(
  checkCodes, 
  function (code, callback) {

    var uuidStr = uuid.v1().replace("-", "");

    var loginUrl = "https://compass.onpeak.com/e/" + code;

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

        if(checked % update === 0){
          console.log("checked " + checked + " last checked = " + code);
        }

        var eventExists = body.indexOf("Code/ID") === -1;

        if(eventExists){
          console.log("at " + code + " THERE IS AN  event") 
        }
        

        setTimeout(function(){ 
          ++checked;
          callback(null); 
        }, 1000);
    });
  }, 
  function(err, results){
  });


