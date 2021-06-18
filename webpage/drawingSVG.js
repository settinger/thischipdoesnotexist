// SVG attributes for rectangles and text
let lines = { stroke: "black", fill: "none" };
let txt = { stroke: "none", fill: "black" };

// Draw text with overlines
const drawText = (svg, pin, extraProps = {}) => {
  let [x, y] = pin.textAnchor;

  let plaintext = pin.label.replaceAll("~", "");

  // If the text alignment is supposed to be right or center, fake it by measuring the text and shifting it leftward a bit
  // First, find out the width of an M in the current size
  let measure = svg.appendSVG("text", {
    ...txt,
    x: 20,
    y: 20,
    text: plaintext,
    ...extraProps,
  });
  let width = measure.getBBox().width;
  measure.remove();
  if (pin.style == "EP") {
    x -= width / 2;
  } else if (pin.direction?.any("left", "up")) {
    x -= width;
  }
  const g = svg.appendSVG("text", extraProps);

  let splits = pin.label.split("~");
  let currX = x;
  splits.forEach((split, i) => {
    let span = g.appendSVG("tspan", {
      ...txt,
      x: currX,
      y,
      text: split,
      "text-decoration": i % 2 ? "overline" : "none",
    });
    currX += span.getBBox().width;
  });

  // If text is rotated, rotate now
  if (pin.direction.any("up", "down")) {
    g.setAttributes({
      transform: `rotate(90, ${pin.textAnchor[0]}, ${pin.textAnchor[1]})`,
    });
  }

  return g;
};

// Draw a pin and accompanying text, useful for most of the "normal" packages
const drawPin = (svg, pin) => {
  // If pin is undefined or incomplete, end here
  if (typeof pin == "undefined") return;
  if (typeof pin.pinAnchor == "undefined") return;

  const g = svg.appendSVG("g", {});
  // First, the pin and pin numbers
  let [x, y] = pin.pinAnchor;
  let [tx, ty] = pin.textAnchor;

  // Option 1: pin is exposed thermal pad (EP)
  if (pin.style == "EP") {
    let [width, height] = pin.padSize;
    g.appendSVG("rect", {
      ...lines,
      x: x - width / 2,
      y: y - height / 2,
      width,
      height,
    });
    // Do not include pin number for thermal pads
  }

  // Option 2: plain rectangular pads
  else if (pin.style.any("out", "in")) {
    let rectObj = {};
    let textObj = {};
    if (pin.direction == "left") {
      rectObj = { ...lines, x: x - 15, y: y - 5, width: 15, height: 10 };
      textObj = {
        ...txt,
        x: tx,
        y: ty,
        "text-anchor": "end",
        text: String(pin.number),
      };
    } else if (pin.direction == "down") {
      rectObj = { ...lines, x: x - 5, y, width: 10, height: 15 };
      textObj = {
        ...txt,
        x: tx,
        y: ty,
        "text-anchor": "start",
        text: String(pin.number),
        transform: `rotate(90,${tx},${ty})`,
      };
    } else if (pin.direction == "right") {
      rectObj = { ...lines, x, y: y - 5, width: 15, height: 10 };
      textObj = {
        ...txt,
        x: tx,
        y: ty,
        "text-anchor": "start",
        text: String(pin.number),
      };
    } else if (pin.direction == "up") {
      rectObj = { ...lines, x: x - 5, y: y - 15, width: 10, height: 15 };
      textObj = {
        ...txt,
        x: tx,
        y: ty,
        "text-anchor": "end",
        text: String(pin.number),
        transform: `rotate(90,${tx},${ty})`,
      };
    }
    g.appendSVG("rect", rectObj);
    g.appendSVG("text", textObj);
  }

  // Option 3: side-view SIP pins
  else if (pin.style == "SIP") {
    g.appendSVG("path", {
      ...lines,
      d: `M ${x - 10} ${y} v 40 l 7 7 v 30 a 3 3 180 1 0 6 0 v -30 l 7 -7 v -40`,
    });
    g.appendSVG("text", {
      ...txt,
      x,
      y: y - 10,
      "text-anchor": "middle",
      text: String(pin.number),
    });
  }

  // Option 4: LGA pads
  else if (pin.style == "LGA") {
    g.appendSVG("rect", {
      ...lines,
      x: x - 7.5,
      y: y - 7.5,
      width: 15,
      height: 15,
    });
    let textAnchor = pin.direction.any("left", "up") ? "end" : "start";
    let transform = pin.direction.any("up", "down") ? { transform: `rotate(90,${tx},${ty})` } : {};
    g.appendSVG("text", {
      ...txt,
      ...transform,
      x: tx,
      y: ty,
      "text-anchor": textAnchor,
      text: String(pin.number),
    });
  }

  // Next, add the pin text
  if (pin.style.any("out", "in", "LGA")) {
    if (pin.direction.any("left", "up")) {
      pin.label = pin.label + "\xa0\xa0\xa0";
    } else if (pin.direction.any("right", "down")) {
      pin.label = "\xa0\xa0\xa0" + pin.label;
    }
  }
  drawText(svg, pin);
};

