# Reactive

A lightweight, declarative reactivity library for vanilla JavaScript that enables reactive data binding, computed values, and automatic DOM updates without a framework.

## Features

- 🔄 **Reactive Input Fields** - Automatically sync form inputs with reactive state
- 🌐 **Global State Management** - Create and manage reactive global state
- 📝 **Template Rendering** - Declarative templates with `{{variable}}` syntax
- 🔗 **Data Binding** - Bind reactive values to DOM elements
- 🧮 **Computed Values** - Derive values from other reactive sources
- 👀 **Watchers** - React to changes and transform values
- 🛡️ **Secure** - No `eval()` - uses function references for safety

## Installation

```bash
npm install
# or
pnpm install
```

## Quick Start

```html
<!DOCTYPE html>
<html>
  <head>
    <script type="module" src="/src/index.js"></script>
  </head>
  <body>
    <input data-reactive data-reactive-on="input" id="name" value="World" />
    <h2 data-reactive data-bind="input#name|name">Hello, {{name}}!</h2>
  </body>
</html>
```

```javascript
import { initialize } from "./main.js";

initialize();
```

## Core Concepts

### Reactive Values

Reactive values are the foundation of this library. They can be:

- **Input fields** - Automatically synced with form elements
- **Global state** - Shared reactive objects accessible via `GLOBAL`
- **Computed** - Derived from other reactive values
- **Watched** - Transformed when source values change

### Data Attributes

The library uses HTML data attributes for declarative configuration:

- `data-reactive` - Marks an element as reactive
- `data-reactive-on` - Specifies the event type for input fields (e.g., "input", "change")
- `data-bind` - Binds a reactive value to a template
- `data-compute` - Creates a computed value
- `data-watch` - Sets up a watcher to transform values

## Usage

### Reactive Input Fields

Input fields are automatically initialized when they have the `data-reactive` attribute:

```html
<input data-reactive data-reactive-on="input" id="username" value="John" />
<textarea data-reactive data-reactive-on="input">Initial text</textarea>
<select data-reactive data-reactive-on="change">
  <option value="option1">Option 1</option>
</select>
```

**Attributes:**

- `data-reactive` - Required. Marks the element as reactive
- `data-reactive-on` - Optional. Event type to listen to (default: `"change"`)
  - Common values: `"input"`, `"change"`, `"blur"`

The input's value is automatically synced with its reactive state, accessible via `element.state`.

### Global State

Create reactive global state objects:

```javascript
import { reactiveObjectFactory, GLOBAL } from "./main.js";

// Create a reactive object
GLOBAL.clicks = reactiveObjectFactory(0);

// Access and modify
GLOBAL.clicks.state = 5;
console.log(GLOBAL.clicks.state); // 5

// Subscribe to changes
GLOBAL.clicks.subscribe("my-key", (key, newValue) => {
  console.log(`Clicks changed to: ${newValue}`);
});
```

**API:**

- `reactiveObjectFactory(initialValue)` - Creates a reactive object
- `reactive.state` - Getter/setter for the value
- `reactive.subscribe(key, callback)` - Subscribe to changes
- `reactive.unsubscribe(key)` - Unsubscribe from changes

### Templates and Data Binding

Create reactive templates with `{{variable}}` syntax:

```html
<h2 data-reactive data-bind="input#name|name">Hello, {{name}}!</h2>
```

**Format:** `data-bind="source|templateKey"`

**Binding Sources:**

- **Element:** `input#name|name` - Binds to an input element's state
- **Global:** `GLOBAL.clicks|clicks` - Binds to global state

The template will automatically update when the bound value changes.

### Computed Values

Computed values are derived from other reactive sources using registered functions:

```javascript
import { COMPUTE_FUNCTIONS } from "./main.js";

// Register a compute function
COMPUTE_FUNCTIONS.fullName = (firstName, lastName) => {
  return `${firstName} ${lastName}`;
};
```

```html
<h2
  data-reactive
  data-bind="GLOBAL.fullName|fullName"
  data-compute="fullName|fullName(element(#first), element(#last))"
>
  {{fullName}}
</h2>
```

**Format:** `data-compute="targetKey|functionName(param1, param2, ...)"`

**Parameters:**

- `element(selector)` - Gets the value from a reactive element
- `GLOBAL.key` - Gets the value from global state
- JSON literals - `"string"`, `123`, `true`, etc.

**Example:**

```html
<h2
  data-reactive
  data-bind="GLOBAL.result|result"
  data-compute="result|calculate(element(#x), element(#y), GLOBAL.multiplier)"
>
  Result: {{result}}
</h2>
```

```javascript
COMPUTE_FUNCTIONS.calculate = (x, y, multiplier) => {
  return (x + y) * multiplier;
};
```

### Watchers

Watchers transform values when a source reactive value changes:

```javascript
import { COMPUTE_FUNCTIONS } from "./main.js";

// Register a watch function
COMPUTE_FUNCTIONS.doubleValue = (context) => {
  return context.$value * 2;
};
```

```html
<div data-watch="GLOBAL.count|GLOBAL.doubled|doubleValue"></div>
```

**Format:** `data-watch="sourceKey|targetKey|functionName"`

**Watch Function Context:** The watch function receives a context object with:

- `$value` - The new value from the source
- `GLOBAL` - Proxy to access global state
- `element(selector)` - Helper to get element values

**Example:**

```html
<!-- When GLOBAL.price changes, update GLOBAL.taxedPrice -->
<div data-watch="GLOBAL.price|GLOBAL.taxedPrice|applyTax"></div>
```

```javascript
COMPUTE_FUNCTIONS.applyTax = (context) => {
  const price = context.$value;
  const taxRate = context.GLOBAL.taxRate || 0.1;
  return price * (1 + taxRate);
};
```

## API Reference

### Factories

#### `reactiveFactory(initialValue)`

Creates a reactive value. Returns `[get, set, subscribe]`.

```javascript
const [get, set, subscribe] = reactiveFactory("initial");

subscribe("my-key", (key, value) => {
  console.log(value);
});

set("new value");
console.log(get()); // "new value"
```

#### `reactiveObjectFactory(initialValue)`

Creates a reactive object with a `state` property. Returns an object with:

- `state` - Getter/setter for the value
- `subscribe(key, callback)` - Subscribe to changes
- `unsubscribe(key)` - Unsubscribe from changes

```javascript
const reactive = reactiveObjectFactory(0);
reactive.state = 10;
reactive.subscribe("key", (k, v) => console.log(v));
```

### Manual Input Creation

#### `createReactiveField(cssSelector, initialValue, options)`

Manually create a reactive field (usually not needed - use `data-reactive` instead).

```javascript
createReactiveField("input#name", "World", { eventType: "input" });
```

#### `makeReactiveInput(element, options, initialValue)`

Make an existing element reactive.

```javascript
const input = document.querySelector("#myInput");
makeReactiveInput(input, { eventType: "input" }, "default");
```

### Global Objects

#### `GLOBAL`

Global namespace for reactive state. All reactive objects stored here are accessible globally.

```javascript
GLOBAL.myValue = reactiveObjectFactory("hello");
console.log(window.GLOBAL.myValue.state); // "hello"
```

#### `COMPUTE_FUNCTIONS`

Registry for compute and watch functions. Functions must be registered here or on `window`.

```javascript
COMPUTE_FUNCTIONS.myFunction = (param1, param2) => {
  return param1 + param2;
};
```

#### `REACTIVES`

Registry of all reactive elements with `data-reactive-id`.

### Initialization

#### `initialize()`

Initializes the reactive system. Call this after the DOM is loaded.

```javascript
import { initialize } from "./main.js";

initialize();
```

The initialization process:

1. Sets up reactive input fields (`input`, `textarea`, `select` with `data-reactive`)
2. Parses templates (elements with `data-reactive` and `{{}}` syntax)
3. Sets up computed values (`data-compute`)
4. Sets up watchers (`data-watch`)
5. Sets up bindings (`data-bind`)

## Complete Example

```html
<!DOCTYPE html>
<html>
  <head>
    <script type="module" src="/src/index.js"></script>
  </head>
  <body>
    <!-- Reactive Input -->
    <input data-reactive data-reactive-on="input" id="firstName" value="John" />
    <input data-reactive data-reactive-on="input" id="lastName" value="Doe" />

    <!-- Display bound to input -->
    <h2 data-reactive data-bind="input#firstName|firstName">
      First: {{firstName}}
    </h2>

    <!-- Global state with buttons -->
    <button onclick="GLOBAL.count.state++">+</button>
    <h2 data-reactive data-bind="GLOBAL.count|count">Count: {{count}}</h2>
    <button onclick="GLOBAL.count.state--">-</button>

    <!-- Computed value -->
    <h2
      data-reactive
      data-bind="GLOBAL.fullName|fullName"
      data-compute="fullName|combineNames(element(#firstName), element(#lastName))"
    >
      Full Name: {{fullName}}
    </h2>

    <!-- Watcher -->
    <div data-watch="GLOBAL.count|GLOBAL.doubled|double"></div>
    <h2 data-reactive data-bind="GLOBAL.doubled|doubled">
      Doubled: {{doubled}}
    </h2>
  </body>
</html>
```

```javascript
import {
  GLOBAL,
  COMPUTE_FUNCTIONS,
  reactiveObjectFactory,
  initialize,
} from "./main.js";

// Set up global state
GLOBAL.count = reactiveObjectFactory(0);
GLOBAL.doubled = reactiveObjectFactory(0);
GLOBAL.fullName = reactiveObjectFactory("");

// Register compute function
COMPUTE_FUNCTIONS.combineNames = (first, last) => {
  return `${first} ${last}`;
};

// Register watch function
COMPUTE_FUNCTIONS.double = (context) => {
  return context.$value * 2;
};

// Initialize
initialize();
```

## Security

This library is designed with security in mind:

- ✅ **No `eval()`** - All code execution uses registered function references
- ✅ **Parameter Resolution** - Parameters are resolved to values, not executed
- ✅ **Function Registry** - Only registered functions can be called
- ✅ **XSS Prevention** - No arbitrary code execution from HTML attributes

All compute and watch functions must be explicitly registered in JavaScript, preventing code injection attacks.

## Browser Support

Modern browsers with ES6+ support:

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

MIT
