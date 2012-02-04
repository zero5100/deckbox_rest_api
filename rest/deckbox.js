var feather = require("../lib/feather").getFeather();
var node_io = require('node.io');

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
      node_io.scrape(function() {
        this.getHtml('http://www.deckbox.org/users/' + req.params.user, function(err, $) {
          var decks = [];
          $('a.simple').each(function(link) {
            if (link.attribs.title) {
              decks.push({
                "title": link.attribs.title,
                "href": link.attribs.href
              });
            }
          });
          
          cb(null, decks);
        });
      });
    },
    
    "/users/test/:user": function(req, res, cb) {
      node_io.scrape(function() {
        this.getHtml('http://www.deckbox.org/users/' + req.params.user, function(err, $) {
          var decks = [];
          $('li.deck a').each(function(deck) {
            // if (deck.attribs.title) {
              // decks.push({
                // "title": deck.attribs.title,
                // "href": deck.attribs.href
              // });
              decks.push(deck);
            // }
          });
          
          cb(null, decks);
        });
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