// Draw SOIC, SSOP, DIP, CDIP, partial DIP, DFN packages
// These always have 2n pins, n on left and right sides
// Pin style: sticky-outy legs
// Body style: rectangular, dot indicating pin 1
// Thermal pad sometimes
const drawSOIC = ({ svg, package, pins, thermalPads }) => {
  let isDFN = package.startsWith("DFN");
  let numPins = pins.length;
  let pinPitch = 20;
  let packageHeight = (numPins / 2 + 1) * pinPitch;
  let packageWidth = 80;
  if (package == "DIP-40") packageWidth = 120;
  if (package == "SSOP-10") packageWidth = 240;

  // Assign location, direction, style to every pin
  let pinData = [];
  pins.forEach((pin, i) => {
    if (package.endsWith("B") && i == 1) return;
    if (package.endsWith("C") && i == 2) return;
    let j = i % (numPins / 2);
    let x = -packageWidth / 2;
    let y = -packageHeight / 2 + pinPitch * (j + 1);
    let pinAnchor = isDFN ? [x + 15, y] : [x, y];
    let textAnchor = pinAnchor.add([-20, 0]);
    let direction = "left";
    if (j != i) {
      pinAnchor = pinAnchor.mult([-1, -1]);
      textAnchor = textAnchor.mult([-1, -1]);
      direction = "right";
    }
    pinData[i] = {
      number: i + 1,
      direction,
      style: isDFN ? "in" : "out",
      label: pin,
      pinAnchor,
      textAnchor,
    };
  });

  // Add thermal pads to pinData list
  if (thermalPads.length > 0) {
    pinData.push({
      number: numPins + 1,
      direction: "down",
      style: "EP",
      label: thermalPads[0],
      pinAnchor: [0, 0],
      textAnchor: [0, 0],
      padSize: isDFN ? [0.5 * packageWidth, 0.66 * packageHeight] : [0.66 * packageWidth, 0.66 * packageHeight],
    });
  }

  // Draw pins based on data compiled above
  pinData.forEach((pin) => drawPin(svg, pin));

  // Draw chip body
  svg.appendSVG("rect", {
    ...lines,
    x: -packageWidth / 2,
    y: -packageHeight / 2,
    width: packageWidth,
    height: packageHeight,
  });

  // Draw a pin-1 indicator dot and a semicircle indicating front
  svg.appendSVG("circle", {
    cx: isDFN ? -packageWidth / 2 + 25 : -packageWidth / 2 + 15,
    cy: -packageHeight / 2 + 15,
    r: 5,
    stroke: "black",
    fill: "#222222",
  });
  if (!isDFN) {
    svg.appendSVG("path", {
      ...lines,
      d: `M 10 ${-packageHeight / 2} A 10 10 180 0 1 -10 ${-packageHeight / 2}`,
    });
  }
};

// Draw PLCC, QFP, or QFN
// 4n pins, n on each side
// Pin style: SMT legs
// Body style: square, dot indicating pin 1
// Thermal pad sometimes
const drawQFP = ({ svg, package, pins, thermalPads }) => {
  let isQFN = package.includes("QFN");
  let numPins = pins.length;
  let pinPitch = 20;
  let packageHeight = (pinPitch * numPins) / 4 + 2 * pinPitch;
  let packageWidth = packageHeight;

  // Assign location, direction, style to every pin
  let pinData = [];
  pins.forEach((pin, i) => {
    let j = i % (numPins / 4);
    let obj = { number: i + 1, style: isQFN ? "in" : "out", label: pin };
    if (i < numPins / 4) {
      let x = -packageWidth / 2;
      let y = -packageHeight / 2 + pinPitch * (j + 1.5);
      let pinAnchor = isQFN ? [x + 15, y] : [x, y];
      let textAnchor = pinAnchor.add([-20, 0]);
      obj = { ...obj, direction: "left", pinAnchor, textAnchor };
    } else if (i < numPins / 2) {
      let x = -packageWidth / 2 + pinPitch * (j + 1.5);
      let y = packageHeight / 2;
      let pinAnchor = isQFN ? [x, y - 15] : [x, y];
      let textAnchor = pinAnchor.add([0, 20]);
      obj = { ...obj, direction: "down", pinAnchor, textAnchor };
    } else if (i < (3 * numPins) / 4) {
      let x = packageWidth / 2;
      let y = packageHeight / 2 - pinPitch * (j + 1.5);
      let pinAnchor = isQFN ? [x - 15, y] : [x, y];
      let textAnchor = pinAnchor.add([20, 0]);
      obj = { ...obj, direction: "right", pinAnchor, textAnchor };
    } else {
      let x = packageWidth / 2 - pinPitch * (j + 1.5);
      let y = -packageHeight / 2;
      let pinAnchor = isQFN ? [x, y + 15] : [x, y];
      let textAnchor = pinAnchor.add([0, -20]);
      obj = { ...obj, direction: "up", pinAnchor, textAnchor };
    }
    pinData[i] = obj;
  });

  // Add thermal pads to pinData list
  if (thermalPads.length > 0) {
    pinData.push({
      number: numPins + 1,
      direction: "right",
      style: "EP",
      label: thermalPads[0],
      pinAnchor: [0, 0],
      textAnchor: [0, 0],
      padSize: isQFN ? [packageWidth - 50, packageHeight - 50] : [0.66 * packageWidth, 0.66 * packageHeight],
    });
  }

  pinData.forEach((pin) => drawPin(svg, pin));

  // Draw chip body
  svg.appendSVG("rect", {
    ...lines,
    x: -packageWidth / 2,
    y: -packageHeight / 2,
    width: packageWidth,
    height: packageHeight,
  });

  // A dot indicating pin 1
  svg.appendSVG("circle", {
    cx: isQFN ? -packageWidth / 2 + 10 : -packageWidth / 2 + 15,
    cy: isQFN ? -packageHeight / 2 + 10 : -packageHeight / 2 + 30,
    r: 5,
    stroke: "black",
    fill: "#222222",
  });
};

