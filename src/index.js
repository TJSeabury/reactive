export const GLOBAL = {};
window.GLOBAL = GLOBAL;

export const REACTIVES = {};
window.REACTIVES = REACTIVES;

let _i = 0;
const uniqueID = () => `${Date.now()}-${_i++}`;

export const reactiveFactory = (initialValue) => {
  let store = initialValue;
  const subscriptions = {};

  const unsubscribe = (key) => {
    if (subscriptions.hasOwnProperty(key)) {
      delete subscriptions[key];
      return true;
    }
    throw new Error(`No subscription with key "${key}" exists`);
  };

  const subscribe = (key, callback) => {
    if (!subscriptions.hasOwnProperty(key)) {
      subscriptions[key] = callback;
      return () => unsubscribe(key);
    }
    throw new Error(`Subscription with key "${key}" already exists`);
  };

  const get = () => store;

  const set = (v) => {
    store = v;

    for (const [key, callback] of Object.entries(subscriptions)) {
      try {
        callback(key, v);
      } catch (err) {
        console.error(
          `Error encountered while processing subscription with key: ${key}`,
          err
        );
      }
    }
  };

  return [get, set, subscribe];
};

export const reactiveObjectFactory = (initialValue) => {
  let store = initialValue;
  const subscriptions = {};

  const unsubscribe = (key) => {
    if (subscriptions.hasOwnProperty(key)) {
      delete subscriptions[key];
      return true;
    }
    throw new Error(`No subscription with key "${key}" exists`);
  };

  const subscribe = (key, callback) => {
    if (!subscriptions.hasOwnProperty(key)) {
      subscriptions[key] = callback;
      return () => unsubscribe(key);
    }
    throw new Error(`Subscription with key "${key}" already exists`);
  };

  const get = () => store;

  const set = (v) => {
    store = v;

    for (const [key, callback] of Object.entries(subscriptions)) {
      try {
        callback(key, v);
      } catch (err) {
        console.error(
          `Error encountered while processing subscription with key: ${key}`,
          err
        );
      }
    }
  };

  return {
    get state() {
      return get();
    },
    set state(v) {
      set(v);
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
  const element = document.querySelector(cssSelector);
  if (!element) {
    throw new Error(`Could not find element with selector "${cssSelector}"`);
  }
  element.setAttribute("data-reactive", "");
  const reactive = {
    element,
    value: (([get, set, subscribe]) => ({
      get,
      set,
      subscribe,
    }))(reactiveFactory(initialValue)),
  };

  element.state = reactive.value;

  reactive.value.subscribe("_internal_sync-dom-element", (_, v) => {
    element.value = v;
    element.setAttribute("value", v);
  });
  element.addEventListener(options.eventType, (event) => {
    reactive.value.set(event.target.value);
  });
  return reactive;
};

export const makeReactiveInput = (
  element,
  options = {
    eventType: "input",
  },
  initialValue = ""
) => {
  if (!element) {
    throw new Error(`Element is not defined`);
  }

  const reactive = {
    element,
    value: (([get, set, subscribe]) => ({
      get,
      set,
      subscribe,
    }))(reactiveFactory(initialValue || element.value)),
  };

  element.state = reactive.value;

  reactive.value.subscribe("_internal_sync-dom-element", (_, v) => {
    element.value = v;
    element.setAttribute("value", v);
  });
  element.addEventListener(options.eventType, (event) => {
    reactive.value.set(event.target.value);
  });
  return reactive;
};

export function parse(element) {
  const template = element.innerHTML;
  const regex = /{{(.*?)}}/g;
  const matches = template.matchAll(regex);
  const props = {};
  for (const match of matches) {
    const key = match[1];
    if (props.hasOwnProperty(key)) {
      throw new Error(`Duplicate property key "${key}"`);
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

  element.render = (props = props) => {
    element.innerHTML = template.replace(regex, (_, key) => {
      if (!props.hasOwnProperty(key)) {
        throw new Error(`No prop with key "${key}" exists`);
      }
      return props[key];
    });
  };

  element.render(props);

  const id = uniqueID();
  element.setAttribute("data-reactive-id", id);

  REACTIVES[id] = element;

  return element;
}

export function bind(element) {
  if (!element) {
    throw new Error(`Element is not defined`);
  }
  if (!element.getAttribute("data-bind")) {
    throw new Error(`Element does not have a data-bind attribute`);
  }

  const bindRule = element.getAttribute("data-bind");
  const [selector, key] = bindRule.split("|");

  let bindTarget;

  if (selector.includes("GLOBAL")) {
    console.log("GLOBAL");

    if (!GLOBAL.hasOwnProperty(key)) {
      throw new Error(`No global with key "${key}" exists`);
    }

    bindTarget = GLOBAL[key];

    if (GLOBAL[key].hasOwnProperty("state")) {
      bindTarget.subscribe(`bind-${key}`, (_, v) => {
        element.render({ [key]: v });
      });
      element.render({ [key]: bindTarget.state });
    } else {
      const [get, set, subscribe] = bindTarget;
      subscribe(`bind-${key}`, (_, v) => {
        element.render({ [key]: v });
      });
      element.render({ [key]: get() });
    }
  } else {
    console.log("NOT GLOBAL");
    bindTarget = document.querySelector(selector);
    if (!bindTarget || !bindTarget.hasAttribute("data-reactive")) {
      throw new Error(`Element with selector "${selector}" is not reactive`);
    }

    bindTarget.state.subscribe(`bind-${key}`, (_, v) => {
      element.render({ name: v });
    });

    element.render({ name: bindTarget.state.get() });
  }

  return element;
}

export const initialize = () => {
  window.addEventListener("DOMContentLoaded", () => {
    const name_input = createReactiveField("input#name", "World", {
      eventType: "input",
    });

    const reactives = Array.from(
      document.querySelectorAll("[data-reactive]")
    ).map((el) => parse(el));

    reactives
      .filter((el) => el.getAttribute("data-bind") ?? false)
      .map((el) => bind(el));
  });
};
