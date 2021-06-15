// Main script -- assume ML5.js libraries have been loaded, the RNN for chip descriptions has been loaded, and pin names have been loaded

// Generate a compact representation of all the part specs so it can be permalinked
const makePermalink = (id, package, pinLabels, thermalPadLabels) => {
  const pinMap = pinLabels.map((label, i) => {
    let j = i - (i % 8) + 8;
    let index = Object.keys(pinsInBlocks[j]).indexOf(label);
    // Sometimes the index isn't in the original list! In that case we encode the text
    return index == -1 ? label : index;
  });
  const thermMap = thermalPadLabels.map((label) => pinLabels.indexOf(label));
  console.log(JSON.stringify({ id, package, pinMap, thermMap }));
  return JSON.stringify({ id, package, pinMap, thermMap });
};

// Parse a permalink parameter
const readPermalink = (permalink) => {
  try {
    let { id, package, pinMap, thermMap } = JSON.parse(
      LZString.decompressFromEncodedURIComponent(permalink)
    );
    // Todo: call a portion of generatePage() that I need to spin off into its own method
  } catch {
    throw "Reading permalink failed.";
  }
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

const generatePage = (desc) => {
  // As soon as we have a description, start generating another, to speed up local refresh times!
  let desc2 = getDesc(descRNN).then((newDesc) => {
    return newDesc;
    // Todo: do something with this
  });
  // Make ID for rando chip
  let id = randoID();
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

  // Assign labels to each chip pin
  let pinLabels = [];
  let thermalPadLabels = [];
  for (let pin = 0; pin < numPins; pin++) {
    // Identify which block of pins labels to sample from
    pinBlock = String(pin - (pin % 8) + 8);
    let label = sampleFromDict(pinsInBlocks[pinBlock]);
    // Some labels have waaaay too many functions, so pick at most two
    if (label.split("/").length > 2) {
      let newLabel = [sample(label.split("/")), sample(label.split("/"))];
      label = newLabel.join("/");
    }
    pinLabels.push(label);
  }
  // If none of the pins are labelled GND/Vss/VSS, name one GND
  if (!pinLabels.includesAny("GND", "Vss", "VSS")) {
    let GNDpin = Math.floor(Math.random() * pinLabels.length);
    pinLabels[GNDpin] = "GND";
  }
  // Give the thermal pins random labels from existing pins
  for (let i = 0; i < thermalPads; i++) {
    thermalPadLabels.push(sample(pinLabels));
  }

  // Publish the part specs
  $("root").className = "modalOff";
  $("chipID").innerText = id;
  $("description").innerText = `${desc}, ${package}`;

  const $img = document.createElement("img");
  $img.src = `./packages/${picture}.webp`;
  $img.alt = `${package} rendering`;
  $("render").appendChild($img);
  if (package.startsWith("aQFN")) {
    const trademark = document.createElement("figcaption");
    trademark.innerText =
      'Apparently "aQFN" is a registered trademark of Nordic Semiconductor.';
    $("render").appendChild(trademark);
  }

  // Draw the pinout
  drawPinout($("pinout"), picture, pinLabels, thermalPadLabels);

  // TODO: Generate a permalink
  const params = { id, package, pinLabels, thermalPadLabels, picture };
  console.log(JSON.stringify(params));

  a = makePermalink(id, package, pinLabels, thermalPadLabels);
};