// Draw SIP
// Side view instead of top-down view
// Thermal fin sometimes
const drawSIP = ({ svg, pins, thermalPads }) => {
  let numPins = pins.length;
  let pinPitch = 30;
  let packageHeight = 80;
  let packageWidth = pinPitch * numPins + pinPitch;

  // Assign location, direction, style to every pin
  let pinData = [];
  pins.forEach((pin, i) => {
    let x = -packageWidth / 2 + pinPitch + i * pinPitch;
    let pinAnchor = [x, -20];
    let textAnchor = [x, 70];
    pinData[i] = {
      number: i + 1,
      direction: "down",
      style: "SIP",
      label: pin,
      pinAnchor,
      textAnchor,
    };
  });

  // Add thermal fin if used
  if (thermalPads.length > 0) {
    pinData.push({
      number: numPins + 1,
      direction: "right",
      style: "EP",
      label: thermalPads[0],
      pinAnchor: [0, -140],
      textAnchor: [0, -140],
      padSize: [0.8 * packageWidth, packageHeight],
    });
  }

  pinData.forEach((pin) => drawPin(svg, pin));

  // Draw chip body
  svg.appendSVG("rect", {
    ...lines,
    x: -packageWidth / 2,
    y: -packageHeight - 20,
    width: packageWidth,
    height: packageHeight,
  });

  // Dot indicating pin 1
  svg.appendSVG("circle", {
    cx: -packageWidth / 2 + 25,
    cy: -packageHeight / 2 - 20,
    r: 10,
    stroke: "black",
    fill: "#222222",
  });
};

// Draw LFCSP, X2QFN
// Same pin style as DFN/QFN but not square
// LFCSP-10 has 3, 2, 3, 2 pins per side
// LFCSP-16 5 3 5 3
// X2QFN-12 4 2 4 2
const drawLFCSP = ({ svg, pins }) => {
  let numPins = pins.length;
  let pinPitch = 15;
  let pinData = [];
  let packageWidth, packageHeight, scale, pinsPerSide;
  if (numPins == 10) {
    pinsPerSide = [3, 2, 3, 2];
    packageWidth = 5 * pinPitch;
    packageHeight = 4 * pinPitch;
  } else if (numPins == 12) {
    pinsPerSide = [4, 2, 4, 2];
    packageWidth = 2 * pinPitch + 35;
    packageHeight = 4 * pinPitch + 5;
  } else {
    pinsPerSide = [5, 3, 5, 3];
    packageWidth = 6 * pinPitch;
    packageHeight = 6 * pinPitch;
  }

  let i = -1;
  while (++i < pinsPerSide[0]) {
    let x = -packageWidth / 2;
    let y = (-pinsPerSide[0] / 2 + i + 0.5) * pinPitch;
    let pinAnchor = [x + 15, y];
    let textAnchor = [x - 5, y];
    pinData[i] = {
      number: i + 1,
      style: "in",
      label: pins[i],
      direction: "left",
      pinAnchor,
      textAnchor,
    };
  }
  i--;
  while (++i < pinsPerSide[0] + pinsPerSide[1]) {
    let j = i - pinsPerSide[0];
    let x = (-pinsPerSide[1] / 2 + j + 0.5) * pinPitch;
    let y = packageHeight / 2;
    let pinAnchor = [x, y - 15];
    let textAnchor = [x, y + 5];
    pinData[i] = {
      number: i + 1,
      style: "in",
      label: pins[i],
      direction: "down",
      pinAnchor,
      textAnchor,
    };
  }
  i--;
  while (++i < pinsPerSide[0] + pinsPerSide[1] + pinsPerSide[2]) {
    let j = i - (pinsPerSide[0] + pinsPerSide[1]);
    let x = packageWidth / 2;
    let y = (pinsPerSide[0] / 2 - j - 0.5) * pinPitch;
    let pinAnchor = [x - 15, y];
    let textAnchor = [x + 5, y];
    pinData[i] = {
      number: i + 1,
      style: "in",
      label: pins[i],
      direction: "right",
      pinAnchor,
      textAnchor,
    };
  }
  i--;
  while (++i < pinsPerSide[0] + pinsPerSide[1] + pinsPerSide[2] + pinsPerSide[3]) {
    let j = i - (pinsPerSide[0] + pinsPerSide[1] + pinsPerSide[2]);
    let x = (pinsPerSide[1] / 2 - j - 0.5) * pinPitch;
    let y = -packageHeight / 2;
    let pinAnchor = [x, y + 15];
    let textAnchor = [x, y - 5];
    pinData[i] = {
      number: i + 1,
      style: "in",
      label: pins[i],
      direction: "up",
      pinAnchor,
      textAnchor,
    };
  }

  pinData.forEach((pin) => drawPin(svg, pin));

  // Draw chip body and indicator dot
  svg.appendSVG("rect", {
    ...lines,
    x: -packageWidth / 2,
    y: -packageHeight / 2,
    width: packageWidth,
    height: packageHeight,
  });
  svg.appendSVG("circle", {
    cx: -packageWidth / 2 + 24,
    cy: -packageHeight / 2 + 24,
    r: 5,
    stroke: "black",
    fill: "#222222",
  });
};

