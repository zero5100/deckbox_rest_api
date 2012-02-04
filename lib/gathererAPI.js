// http://gatherer.wizards.com/Pages/Card/Details.aspx?name=Drowned%20Catacomb

var feather = require("./feather").getFeather(),
  request = require("request"),
  qs = require("querystring");

var cardDetailURL = 'http://gatherer.wizards.com/Pages/Card/Details.aspx',
  imageDataURL = 'http://gatherer.wizards.com/Handlers/Image.ashx';

var multiverseidRegex = /multiverseid=(\d+)/;

module.exports = {
  getCardMetadataByName: function(cardName, cb) {
    request({
        method: "GET",
        uri: cardDetailURL + "?" + qs.stringify({name: cardName})
      }, function(err, _res, body) {
        body = body.substring(body.indexOf("<table class=\"cardDetails\""));
        body = body.substring(0, body.indexOf("</table>"));
        feather.domPool.getResource(function(dom) {
          try {
            var metadata = {};
            dom.$("body").append(dom.$(body));

            // multiverseid and imageURL
            var img = dom.$('img[alt=' + cardName + ']');
            if (img.length) {
              var multiverseid = multiverseidRegex.exec(img[0].src)[1];
              metadata.multiverseid = multiverseid;
              metadata.imageUrl = imageDataURL + "?multiverseid=" + multiverseid + "&type=card";
            }

            // for now, using their IDs, even though it could prove to be brittle (although, scraping is always a little brittle anyway)

            // types
            var types = dom.$("#ctl00_ctl00_ctl00_MainContent_SubContent_SubContent_typeRow .value").text().replace(/\r\n/g, '').replace('  —', ' -').trim();
            metadata.types = types.split(' - ');
            
            // release dom back to the pool and respond
            feather.domPool.release(dom);
            cb(null, metadata);
          } catch (ex) {
            cb(ex);
          }
        });        
    });
  }
};