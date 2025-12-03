export const GLOBAL = {};
window.GLOBAL = GLOBAL;

export const REACTIVES = {};
window.REACTIVES = REACTIVES;

// Registry for compute functions
export const COMPUTE_FUNCTIONS = {};
window.COMPUTE_FUNCTIONS = COMPUTE_FUNCTIONS;

const log = console.log;

let _i = 0;
const uniqueID = () => `${Date.now()}-${_i++}`;

export const reactiveFactory = ( initialValue ) => {
  let store = initialValue;
  const subscriptions = {};

  const unsubscribe = ( key ) => {
    if ( subscriptions.hasOwnProperty( key ) ) {
      delete subscriptions[key];
      return true;
    }
    throw new Error( `No subscription with key "${key}" exists` );
  };

  const subscribe = ( key, callback ) => {
    if ( typeof callback !== 'function' ) {
      throw new TypeError(
        `Cannot subscribe: callback must be a function. ` +
        `Received: ${typeof callback} for key "${key}". ` +
        `Value: ${JSON.stringify( callback )}`
      );
    }
    if ( !subscriptions.hasOwnProperty( key ) ) {
      subscriptions[key] = callback;
      return () => unsubscribe( key );
    }
    throw new Error( `Subscription with key "${key}" already exists` );
  };

  const get = () => store;

  const set = ( v ) => {
    store = v;

    for ( const [key, callback] of Object.entries( subscriptions ) ) {
      try {
        if ( typeof callback !== 'function' ) {
          throw new TypeError(
            `Subscription callback for key "${key}" is not a function. ` +
            `Received: ${typeof callback}. ` +
            `Value: ${JSON.stringify( callback )}. ` +
            `This usually means the callback was not properly set up.`
          );
        }
        // Callback receives (subscriptionKey, newValue) as arguments
        callback( key, v );
      } catch ( err ) {
        console.error(
          `Error encountered while processing subscription with key: ${key}`,
          `\n  Callback: ${callback?.toString?.() || String( callback )}`,
          `\n  Value being set: ${JSON.stringify( v )}`,
          `\n  Error:`,
          err
        );
        // Re-throw in development to see full stack trace
        if ( typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production' ) {
          throw err;
        }
      }
    }
  };

  return [get, set, subscribe];
};

export const reactiveObjectFactory = ( initialValue ) => {
  let store = initialValue;
  const subscriptions = {};

  const unsubscribe = ( key ) => {
    if ( subscriptions.hasOwnProperty( key ) ) {
      delete subscriptions[key];
      return true;
    }
    throw new Error( `No subscription with key "${key}" exists` );
  };

  const subscribe = ( key, callback ) => {
    if ( typeof callback !== 'function' ) {
      throw new TypeError(
        `Cannot subscribe: callback must be a function. ` +
        `Received: ${typeof callback} for key "${key}". ` +
        `Value: ${JSON.stringify( callback )}`
      );
    }
    if ( !subscriptions.hasOwnProperty( key ) ) {
      subscriptions[key] = callback;
      return () => unsubscribe( key );
    }
    throw new Error( `Subscription with key "${key}" already exists` );
  };

  const get = () => store;

  const set = ( v ) => {
    store = v;

    for ( const [key, callback] of Object.entries( subscriptions ) ) {
      try {
        if ( typeof callback !== 'function' ) {
          throw new TypeError(
            `Subscription callback for key "${key}" is not a function. ` +
            `Received: ${typeof callback}. ` +
            `Value: ${JSON.stringify( callback )}. ` +
            `This usually means the callback was not properly set up.`
          );
        }
        // Callback receives (subscriptionKey, newValue) as arguments
        callback( key, v );
      } catch ( err ) {
        console.error(
          `Error encountered while processing subscription with key: ${key}`,
          `\n  Callback: ${callback?.toString?.() || String( callback )}`,
          `\n  Value being set: ${JSON.stringify( v )}`,
          `\n  Error:`,
          err
        );
        // Re-throw in development to see full stack trace
        if ( typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production' ) {
          throw err;
        }
      }
    }
  };

  return {
    get state () {
      return get();
    },
    set state ( v ) {
      set( v );
    },
    subscribe,
    unsubscribe,
  };
};

export const createReactiveField = (
  cssSelector,
  initialValue,
  options = {
    eventType: "change",
  }
) => {
  const element = document.querySelector( cssSelector );
  if ( !element ) {
    throw new Error( `Could not find element with selector "${cssSelector}"` );
  }
  element.setAttribute( "data-reactive", "" );
  const reactive = {
    element,
    value: ( ( [get, set, subscribe] ) => ( {
      get,
      set,
      subscribe,
    } ) )( reactiveFactory( initialValue ) ),
  };

  element.state = reactive.value;

  reactive.value.subscribe( "_internal_sync-dom-element", ( _, v ) => {
    element.value = v;
    element.setAttribute( "value", v );
  } );
  element.addEventListener( options.eventType, ( event ) => {
    reactive.value.set( event.target.value );
  } );
  return reactive;
};

