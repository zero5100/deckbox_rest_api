var feather = require("../lib/feather").getFeather();
var node_io = require('node.io'),
  request = require('request'),
  _ = require("underscore")._,
  gatherer = require("../lib/gathererAPI");


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
        var cardList = {
          'deck': [],
          'sideboard': []
        };
        
        // Divide the html into two sections, one above and one below the sideboard title
        var bodySplit = body.split('>Sideboard:<');
        var deckTypes = ['deck', 'sideboard'];
        var matches;
        for (var i=0; i < deckTypes.length; i++) { // Parse the deck for deck and sideboard
          while ((matches = cardRegex.exec(bodySplit[i]))) {
            var cardInfoStr = matches[1].replace(newlineRegex, '').trim();
            var parts = cardInfoStr.split(' ');
            var count = parseInt(parts[0]);
            if (count) {
              parts.shift();
              var name = parts.join(' ');
              cardList[deckTypes[i]].push({name: name, count: count});
            }
          }
        }

        // is the requestor also asking us to prefetch card metadata from gatherer?
        if (req.query && req.query.metadata) {
          var sem = new feather.lang.Semaphore(function() {
            cb(null, cardList);
          });
          //first main deck, then sideboard
          //TODO: could optimize this for case where sideboard contains overlap card names from main deck; for now who cares
          _.each([cardList.deck, cardList.sideboard], function(deck) {
            _.each(deck, function(card) {
              sem.increment();
              gatherer.getCardMetadataByName(card.name, function(err, metadata) {
                //TODO: check and do something about errors
                card.metadata = metadata;
                sem.execute();
              });
            });
          });
        } else {
          cb(null, cardList);
        }
      });
    }
  }
};