// Draw LGA packages
// Rectangular pads inset from package edge
// No thermal pads
const drawLGA = ({ svg, pins }) => {
  let numPins = pins.length;
  let pinPitch = 20;
  let pinData = [];
  let packageWidth, packageHeight, pinsPerSide;
  if (numPins == 12) {
    packageWidth = 4 * pinPitch;
    packageHeight = 4 * pinPitch;
    pinsPerSide = [4, 2, 4, 2];
  } else if (numPins == 14) {
    packageWidth = 3 * pinPitch;
    packageHeight = 6 * pinPitch;
    pinsPerSide = [6, 1, 6, 1];
  } else if (numPins == 16) {
    packageWidth = 5 * pinPitch;
    packageHeight = 5 * pinPitch;
    pinsPerSide = [5, 3, 5, 3];
  } else if (numPins == 28) {
    packageWidth = 8 * pinPitch;
    packageHeight = 8 * pinPitch;
    pinsPerSide = [8, 6, 8, 6];
  } else if (numPins == 8) {
    packageWidth = 3 * pinPitch;
    packageHeight = 4 * pinPitch;
    pinsPerSide = [4, 0, 4, 0];
  } else {
    packageWidth = 10;
    packageHeight = 10;
    pinsPerSide = [0, 0, 0, 0];
  }

  let i = -1;
  while (++i < pinsPerSide[0]) {
    let x = -packageWidth / 2 + pinPitch / 2;
    let y = -packageHeight / 2 + pinPitch / 2 + pinPitch * i;
    let pinAnchor = [x, y];
    let textAnchor = [x - 12, y];
    pinData[i] = {
      number: i + 1,
      style: "LGA",
      label: pins[i],
      direction: "left",
      pinAnchor,
      textAnchor,
    };
  }
  i--;
  while (++i < pinsPerSide[0] + pinsPerSide[1]) {
    let j = i % pinsPerSide[0];
    let x = -packageWidth / 2 + (3 * pinPitch) / 2 + j * pinPitch;
    let y = packageHeight / 2 - pinPitch / 2;
    let pinAnchor = [x, y];
    let textAnchor = [x, y + 12];
    pinData[i] = {
      number: i + 1,
      style: "LGA",
      label: pins[i],
      direction: "down",
      pinAnchor,
      textAnchor,
    };
  }
  i--;
  while (++i < pinsPerSide[0] + pinsPerSide[1] + pinsPerSide[2]) {
    let j = i % (pinsPerSide[0] + pinsPerSide[1]);
    let x = packageWidth / 2 - pinPitch / 2;
    let y = packageHeight / 2 - pinPitch / 2 - pinPitch * j;
    let pinAnchor = [x, y];
    let textAnchor = [x + 12, y];
    pinData[i] = {
      number: i + 1,
      style: "LGA",
      label: pins[i],
      direction: "right",
      pinAnchor,
      textAnchor,
    };
  }
  i--;
  while (++i < pinsPerSide[0] + pinsPerSide[1] + pinsPerSide[2] + pinsPerSide[3]) {
    let j = i % (pinsPerSide[0] + pinsPerSide[1] + pinsPerSide[2]);
    let x = packageWidth / 2 - (3 * pinPitch) / 2 - j * pinPitch;
    let y = -packageHeight / 2 + pinPitch / 2;
    let pinAnchor = [x, y];
    let textAnchor = [x, y - 12];
    pinData[i] = {
      number: i + 1,
      style: "LGA",
      label: pins[i],
      direction: "up",
      pinAnchor,
      textAnchor,
    };
  }

  pinData.forEach((pin) => drawPin(svg, pin));

  // Draw package body
  // Should LGA packges have a dot indicator?
  svg.appendSVG("rect", {
    ...lines,
    x: -packageWidth / 2,
    y: -packageHeight / 2,
    width: packageWidth,
    height: packageHeight,
  });
};

