const reactiveFactory = (initialValue) => {
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

const createReactiveField = (
  cssSelector,
  initialValue,
  options = {
    eventType: "change",
  }
) => {
  const element = d.querySelector(cssSelector);
  if (!element) {
    throw new Error(`Could not find element with selector "${cssSelector}"`);
  }
  const reactive = {
    element,
    value: (([get, set, subscribe]) => ({
      get,
      set,
      subscribe,
    }))(reactiveFactory(initialValue)),
  };
  reactive.value.subscribe("_internal_sync-dom-element", (_, v) => {
    element.value = v;
    element.setAttribute("value", v);
  });
  element.addEventListener(options.eventType, (event) => {
    reactive.value.set(event.target.value);
  });
  return reactive;
};

module.exports = {
  reactiveFactory,
  createReactiveField,
};
