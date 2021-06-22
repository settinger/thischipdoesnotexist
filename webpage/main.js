// Main script -- assume ML5.js libraries have been loaded, the RNN for chip descriptions has been loaded, and pin names have been loaded

// Take a pin's text and turn it into a number (more compact way to represent the same info, good for permalinking)
const encodePinMap = (label, i) => {
  let j = i - (i % 8) + 8;
  let index = Object.keys(pinsInBlocks[j]).indexOf(label);
  // Sometimes the index isn't in the original list! In that case we encode the text
  return index == -1 ? label : index;
};

const decodePinMap = (i, j) => {
  if (typeof i == "number") {
    let k = j - (j % 8) + 8;
    return Object.keys(pinsInBlocks[k])[i];
  } else if (typeof i == "string") {
    return i;
  } else {
    return "NC";
  }
};

// Generate a compact representation of all the part specs so it can be permalinked
const makePermalink = (id, description, package, pinLabels, thermalPadLabels) => {
  const pinMap = pinLabels.map(encodePinMap);
  const thermMap = thermalPadLabels.map((label) => pinLabels.indexOf(label));
  return JSON.stringify({ id, description, package, pinMap, thermMap });
};

// Generate a random ID, e.g. "TBN3329x"
// Put 2-4 letters at the front
// Append 3-5 numbers
// Sometimes insert a numeral at random
// Sometimes insert a letter at random
const randoID = () => {
  const alf = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];
  const αλφ = [..."αβγΔδεζθλμξπρΣστφχψΩω"]; // Cheeky; 1% of the time pick a letter from this list instead
  const num = [..."0123456789x"];
  let numLetters = 2 + Math.floor(Math.random() * 3);
  let numNumbers = 3 + Math.floor(Math.random() * 3);
  let id = "";
  for (let i = 0; i < numLetters; i++) {
    id += Math.random() > 0.01 ? sample(alf) : sample(αλφ);
  }
  for (let i = 0; i < numNumbers; i++) {
    id += sample(num);
  }
  if (Math.random() > 0.6) {
    let i = Math.floor(Math.random() * id.length);
    id = id.slice(0, i) + sample(alf) + id.slice(i);
  }
  if (Math.random() > 0.6) {
    let j = Math.floor(Math.random() * id.length);
    id = id.slice(0, j) + sample(num) + id.slice(j);
  }
  return id;
};

const generatePage = (description, stowedID) => {
  // Make ID for rando chip
  let id = stowedID || randoID();
  // Make vendor name for rando chip
  let vendor = useMarkov(markov);

  // Select the package of our new rando chip
  let package = sampleFromDict(packages);

  // Identify how many pins and thermal pads the base package has
  // If it has an optional pad, flip a coin to determine if it will have one
  let numPins = getPins(package);
  let thermalPads = getEP(package);
  if (thermalPads == -1) {
    if (Math.random() > 0.5) {
      thermalPads = 1;
      package += "-EP";
    }
  }

  // Identify which .webp file to use as the package render
  let picture = getPicture(package);

  let [pinLabels, thermalPadLabels] = makePins(package);

  renderPage({ id, vendor, description, package, picture, pinLabels, thermalPadLabels });
};

// Do this when the chip description RNN model is initialized
// If a chip is already rendered on-screen (i.e. from a permalink), generate and store a new description
// Else, generate and render a new description AND store one
const chipModelLoaded = async (error, model) => {
  $("refresh").onclick ??= (_) => clickRefresh(model);
  if (!$("root").className.includes("modal-on")) {
    getDescription(model).then((description) => {
      console.log(description);
      model.stowedID = randoID();
      $("refresh").innerText = `You may be interested in: ${model.stowedID}`;
      blink();
      model.hasDescriptionReady ||= description;
      // What if *this* description is already in demand by the time it becomes ready? Recurse!
      if ($("root").className.includes("modal-on")) {
        chipModelLoaded("", model);
      }
    });
  } else {
    let description = await getDescription(model);
    model.hasDescriptionReady = false;
    console.log(description);
    $("root").classList.remove("modal-on");
    generatePage(description, model.stowedID);
    // Begin generating a new description
    getDescription(model).then((description) => {
      console.log(description);
      model.stowedID = randoID();
      $("refresh").innerText = `You may be interested in: ${model.stowedID}`;
      blink();
      model.hasDescriptionReady ||= description;
      // What if *this* description is already in demand by the time it becomes ready? Recurse!
      if ($("root").className.includes("modal-on")) {
        chipModelLoaded("", model);
      }
    });
  }
};