// Draw HLGA-6 package
// Easier to do on its own I think
const drawHLGA6 = ({ svg, pins }) => {
  let pinPitch = 20;
  let packageHeight = 3.5 * pinPitch;
  let packageWidth = 2.5 * pinPitch;
  svg.appendSVG("rect", {
    ...lines,
    x: -packageWidth / 2,
    y: -packageHeight / 2,
    width: packageWidth,
    height: packageHeight,
  });
  let r = 7;
  let anchors = [
    [-0.6 * pinPitch, -pinPitch, -packageWidth / 2 - 5, -pinPitch],
    [-0.6 * pinPitch, 0, -packageWidth / 2 - 5, 0],
    [-0.6 * pinPitch, pinPitch, -packageWidth / 2 - 5, pinPitch],
    [0.6 * pinPitch, -pinPitch, packageWidth / 2 + 5, -pinPitch],
    [0.6 * pinPitch, 0, packageWidth / 2 + 5, 0],
    [0.6 * pinPitch, pinPitch, packageWidth / 2 + 5, pinPitch],
  ];
  anchors.forEach((anchor, i) => {
    let [cx, cy, ...textAnchor] = anchor;
    svg.appendSVG("circle", { ...lines, r, cx, cy });
    drawText(svg, {
      label: i < 3 ? pins[i] + `\xa0\xa0${i}` : `${i}\xa0\xa0` + pins[i],
      textAnchor,
      direction: i < 3 ? "left" : "right",
    });
  });
};

// Draw X2SON-8 package
// This one's weird enought that I don't think drawPin() will help
const drawX2SON8 = ({ svg, pins }) => {
  let pinPitch = 15;
  let packageWidth = 4 * pinPitch;
  let packageHeight = 6 * pinPitch;
  svg.appendSVG("rect", {
    ...lines,
    x: -packageWidth / 2,
    y: -packageHeight / 2,
    width: packageWidth,
    height: packageHeight,
  });
  // Pin 1
  svg.appendSVG("path", {
    ...lines,
    d: `M ${-packageWidth / 2} ${-2 * pinPitch} l 0 -8 20 0 0 8 -8 8 -12 0 z`,
  });
  drawText(svg, {
    label: pins[0] + "\xa0\xa01",
    textAnchor: [-packageWidth / 2 - 10, -2 * pinPitch],
    direction: "left",
  });
  // Pin 2
  svg.appendSVG("path", {
    ...lines,
    d: `M ${-packageWidth / 2} -8 l 12 0 8 8 -8 8 -12 0 z`,
  });
  drawText(svg, {
    label: pins[1] + "\xa0\xa02",
    textAnchor: [-packageWidth / 2 - 10, 0],
    direction: "left",
  });
  // Pin 3
  svg.appendSVG("path", {
    ...lines,
    d: `M ${-packageWidth / 2} ${2 * pinPitch + 8} l 20 0 0 -8 -8 -8 -12 0 z`,
  });
  drawText(svg, {
    label: pins[2] + "\xa0\xa03",
    textAnchor: [-packageWidth / 2 - 10, 2 * pinPitch],
    direction: "left",
  });
  // Pin 4
  svg.appendSVG("path", {
    ...lines,
    d: `M 0 ${pinPitch + 12} l 12 -12 -12 -12 -12 12 z`,
  });
  drawText(svg, {
    label: "4\xa0\xa0" + pins[3],
    textAnchor: [0, packageHeight / 2 + 10],
    direction: "down",
  });
  // Pin 5
  svg.appendSVG("path", {
    ...lines,
    d: `M ${packageWidth / 2} ${2 * pinPitch + 8} l -20 0 0 -8 8 -8 12 0 z`,
  });
  drawText(svg, {
    label: "5\xa0\xa0" + pins[4],
    textAnchor: [packageWidth / 2 + 10, 2 * pinPitch],
    direction: "right",
  });
  // Pin 6
  svg.appendSVG("path", {
    ...lines,
    d: `M ${packageWidth / 2} -8 l -12 0 -8 8 8 8 12 0 z`,
  });
  drawText(svg, {
    label: "6\xa0\xa0" + pins[5],
    textAnchor: [packageWidth / 2 + 10, 0],
    direction: "right",
  });
  // Pin 7
  svg.appendSVG("path", {
    ...lines,
    d: `M ${packageWidth / 2} ${-2 * pinPitch} l 0 -8 -20 0 0 8 8 8 12 0 z`,
  });
  drawText(svg, {
    label: "7\xa0\xa0" + pins[6],
    textAnchor: [packageWidth / 2 + 10, -2 * pinPitch],
    direction: "right",
  });
  // Pin 8
  svg.appendSVG("path", {
    ...lines,
    d: `M 0 ${-pinPitch + 12} l 12 -12 -12 -12 -12 12 z`,
  });
  drawText(svg, {
    label: pins[7] + "\xa0\xa08",
    textAnchor: [0, -packageHeight / 2 - 10],
    direction: "up",
  });
};

