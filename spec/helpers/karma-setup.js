// Setup for when running with Karma
var chai = require( "chai" );
window.sinon = require( "sinon" );
chai.use( require( "sinon-chai" ) );
chai.use( require( "chai-as-promised" ) );
require( "sinon-as-promised" );
window.should = chai.should();
require( "babel/polyfill" );
window._ = require( "lodash" );
window.when = require( "when" );
window.machina = require( "machina" );
window.expectedOptionsResponse = require( "../mockResponses/options.json" );
window.expectedBoardResponse = require( "../mockResponses/board101.json" );
window.expectedCardResponse = require( "../mockResponses/board101cards.json" );
window.expectedCardTypeResponse = require( "../mockResponses/board101cardtypes.json" );
window.expectedUserResponse = require( "../mockResponses/user1.json" );
window.adapterFactory = require( "../adapterStub.js" );
window.requestFactory = require( "../requestStub.js" );
