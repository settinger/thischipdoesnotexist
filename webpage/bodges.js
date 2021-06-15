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
  Object.defineProperty(Object.prototype, "any", {
    value: function () {
      return Object.values(arguments).some((arg) => arg == this);
    },
  });
  Object.defineProperty(String.prototype, "startsWithAny", {
    value: function () {
      return Object.values(arguments).some((arg) => this.startsWith(arg));
    },
  });
  Object.defineProperty(Object.prototype, "includesAny", {
    value: function () {
      return Object.values(arguments).some((arg) => this.includes(arg));
    },
  });
  Object.defineProperty(SVGElement.prototype, "setAttributes", {
    value: function (attributes = {}) {
      for (let [key, value] of Object.entries(attributes)) {
        if (
          this.nodeName.any("text", "tspan", "textpath") &&
          key.any("text", "textContent", "innerText", "innerHTML")
        ) {
          this.textContent = value;
        } else {
          this.setAttribute(key, value);
        }
      }
    },
  });
  Object.defineProperty(SVGElement.prototype, "appendSVG", {
    value: function (childTag = "svg", childProps = {}) {
      const child = document.createElementNS(
        "http://www.w3.org/2000/svg",
        childTag
      );
      child.setAttributes(childProps);
      this.appendChild(child);
      return child;
    },
  });
} catch {
  throw "A dumb problem occurred because Samsam tried to add functions to native objects";
}

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