// Draw AQFN-73
// Oh god why did I put this one in
// Columns numbered 1 thru 24
// Rows marked ABCDEFGHJKLMNPRTUVWY, AA, AB, AC, AD
// Rows C thru AC are evenly spaced, columns 2 thru 22 are evenly spaced
const drawAQFN73 = ({ svg, pins, thermalPads }) => {
  let pinPitch = 18;
  let packageWidth = 28 * pinPitch;
  let packageHeight = 28 * pinPitch;
  let r = 8;
  const rowNames = [..."ABCDEFGHJKLMNPRTUVWY", "AA", "AB", "AC", "AD"];
  const coords = "a";
  svg.appendSVG("rect", {
    ...lines,
    x: -packageWidth / 2,
    y: -packageHeight / 2,
    width: packageWidth,
    height: packageHeight,
  });
  svg.appendSVG("circle", {
    cx: -12 * pinPitch,
    cy: -12 * pinPitch,
    r: 10,
    fill: "#222222",
    stroke: "black",
  });
  pins.forEach((pin, i) => {
    let [row, col] = aQFN73[i];
    let cx = -packageWidth / 2 + 2 * pinPitch + pinPitch * col;
    cx += col == 0 ? -pinPitch : col == 22 ? pinPitch : col == 23 ? 2 * pinPitch : 0;
    let cy = -packageHeight / 2 + 3 * pinPitch + pinPitch * row;
    cy += row == 0 ? -2 * pinPitch : row == 1 ? -pinPitch : row == 23 ? pinPitch : 0;
    svg.appendSVG("circle", { ...lines, cx, cy, r });
    let label, textAnchor, direction;
    if (col < 2) {
      label = pin + `${rowNames[row]}${col + 1}`.padStart(5, "\xa0");
      textAnchor = [-packageWidth / 2 - 5, cy];
      direction = "left";
    } else if (col >= 22) {
      label = `${rowNames[row]}${col + 1}`.padEnd(5, "\xa0") + pin;
      textAnchor = [packageWidth / 2 + 5, cy];
      direction = "right";
    } else if (row < 2) {
      label = pin + `${rowNames[row]}${col + 1}`.padStart(5, "\xa0");
      textAnchor = [cx, -packageHeight / 2 - 5];
      direction = "up";
    } else {
      label = `${rowNames[row]}${col + 1}`.padEnd(5, "\xa0") + pin;
      textAnchor = [cx, packageHeight / 2 + 5];
      direction = "down";
    }
    drawText(svg, { label, textAnchor, direction });
  });
  svg.appendSVG("rect", {
    ...lines,
    x: -packageWidth * 0.33,
    y: -packageHeight * 0.33,
    width: packageWidth * 0.66,
    height: packageHeight * 0.66,
  });
  drawText(svg, {
    label: thermalPads[0],
    textAnchor: [0, 0],
    style: "EP",
    direction: "left",
  });
};

