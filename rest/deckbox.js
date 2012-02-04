var feather = require("../lib/feather").getFeather();
var node_io = require('node.io'),
  request = require('request'),
  _ = require("underscore")._;


var getUserDeckList = function(user, cb) {
  node_io.scrape(function() {
    this.getHtml('http://www.deckbox.org/users/' + user, function(err, $) {
      var decks = [];
      $('a.simple').each(function(link) {
        if (link.attribs.title) {
          decks.push({
            "title": link.attribs.title,
            "href": link.attribs.href
          });
        }
      });
      cb(decks);
    });
  });
};

module.exports = {
  "get": {
    "/": function(req, res, cb) {
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
    
    "/users/:user": function(req, res, cb) {
      getUserDeckList(req.params.user, function(deckList) {
        cb(null, deckList);
      });
    },
    
    "/users/:user/decks": function(req, res, cb) {
      getUserDeckList(req.params.user, function(deckList) {
        cb(null, deckList);
      });
    },
    
    "/users/:user/decks/:name": function(req, res, cb) {
      getUserDeckList(req.params.user, function(deckList) {
        var selected = _.find(deckList, function(deck) {
          return deck.title.toLowerCase() === req.params.name.toLowerCase();
        });
        cb(null, selected);
      });
    },
    
    "/sets/:set": function(req, res, cb) {
      var cardRegex = /(\d*\s[^<]+)<br\/>/g,
        newlineRegex = /\n/g;
      request({
        method: "GET",
        uri: 'http://deckbox.org/sets/' + req.params.set + '/export'
      }, function(err, _res, body) {
        var cardList = [];
        var matches;
        while ((matches = cardRegex.exec(body))) {
          var cardInfoStr = matches[1].replace(newlineRegex, '').trim();
          var parts = cardInfoStr.split(' ');
          var count = parseInt(parts[0]);
          if (count) {
            parts.shift();
            var name = parts.join(' ');
            cardList.push({name: name, count: count});
          }
        }
        cb(null, cardList);
      });
    }
  }
};