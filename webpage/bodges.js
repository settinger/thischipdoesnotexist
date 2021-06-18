// Dumb bodges: add element-wise addition and multiplication to arrays,
//   an any() method that works a little like some() but with different syntax,
//   startsWithAny() and includesAny() by analogy
//   and a couple SVG-specific helpful methods
try {
  Object.defineProperty(Array.prototype, "add", {
    value: function (summand) {
      return this.map((v, i) => v + (summand[i] ?? 0));
    },
  });
  Object.defineProperty(Array.prototype, "mult", {
    value: function (multiplicand) {
      return this.map((v, i) => v * (multiplicand[i] ?? 1));
    },
  });
  Object.defineProperty(Array.prototype, "any", {
    value: function () {
      return Object.values(arguments).some((arg) => arg == this);
    },
  });
  Object.defineProperty(Array.prototype, "includesAny", {
    value: function () {
      return Object.values(arguments).some((arg) => this.includes(arg));
    },
  });
  Object.defineProperty(String.prototype, "any", {
    value: function () {
      return Object.values(arguments).some((arg) => arg == this);
    },
  });
  Object.defineProperty(String.prototype, "includesAny", {
    value: function () {
      return Object.values(arguments).some((arg) => this.includes(arg));
    },
  });
  Object.defineProperty(String.prototype, "startsWithAny", {
    value: function () {
      return Object.values(arguments).some((arg) => this.startsWith(arg));
    },
  });
  Object.defineProperty(String.prototype, "endsWithAny", {
    value: function () {
      return Object.values(arguments).some((arg) => this.endsWith(arg));
    },
  });
  Object.defineProperty(Element.prototype, "setAttributes", {
    value: function (attributes = {}) {
      for (let [key, value] of Object.entries(attributes)) {
        if (key.any("text", "textContent", "innerText", "innerHTML")) {
          if (SVGElement.prototype.isPrototypeOf(this)) {
            this.textContent = value;
          } else {
            this.innerHTML = value;
          }
        } else {
          this.setAttribute(key, value);
        }
      }
    },
  });
  Object.defineProperty(Element.prototype, "clear", {
    value: function () {
      while (this.firstChild) this.removeChild(this.firstChild);
    },
  });
  Object.defineProperty(Element.prototype, "appendHTML", {
    value: function (childTag = "div", childProps = {}) {
      const child = document.createElement(childTag);
      child.setAttributes(childProps);
      this.appendChild(child);
      return child;
    },
  });
  Object.defineProperty(SVGElement.prototype, "appendSVG", {
    value: function (childTag = "svg", childProps = {}) {
      const child = document.createElementNS("http://www.w3.org/2000/svg", childTag);
      child.setAttributes(childProps);
      this.appendChild(child);
      return child;
    },
  });
} catch {
  throw "A dumb problem occurred because Samsam tried to add functions to native objects";
}

// Shortcut to create an HTML element and give it multiple attributes at once
const newHTML = (tag, props = {}) => {
  const node = document.createElement(tag);
  node.setAttributes(props);
  return node;
};

// Shortcut to create an SVG element and give it multiple attributes at once
const newSVG = (tag, props = {}) => {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  node.setAttributes(props);
  return node;
};

const $ = (text) => document.getElementById(text);

// Get a random sample from an array
const sample = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

// Get a random value from a dictionary of values and their relative probablities
const sampleFromDict = (dict) => {
  // Expand dict into a list
  array = [];
  for (let [pinName, count] of Object.entries(dict)) {
    for (let i = 0; i < count; i++) {
      array.push(pinName);
    }
  }
  return sample(array);
};

// Read compressed data (or whatever) from an external text file
async function readText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("HTTP error " + response.status); // Rejects the promise
  }
  const blah = await response.text();
  return blah;
}

// Use Proxy to implement defaultDict from python
const defaultDict = (lambda = () => 0) => {
  return new Proxy(
    {},
    {
      get: (target, prop, receiver) => {
        target[prop] ??= lambda();
        return target[prop];
      },
    }
  );
};
