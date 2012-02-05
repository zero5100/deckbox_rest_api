var feather = require("./feather").getFeather(),
  request = require("request"),
  qs = require("querystring");

var cardDetailURL = 'http://gatherer.wizards.com/Pages/Card/Details.aspx',
  imageDataURL = 'http://gatherer.wizards.com/Handlers/Image.ashx',
  boundaryStart = "<!-- Card Details Table -->",
  boundaryEnd = "<!-- End Card Details Table -->",
  boundaryRegex = new RegExp(boundaryStart + "([\\s\\S]*)" + boundaryEnd, 'm');

var multiverseidRegex = /multiverseid=(\d+)/;

module.exports = {
  getCardMetadataByName: function(cardName, cb) {
    request({
        method: "GET",
        uri: cardDetailURL + "?" + qs.stringify({name: cardName})
      }, function(err, _res, body) {
        body = boundaryRegex.exec(body)[1];
        feather.domPool.getResource(function(dom) {
          try {
            var metadata = {};
            dom.$("body").append(dom.$(body));

            var cardDetailsCollection = dom.$(".cardDetails");
            cardDetailsCollection.each(function(index, table) {
              var _cardName = cardName;

              // for now, using their IDs, even though it could prove to be brittle (although, scraping is always a little brittle anyway)

              if (index > 0) {
                var nameRowId = 'ctl00_ctl00_ctl00_MainContent_SubContent_SubContent_ctl06_nameRow';
                _cardName = dom.$('#' + nameRowId + ' .value').text().replace(/\r\n/g, '').trim();
                metadata.flipcard = {name: _cardName};                
              }

              // multiverseid and imageURL
              var img = dom.$('img[alt=' + _cardName + ']', table);
              if (img.length) {
                var multiverseid = multiverseidRegex.exec(img[0].src)[1];
                var imageUrl = imageDataURL + "?multiverseid=" + multiverseid + "&type=card";
                if (index == 0) {
                  metadata.multiverseid = multiverseid;
                  metadata.imageUrl = imageUrl;
                } else {
                  metadata.flipcard.multiverseid = multiverseid;
                  metadata.flipcard.imageUrl = imageUrl;
                }
              }

              //TODO: as we add components, refactor to nicer id figure-outer-algo-rythm
              var typeRowId;
              if (index == 0) {
                if (cardDetailsCollection.length == 1) {
                  typeRowId = 'ctl00_ctl00_ctl00_MainContent_SubContent_SubContent_typeRow';
                } else {
                  typeRowId = 'ctl00_ctl00_ctl00_MainContent_SubContent_SubContent_ctl05_typeRow';
                }
              } else {
                typeRowId = 'ctl00_ctl00_ctl00_MainContent_SubContent_SubContent_ctl06_typeRow';
              }

              // types
              var types = dom.$('#' + typeRowId + ' .value').text().replace(/\r\n/g, '').replace('  —', ' -').trim().split(' - ');
              if (index == 0) {
                metadata.types = types;
              } else {
                metadata.flipcard.types = types;
              }
            });                   
            
            cb(null, metadata);
          } catch (ex) {
            cb(ex);
          }

          // release dom back to the pool
          feather.domPool.release(dom);
        });        
    });
  }
};