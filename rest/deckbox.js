var feather = require("../lib/feather").getFeather();
var node_io = require('node.io');
var _ = require("underscore")._;

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
      node_io.scrape(function() {
        this.getHtml('http://www.deckbox.org/sets/' + req.params.set, function(err, $) {
          var cardList = [];
          $('tr').each(function(cards) {
            // Check if its a card (should have a numeric id)
            if (cards.attribs && cards.attribs.id && $.isNumeric(cards.attribs.id)) {
              var cardData = {};
              cards.children.each(function(info) {
                cardData[info.attribs.class] = info.children[0];
                cardList.push(cardData);
              });
            }
          });
          cb(null, cardList);
        });
      });
    }
  }
};