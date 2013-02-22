var feather = require("../lib/feather").getFeather();
var node_io = require('node.io'),
  request = require('request'),
  _ = require("underscore")._,
  sys = require('sys'),
  exec = require('child_process').exec,
  fs = require('fs');

module.exports = {
  "get": {
    "/": function(req, res, cb) {
      console.log(feather);
      debugger;
      node_io.scrape(function() {
        this.getHtml('http://www.reddit.com/', function(err, $) {
          var stories = [];
          $('a.title').each(function(title) {
            stories.push(title.text);
          });
          
          cb(null, stories);
        });
      });
    },
    
    "/widget/list": function(req, res, cb) {
      var wPath = feather.appOptions.appRoot + "/public/widgets";
      fs.readdir(wPath, function(err, files) {
        if (!err) {
          cb && cb(null, files);
        } else {
          cb && cb(err);
        }
      });
    },
    
    "/widget/create/:name": function(req, res, cb) {
      var wName = req.params.name;
      child = exec("feather create-widget deckbox_rest_api " + wName, function (error, stdout, stderr) {
        if (!error) {
          cb(null, "Widget \"" + wName + "\" created!");
        } else {
          cb(error);
        }
      });
    }
  }
};