export const makeReactiveInput = (
  element,
  options = {
    eventType: "input",
  },
  initialValue = ""
) => {
  if ( !element ) {
    throw new Error( `Element is not defined` );
  }

  const reactive = {
    element,
    value: ( ( [get, set, subscribe] ) => ( {
      get,
      set,
      subscribe,
    } ) )( reactiveFactory( initialValue || element.value ) ),
  };

  element.state = reactive.value;

  reactive.value.subscribe( "_internal_sync-dom-element", ( _, v ) => {
    element.value = v;
    element.setAttribute( "value", v );
  } );
  element.addEventListener( options.eventType, ( event ) => {
    reactive.value.set( event.target.value );
  } );
  return reactive;
};

export function setupReactiveInputs () {
  // Find all input elements with data-reactive attribute that aren't already set up
  const inputElements = Array.from(
    document.querySelectorAll( "input[data-reactive], textarea[data-reactive], select[data-reactive]" )
  ).filter( el => !el.state );

  inputElements.forEach( element => {
    // Get event type from data-reactive-on attribute, default to "change"
    const eventType = element.getAttribute( "data-reactive-on" ) || "change";

    // Use element's value attribute or empty string as initial value
    const initialValue = element.value || element.getAttribute( "value" ) || "";

    makeReactiveInput( element, { eventType }, initialValue );
  } );
}

export function parse ( element ) {
  const template = element.innerHTML;
  const regex = /{{(.*?)}}/g;
  const matches = template.matchAll( regex );
  const props = {};
  for ( const match of matches ) {
    const key = match[1];
    if ( props.hasOwnProperty( key ) ) {
      throw new Error( `Duplicate property key "${key}"` );
    }
    props[key] = "";
    /* {
      key: match[1],
      value: "",
      index: match.index,
      length: match[0].length,
    } */
  }

  element.template = template;

  element.render = ( props = props ) => {
    element.innerHTML = template.replace( regex, ( _, key ) => {
      if ( !props.hasOwnProperty( key ) ) {
        throw new Error( `No prop with key "${key}" exists` );
      }
      return props[key];
    } );
  };

  element.render( props );

  const id = uniqueID();
  element.setAttribute( "data-reactive-id", id );

  REACTIVES[id] = element;

  return element;
}

export function bind ( element ) {
  if ( !element ) {
    throw new Error( `Element is not defined` );
  }
  if ( !element.getAttribute( "data-bind" ) ) {
    throw new Error( `Element does not have a data-bind attribute` );
  }

  const bindRule = element.getAttribute( "data-bind" );
  const [selector, key] = bindRule.split( "|" );

  let bindTarget;

  if ( selector.includes( "GLOBAL" ) ) {
    console.log( "GLOBAL" );

    if ( !GLOBAL.hasOwnProperty( key ) ) {
      throw new Error( `No global with key "${key}" exists` );
    }

    bindTarget = GLOBAL[key];

    if ( GLOBAL[key].hasOwnProperty( "state" ) ) {
      bindTarget.subscribe( `bind-${key}`, ( _, v ) => {
        element.render( { [key]: v } );
      } );
      element.render( { [key]: bindTarget.state } );
    } else {
      const [get, set, subscribe] = bindTarget;
      subscribe( `bind-${key}`, ( _, v ) => {
        element.render( { [key]: v } );
      } );
      element.render( { [key]: get() } );
    }
  } else {
    console.log( "NOT GLOBAL" );
    bindTarget = document.querySelector( selector );
    if ( !bindTarget || !bindTarget.hasAttribute( "data-reactive" ) ) {
      throw new Error( `Element with selector "${selector}" is not reactive` );
    }

    bindTarget.state.subscribe( `bind-${key}`, ( _, v ) => {
      element.render( { name: v } );
    } );

    element.render( { name: bindTarget.state.get() } );
  }

  return element;
}