// Draw TO-71 metal can package
// Body: Draw full circle, erase portion, draw tab at that portion
const drawTO71 = ({ svg, pins }) => {
  let canRadius = 60;
  let pinRadius = 8;
  const defs = svg.appendSVG("defs", {});
  const maskA = defs.appendSVG("mask", { id: "trim-can" });
  maskA.appendSVG("rect", {
    x: -500,
    y: -500,
    width: 1000,
    height: 1000,
    stroke: "none",
    fill: "white",
  });
  maskA.appendSVG("rect", {
    x: 0,
    y: -1.5 * pinRadius,
    width: 1.2 * canRadius,
    height: 3 * pinRadius,
    stroke: "none",
    fill: "black",
  });
  const maskB = defs.appendSVG("mask", { id: "trim-tab" });
  maskB.appendSVG("rect", {
    x: -500,
    y: -500,
    width: 1000,
    height: 1000,
    stroke: "none",
    fill: "white",
  });
  maskB.appendSVG("circle", {
    cx: 0,
    cy: 0,
    r: canRadius,
    stroke: "none",
    fill: "black",
  });

  svg.appendSVG("circle", {
    ...lines,
    cx: 0,
    cy: 0,
    r: canRadius,
    mask: "url(#trim-can)",
    transform: "rotate(135,0,0)",
  });
  svg.appendSVG("rect", {
    ...lines,
    x: 0,
    y: -1.5 * pinRadius,
    rx: 0.6 * pinRadius,
    width: 1.3 * canRadius,
    height: 3 * pinRadius,
    mask: "url(#trim-tab)",
    transform: "rotate(135,0,0)",
  });
  svg.appendSVG("circle", { ...lines, cx: 0, cy: 0, r: 0.82 * canRadius });

  // Pins
  svg.appendSVG("circle", {
    ...lines,
    id: "can-pin",
    cx: -0.4 * canRadius,
    cy: 0,
    r: pinRadius,
  });
  svg.appendSVG("use", { href: "#can-pin", transform: "rotate(45,0,0)" });
  svg.appendSVG("use", { href: "#can-pin", transform: "rotate(90,0,0)" });
  svg.appendSVG("use", { href: "#can-pin", transform: "rotate(180,0,0)" });
  svg.appendSVG("use", { href: "#can-pin", transform: "rotate(225,0,0)" });
  svg.appendSVG("use", { href: "#can-pin", transform: "rotate(270,0,0)" });
  drawText(
    svg,
    {
      label: pins[0] + "\xa0\xa01",
      direction: "left",
      textAnchor: [-canRadius - 5, 0],
    },
    { transform: "rotate(30,0,0)" }
  );
  drawText(
    svg,
    {
      label: pins[1] + "\xa0\xa02",
      direction: "left",
      textAnchor: [-canRadius - 5, 0],
    },
    { transform: "rotate(45,0,0)" }
  );
  drawText(
    svg,
    {
      label: pins[2] + "\xa0\xa03",
      direction: "left",
      textAnchor: [-canRadius - 5, 0],
    },
    { transform: "rotate(60,0,0)" }
  );
  drawText(
    svg,
    {
      label: "5\xa0\xa0" + pins[3],
      direction: "right",
      textAnchor: [canRadius + 5, 0],
    },
    { transform: "rotate(30,0,0)" }
  );
  drawText(
    svg,
    {
      label: "6\xa0\xa0" + pins[4],
      direction: "right",
      textAnchor: [canRadius + 5, 0],
    },
    { transform: "rotate(45,0,0)" }
  );
  drawText(
    svg,
    {
      label: "7\xa0\xa0" + pins[5],
      direction: "right",
      textAnchor: [canRadius + 5, 0],
    },
    { transform: "rotate(60,0,0)" }
  );
};

// Draw HSOP-36
// Much like the drawSOIC() method, but with some thermal fins mid-package
const drawHSOP = ({ svg, pins, thermalPads }) => {
  let numPins = pins.length;
  let pinPitch = 20;
  let packageHeight = 22 * pinPitch;
  let packageWidth = 80;

  // Assign location, direction, style to every pin
  let pinData = [];
  pins.forEach((pin, i) => {
    let x, y, pinAnchor, textAnchor, direction;
    if (i < 9) {
      x = -packageWidth / 2;
      y = -10 * pinPitch + i * pinPitch;
      pinAnchor = [x, y];
      textAnchor = pinAnchor.add([-20, 0]);
      direction = "left";
    } else if (i < 18) {
      x = -packageWidth / 2;
      y = -7 * pinPitch + i * pinPitch;
      pinAnchor = [x, y];
      textAnchor = pinAnchor.add([-20, 0]);
      direction = "left";
    } else if (i < 27) {
      x = packageWidth / 2;
      y = 10 * pinPitch - (i - 18) * pinPitch;
      pinAnchor = [x, y];
      textAnchor = pinAnchor.add([20, 0]);
      direction = "right";
    } else {
      x = packageWidth / 2;
      y = 7 * pinPitch - (i - 18) * pinPitch;
      pinAnchor = [x, y];
      textAnchor = pinAnchor.add([20, 0]);
      direction = "right";
    }
    pinData[i] = {
      number: i + 1,
      direction,
      style: "out",
      label: pin,
      pinAnchor,
      textAnchor,
    };
  });

  // Draw pins based on data compiled above
  pinData.forEach((pin) => drawPin(svg, pin));

  // Draw thermal fins
  svg.appendSVG("rect", {
    ...lines,
    x: -packageWidth / 2 - 15,
    y: -1.25 * pinPitch,
    width: 15,
    height: 2.5 * pinPitch,
  });
  drawText(svg, {
    ...txt,
    label: thermalPads[0],
    textAnchor: [-packageWidth / 2 - 20, 0],
    direction: "left",
  });
  svg.appendSVG("rect", {
    ...lines,
    x: packageWidth / 2,
    y: -1.25 * pinPitch,
    width: 15,
    height: 2.5 * pinPitch,
  });
  drawText(svg, {
    ...txt,
    label: thermalPads[1],
    textAnchor: [packageWidth / 2 + 20, 0],
    direction: "right",
  });

  // Draw chip body
  svg.appendSVG("rect", {
    ...lines,
    x: -packageWidth / 2,
    y: -packageHeight / 2,
    width: packageWidth,
    height: packageHeight,
  });

  // A dot indicating pin 1, a semicircle indicating front
  svg.appendSVG("circle", {
    cx: -packageWidth / 2 + 15,
    cy: -packageHeight / 2 + 15,
    r: 5,
    stroke: "black",
    fill: "#222222",
  });

  svg.appendSVG("path", {
    ...lines,
    d: `M 10 ${-packageHeight / 2} A 10 10 180 0 1 -10 ${-packageHeight / 2}`,
  });
};

