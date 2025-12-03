import {
  GLOBAL,
  REACTIVES,
  COMPUTE_FUNCTIONS,
  initialize,
  reactiveObjectFactory,
} from "./main.js";

GLOBAL.clicks = reactiveObjectFactory( 0 );
GLOBAL.name_and_clicks = reactiveObjectFactory( "" );

// Register compute function - receives resolved parameters directly
COMPUTE_FUNCTIONS.name_plus_clicks_sqrt = ( nameValue, clicksValue ) => {
  return `Both: ${nameValue} + ${Math.sqrt( clicksValue )}`;
};

initialize();