export function setupComputed ( element ) {
  if ( !element ) {
    throw new Error( `Element is not defined` );
  }
  if ( !element.getAttribute( "data-compute" ) ) {
    return element;
  }

  const computeRule = element.getAttribute( "data-compute" );
  const [targetKey, functionCall] = computeRule.split( "|" );
  log( "setupComputed", targetKey, functionCall );
  if ( !targetKey || !functionCall ) {
    throw new Error( `Invalid data-compute format. Expected "targetKey|functionName(param1, param2, ...)"` );
  }

  // Parse function name and parameters
  const functionMatch = functionCall.match( /^(\w+)\s*\((.*)\)$/ );
  if ( !functionMatch ) {
    throw new Error( `Invalid function call format. Expected "functionName(param1, param2, ...)"` );
  }

  const functionName = functionMatch[1];
  const paramsString = functionMatch[2].trim();

  // Get the compute function from registry
  const computeFunction = COMPUTE_FUNCTIONS[functionName] || window[functionName];
  if ( typeof computeFunction !== 'function' ) {
    throw new Error( `Compute function "${functionName}" not found. Register it in COMPUTE_FUNCTIONS or define it on window.` );
  }

  // Parse parameters
  const parseParams = ( paramsStr ) => {
    if ( !paramsStr ) return [];

    const params = [];
    let current = '';
    let depth = 0;
    let inString = false;
    let stringChar = '';

    for ( let i = 0; i < paramsStr.length; i++ ) {
      const char = paramsStr[i];

      if ( !inString && ( char === '"' || char === "'" ) ) {
        inString = true;
        stringChar = char;
        current += char;
      } else if ( inString && char === stringChar ) {
        inString = false;
        current += char;
      } else if ( !inString && char === '(' ) {
        depth++;
        current += char;
      } else if ( !inString && char === ')' ) {
        depth--;
        current += char;
      } else if ( !inString && depth === 0 && char === ',' ) {
        params.push( current.trim() );
        current = '';
      } else {
        current += char;
      }
    }

    if ( current.trim() ) {
      params.push( current.trim() );
    }

    return params;
  };

  const paramStrings = parseParams( paramsString );

  // Helper to resolve a parameter value
  const resolveParam = ( paramStr ) => {
    paramStr = paramStr.trim();

    // Check for element(selector)
    const elementMatch = paramStr.match( /^element\s*\(\s*([^)]+)\s*\)$/ );
    if ( elementMatch ) {
      const selector = elementMatch[1].trim();
      const el = document.querySelector( selector );
      if ( el && el.state ) {
        return el.state.get();
      }
      return undefined;
    }

    // Check for GLOBAL.key
    const globalMatch = paramStr.match( /^GLOBAL\.(\w+)$/ );
    if ( globalMatch ) {
      const key = globalMatch[1];
      if ( GLOBAL[key] ) {
        return GLOBAL[key].hasOwnProperty( 'state' ) ? GLOBAL[key].state : GLOBAL[key][0]();
      }
      return undefined;
    }

    // Try to parse as JSON (for literals)
    try {
      return JSON.parse( paramStr );
    } catch {
      // If not JSON, return as string
      return paramStr;
    }
  };

  // Create a computed reactive object
  const computed = reactiveObjectFactory( "" );

  // Function to evaluate using the registered function
  const evaluateExpression = () => {
    try {
      const resolvedParams = paramStrings.map( resolveParam );
      return computeFunction( ...resolvedParams );
    } catch ( err ) {
      console.error( 'Error evaluating computed expression:', err );
      return '';
    }
  };

  // Extract dependencies from parameters
  const dependencies = {
    globals: new Set(),
    elements: new Set()
  };

  paramStrings.forEach( paramStr => {
    const elementMatch = paramStr.match( /^element\s*\(\s*([^)]+)\s*\)$/ );
    if ( elementMatch ) {
      dependencies.elements.add( elementMatch[1].trim() );
    }

    const globalMatch = paramStr.match( /^GLOBAL\.(\w+)$/ );
    if ( globalMatch ) {
      dependencies.globals.add( globalMatch[1] );
    }
  } );

  // Set up subscriptions for dependencies
  const setupSubscriptions = () => {
    // Watch for global changes
    dependencies.globals.forEach( key => {
      if ( GLOBAL[key] ) {
        if ( GLOBAL[key].hasOwnProperty( 'subscribe' ) ) {
          GLOBAL[key].subscribe( `computed-${targetKey}`, () => {
            computed.state = evaluateExpression();
          } );
        } else if ( Array.isArray( GLOBAL[key] ) && GLOBAL[key][2] ) {
          GLOBAL[key][2]( `computed-${targetKey}`, () => {
            computed.state = evaluateExpression();
          } );
        }
      }
    } );

    // Watch for element changes
    dependencies.elements.forEach( selector => {
      const el = document.querySelector( selector );
      if ( el && el.state ) {
        if ( el.state.hasOwnProperty( 'subscribe' ) ) {
          el.state.subscribe( `computed-${targetKey}`, () => {
            computed.state = evaluateExpression();
          } );
        } else if ( Array.isArray( el.state ) && el.state[2] ) {
          el.state[2]( `computed-${targetKey}`, () => {
            computed.state = evaluateExpression();
          } );
        }
      }
    } );
  };

  // Set up subscriptions
  setupSubscriptions();

  // Set initial value
  computed.state = evaluateExpression();

  // Store the computed object globally
  GLOBAL[targetKey] = computed;

  return element;
}