// Okay, here it is, the big one:
// SPMCC-027
// Thin pins on left, thick pins on right (pretend there's only two pin thicknesses)
// Three different pin spacings: left side, top right, bottom right
// Unconventional numbering as well
const drawSPMCC = ({ svg, pins }) => {
  let leftPinPitch = 15;
  let packageWidth = 100;
  let packageHeight = 21 * leftPinPitch;

  pins.forEach((pin, i) => {
    // Left side pins:
    if (i < 20) {
      let x = -packageWidth / 2 - 35;
      if ([8, 9, 12, 13, 16, 17].includes(i)) {
        x += 20;
      }
      let y = -9.5 * leftPinPitch + i * leftPinPitch;
      svg.appendSVG("rect", { ...lines, x, y: y - 3, width: 15, height: 6 });
      drawText(
        svg,
        {
          label: pin + String(i + 1).padStart(4, "\xa0"),
          textAnchor: [-packageWidth / 2 - 40, y],
          direction: "left",
        },
        { "font-size": 12 }
      );
    } else if (i < 23) {
      // Pins 21 - 23, top right
      let x = packageWidth / 2;
      let y = -packageHeight / 2 + 30 * (i - 19);
      svg.appendSVG("rect", { ...lines, x, y: y - 5, width: 15, height: 10 });
      drawText(svg, {
        label: String(i + 1).padEnd(4, "\xa0") + pin,
        textAnchor: [x + 20, y],
        direction: "right",
      });
    } else {
      // Pins 24-27, bottom right
      let x = packageWidth / 2;
      let y = -20 + 52 * (i - 23);
      svg.appendSVG("rect", { ...lines, x, y: y - 7.5, width: 15, height: 15 });
      drawText(svg, {
        label: String(i + 1).padEnd(4, "\xa0") + pin,
        textAnchor: [x + 20, y],
        direction: "right",
      });
    }
  });

  // Draw body
  svg.appendSVG("path", {
    ...lines,
    d: `M ${packageWidth / 2} ${-packageHeight / 2} v ${packageHeight} H 10 v -10 a 10 10 180 0 0 -20 0 v 10 H ${-packageWidth / 2 - 20} V ${
      8 * leftPinPitch
    } h 20 v ${-2 * leftPinPitch} h -20 v ${-2 * leftPinPitch} h 20 v ${-2 * leftPinPitch} h -20 v ${-2 * leftPinPitch} h 20 v ${-2 * leftPinPitch} h -20 V ${
      -packageHeight / 2
    } H -10 v 10 a 10 10 180 0 0 20 0 v -10 z`,
  });
};

// Add a resize function to use when diagram is attached to document
const resize = (svg, padding = 10, centered = false) => {
  let { x, y, width, height } = svg.getBBox();
  if (centered) {
    let biggestSide = Math.max(Math.abs(x), Math.abs(y), width + x, height + y);
    svg.setAttributes({
      viewBox: `${biggestSide - padding} ${biggestSide - padding} ${2 * (biggestSide + padding)} ${2 * (biggestSide + padding)}`,
    });
  } else {
    svg.setAttributes({
      viewBox: `${x - padding} ${y - padding} ${width + 2 * padding} ${height + 2 * padding}`,
    });
  }
};

// Function to draw the diagram of whatever chip we have
const drawPinout = (root, package, pins, thermalPads) => {
  const svg = newSVG("svg", {
    viewBox: `-255 -255 510 510`,
    width: "500px",
    height: "500px",
    style: "font: 16px monospace; dominant-baseline: central; white-space: pre",
    class: "svg",
  });
  svg.style.maxWidth = "90%";
  root.appendChild(svg);

  let args = { svg, package, pins, thermalPads };

  if (package.startsWithAny("SOIC", "SSOP", "DFN") || package.includes("DIP")) {
    drawSOIC(args);
  } else if (package.startsWith("SIP")) {
    drawSIP(args);
  } else if (package.includes("QFP-") || package.startsWithAny("PLCC", "QFN", "HQFN")) {
    drawQFP(args);
  } else if (package.startsWith("SIP")) {
    drawSIP(args);
  } else if (package.startsWith("LFCSP") || package.startsWith("X2QFN")) {
    drawLFCSP(args);
  } else if (package.startsWith("LGA")) {
    drawLGA(args);
  } else if (package.startsWith("X2SON")) {
    drawX2SON8(args);
  } else if (package.startsWith("HLGA")) {
    drawHLGA6(args);
  } else if (package.startsWith("aQFN")) {
    drawAQFN73(args);
  } else if (package.startsWith("TO-")) {
    drawTO71(args);
  } else if (package.startsWith("HSOP")) {
    drawHSOP(args);
  } else if (package.startsWith("SPMCC")) {
    drawSPMCC(args);
  } else {
    svg.appendSVG("text", { ...txt, x: 0, y: 0, text: "NOT IMPLEMENTED" });
  }

  resize(svg);

  return svg;
};