// Given the necessary objects, render the chip on-screen
const renderPage = ({ id, vendor, description, package, picture, pinLabels, thermalPadLabels = [] }) => {
  $("chipID").innerText = id;
  $("vendor").innerText = vendor;
  $("description").innerText = description;
  $("package").innerText = package;
  $("render").clear();
  $("render").appendHTML("img", { src: `./packages/${picture}.webp`, alt: `${package} rendering` });
  if (package.startsWith("aQFN")) {
    $("render").appendHTML("figcaption", { text: 'Apparently "aQFN" is a registered trademark of Nordic Semiconductor.' });
  }
  $("root").classList.remove("modal-on");
  $("pinout").clear();
  drawPinout($("pinout"), picture, pinLabels, thermalPadLabels);
  $("refresh").innerText = "Look for similar parts";

  // Create bounce effect
  $("banner").classList.remove("bounce-in");
  $("banner").classList.add("bounce-in");
  window.setTimeout(() => {
    $("banner").classList.remove("bounce-in");
  }, 4000);

  // For out-of-stock mode: set the estimated lead time (there's no way to permalink a lead time, too lazy to add it to the LZString)
  if (!!$("long-wait")) {
    $("long-wait").innerText = (Math.random() * 80 + 50).toFixed(Math.floor(Math.random() * 3)) + " weeks";
  }

  // For in-stock mode: set the bulk pricing table (again, too lazy to add it to the LZString)
  if (!!$("price-table") && !!currencies) {
    $("price-table").clear();
    const priceHeader = $("price-table").appendHTML("thead", { innerHTML: "<th>Min Qty</th><th>Unit Price</th><th>Extended Cost</th>" });
    // Choose a currency
    let locale = sample(currencies);
    let currency = new Intl.NumberFormat(locale.locale, {
      style: "currency",
      currency: locale.code,
      numberingSystem: "latn",
    });
    let scaling = 10 ** locale.exchange;
    // Random number of rows between 1 and 5
    const numRows = Math.ceil(Math.random() * 4);
    let qty = 1;
    let unitPrice = (3 + Math.random() * 5) * scaling;
    let extCost = qty * unitPrice;
    for (let i = 0; i < numRows; i++) {
      let innerHTML = `<td>${qty}</td><td><span title="${locale.text}">${currency.format(unitPrice)}</span></td><td><span title="${
        locale.text
      }">${currency.format(extCost)}</span></td>`;
      const row = priceHeader.appendHTML("tr", { innerHTML });
      qty = Math.round(qty * 10 ** (1 + Math.random()));
      unitPrice *= 0.8 + 0.1 * Math.random();
      extCost = qty * unitPrice;
    }
  }

  // Generate permalink from properties
  const pinMap = pinLabels.map(encodePinMap);
  const thermMap = thermalPadLabels.map((label) => pinLabels.indexOf(label));
  const URL = LZString.compressToEncodedURIComponent(JSON.stringify({ id, vendor, description, package, pinMap, thermMap }));
  $("permalink").setAttributes({ href: "?ic=" + URL, innerText: "Permalink" });
};

// Intialize page by looking for a URL parameter
// If certain properties exist, pre-assign those properties to the display
// Only create new random values if one can't be gotten from the permalink
const makePageFromPermalink = async () => {
  let url = new URLSearchParams(window.location.search);
  if (!url.get("ic")) {
    throw "No LZString to parse";
  }
  let permalinkData = url.get("ic");
  let { id, vendor, package, pinMap, thermMap, description } = JSON.parse(LZString.decompressFromEncodedURIComponent(permalinkData) ?? "{}");
  let pinLabels = pinMap.map(decodePinMap);
  let thermalPadLabels = thermMap.map((n) => pinLabels[n] ?? "NC");
  let picture = getPicture(package);
  // Delay so it feels like a new page is actually loading
  await new Promise((x) => setTimeout(x, 500));
  renderPage({ id, vendor, description, package, picture, pinLabels, thermalPadLabels });
};

// A silly blink-alert that hopefully won't hurt my eyes (or anyone's)
const blink = () => {
  $("refresh").classList.remove("transition");
  $("refresh").classList.add("blink");
  window.setTimeout(() => {
    $("refresh").classList.add("transition");
  }, 20);
  window.setTimeout(() => {
    $("refresh").classList.remove("blink");
  }, 2000);
};

// When the "Replacement part" button is clicked, look for an existing stowed description
// If no stowed description is found, turn on modal and wait for one to become available
// Otherwise, display the stowed description and generate a fresh one to stow
// Before displaying the stowed one, show the loading page for a fraction of a second, for """authenticity"""
const clickRefresh = async (model) => {
  $("root").classList.add("modal-on");
  $("banner").classList.remove("bounce-in");
  if (!!model.hasDescriptionReady) {
    // Delay so it feels like a new page is actually loading
    await new Promise((x) => setTimeout(x, 500));

    let description = model.hasDescriptionReady;
    let id = model.stowedID;
    model.hasDescriptionReady = false;
    model.stowedID = false;
    generatePage(description, id);
    // Begin generating a new description
    getDescription(model).then((description) => {
      console.log(description);
      model.stowedID = randoID();
      $("refresh").innerText = `You may be interested in: ${model.stowedID}`;
      blink();
      model.hasDescriptionReady ||= description;
      // What if *this* description is already in demand by the time it becomes ready? Recurse!
      if ($("root").className.includes("modal-on")) {
        chipModelLoaded("", model);
      }
    });
  } else {
    $("root").className = "modal-on";
    // Assume a new description is forthcoming
  }
};

const init = async () => {
  try {
    await makePageFromPermalink();
  } catch (error) {
    console.log(error);
  }
  const chipPromise = new ml5.charRNN("./dataASCII", chipModelLoaded);
};