export function setupWatchers ( element ) {
  if ( !element ) {
    throw new Error( `Element is not defined` );
  }
  if ( !element.getAttribute( "data-watch" ) ) {
    return element;
  }

  const watchRule = element.getAttribute( "data-watch" );
  const [sourceKey, targetKey, expression] = watchRule.split( "|" );

  if ( !sourceKey || !targetKey || !expression ) {
    throw new Error( `Invalid data-watch format. Expected "sourceKey|targetKey|expression"` );
  }

  // Find the source reactive object
  let sourceReactive;
  if ( sourceKey.includes( 'GLOBAL.' ) ) {
    const globalKey = sourceKey.split( '.' )[1];
    sourceReactive = GLOBAL[globalKey];
  } else {
    const sourceElement = document.querySelector( sourceKey );
    if ( sourceElement && sourceElement.state ) {
      sourceReactive = sourceElement.state;
    }
  }

  if ( !sourceReactive ) {
    throw new Error( `Could not find source reactive for "${sourceKey}"` );
  }

  // Find the target reactive object
  let targetReactive;
  if ( targetKey.includes( 'GLOBAL.' ) ) {
    const globalKey = targetKey.split( '.' )[1];
    targetReactive = GLOBAL[globalKey];
  } else {
    const targetElement = document.querySelector( targetKey );
    if ( targetElement && targetElement.state ) {
      targetReactive = targetElement.state;
    }
  }

  if ( !targetReactive ) {
    throw new Error( `Could not find target reactive for "${targetKey}"` );
  }

  // Get the watch function from registry
  const watchFunction = COMPUTE_FUNCTIONS[expression] || window[expression];
  if ( typeof watchFunction !== 'function' ) {
    throw new Error( `Watch function "${expression}" not found. Register it in COMPUTE_FUNCTIONS or define it on window.` );
  }

  // Helper function to get element values
  const getElementValue = ( selector ) => {
    const el = document.querySelector( selector );
    if ( el && el.state ) {
      return el.state.get();
    }
    return undefined;
  };

  // Helper to get global values
  const getGlobalValue = ( key ) => {
    if ( GLOBAL[key] ) {
      return GLOBAL[key].hasOwnProperty( 'state' ) ? GLOBAL[key].state : GLOBAL[key][0]();
    }
    return undefined;
  };

  // Set up the watcher
  const setupWatcher = () => {
    const executeWatcher = ( _, newValue ) => {
      try {
        // Create context object with helpers and the new value
        const context = {
          GLOBAL: new Proxy( {}, {
            get: ( _, key ) => getGlobalValue( key )
          } ),
          element: getElementValue,
          $value: newValue
        };

        const evaluated = watchFunction( context );
        if ( targetReactive.hasOwnProperty( 'state' ) ) {
          targetReactive.state = evaluated;
        } else {
          targetReactive[1]( evaluated );
        }
      } catch ( err ) {
        console.error( 'Error in watcher expression:', err );
      }
    };

    if ( sourceReactive.hasOwnProperty( 'subscribe' ) ) {
      // For reactiveObjectFactory objects
      sourceReactive.subscribe( `watch-${targetKey}`, executeWatcher );
    } else {
      // For reactiveFactory arrays
      sourceReactive[2]( `watch-${targetKey}`, executeWatcher );
    }
  };

  setupWatcher();

  return element;
}

export const initialize = () => {
  window.addEventListener( "load", () => {
    // First, set up reactive input fields automatically
    setupReactiveInputs();

    // Then set up other reactive elements (templates, etc.)
    // Exclude input, textarea, and select elements as they're handled by setupReactiveInputs
    const reactives = Array.from(
      document.querySelectorAll( "[data-reactive]" )
    )
      .filter( el => !["INPUT", "TEXTAREA", "SELECT"].includes( el.tagName ) )
      .map( ( el ) => parse( el ) );

    // Set up computed values first
    reactives
      .filter( ( el ) => el.getAttribute( "data-compute" ) ?? false )
      .map( ( el ) => setupComputed( el ) );

    // Set up watchers
    reactives
      .filter( ( el ) => el.getAttribute( "data-watch" ) ?? false )
      .map( ( el ) => setupWatchers( el ) );

    // Set up bindings last
    reactives
      .filter( ( el ) => el.getAttribute( "data-bind" ) ?? false )
      .map( ( el ) => bind( el ) );
  } );
};
