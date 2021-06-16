// Given a package name, identify how many pins it has. (Usually easy but not 100% straightforward)
const getPins = (package) => {
  // Avoid counting the "2" in "X2QFN" and "X2SON"
  let packageEdit = package.replace("X2", "");
  // Strip all non-digit characters and parse the remaining integer
  let numPins = parseInt(packageEdit.replace(/\D/g, ""));

  // If chip is special in some way, adjust the pin count
  // MLPQ-32 has THREE thermal pads; if pin 1 is in upper left, HS1 is quadrant II, HS2 quadrant III, HS3 quadrants I and IV
  // PQFN-22 has 13 pin labels but 26 pads; numbering starts in upper-RIGHT https://www.onsemi.com/pdf/datasheet/fdmf3039-d.pdf
  // PQFN-44 has 27 pin labels but 31 pads; numbering starts in lower-left https://www.infineon.com/dgdl/ir4302.pdf?fileId=5546d462533600a4015355d602a9181d
  // HSOP-36 has 36 pins and 2 unnumbered fins
  // TO-71 has 6 pins but they are numbered 1 2 3 5 6 7
  if (package == "PQFN-22") numPins = 13;
  if (package == "PQFN-44") numPins = 27;
  if (package == "HSOP-36") numPins = 36;
  if (package == "TO-71") numPins = 6;
  return numPins;
};

// Given a package name and pin count, return the package class; that is, which prefix to use for the rendered image
const getPicture = (package) => {
  const numPins = getPins(package);
  const split = package.split("-");
  if (package.startsWith("aQFN")) split[0] = "aQFN";
  else if (package.startsWith("CDIP")) split[0] = "CDIP";
  else if (package.includes("DFN")) split[0] = "DFN";
  else if (package == "LFCSP-8") split[0] = "DFN";
  else if (package.startsWith("DIP")) split[0] = "DIP";
  // else if (package.startsWith("DRQFN")) split[0] = "DRQFN";
  else if (package.startsWith("PQFN")) split[0] = "PQFN";
  else if (package.startsWith("X2QFN")) split[0] = "X2QFN";
  else if (package.includesAny("QFN", "QFPN")) split[0] = "QFN";
  else if (package.startsWith("LFCSP") && numPins > 16) split[0] = "QFN";
  else if (package.startsWith("MLPQ") && numPins > 32) split[0] = "QFN";
  else if (package.startsWith("HLGA")) split[0] = "HLGA";
  else if (package.startsWith("HSOP")) split[0] = "HSOP";
  else if (package.startsWith("LFCSP") && numPins <= 16) split[0] = "LFCSP";
  else if (package.startsWith("LGA")) split[0] = "LGA";
  else if (package.startsWith("MLPQ")) split[0] = "MLPQ";
  else if (package.startsWith("PLCC")) split[0] = "PLCC";
  else if (package.includes("QFP-")) split[0] = "QFP";
  else if (package.startsWith("SIP")) split[0] = "SIP";
  else if (package.includes("SSOP")) split[0] = "SSOP";
  else if (package.startsWith("X2SON")) split[0] = "X2SON";
  else if (package.includes("SO")) split[0] = "SOIC";
  else if (package.startsWith("SPMCC")) split[0] = "SPMCC";
  else if (package.startsWith("TO")) split[0] = "TO";
  else {
    throw "Package image not found";
  }
  return split.join("-");
};

// Given a package, identify if it can have a heatsink, and how many. Returns the number of heatsinks a package has, or -1 if heatsink is optional.
const getEP = (package) => {
  // First, if somehow an "-EP" package got in here, it obviously has a thermal pad
  if (package.endsWith("-EP")) return 1;

  // Other special cases: MLPQ-32 has THREE thermal pads. HSOP-36 has two.
  if (package == "MLPQ-32") return 3;
  if (package == "HSOP-36") return 2;

  const numPins = getPins(package);
  const packageClass = getPicture(package).split("-")[0];

  // Package classes that MUST have thermal pads: aQFN, DFN except 8 and 10, DRQFN, MLPQ, PQFN, QFN, SIP-9, SIP-15, LFCSP-8.
  if (
    ["aQFN", "DRQFN", "MLPQ", "PQFN", "QFN"].includes(packageClass) ||
    (packageClass == "DFN" && numPins > 10) ||
    (packageClass == "SIP" && numPins >= 9) ||
    package == "LFCSP-8"
  ) {
    return 1;
  }

  // Package classes that MIGHT have thermal pads: DFN-8, DFN-10, QFP-32, QFP-48, SOIC except 18 20 28 and 32, SSOP except 8 and 10,
  else if (
    (packageClass == "DFN" && [8, 10].includes(numPins)) ||
    (packageClass == "QFP" && [32, 48].includes(numPins)) ||
    (packageClass == "SOIC" && ![18, 20, 28, 32].includes(numPins)) ||
    (packageClass == "SSOP" && ![8, 10].includes(numPins))
  ) {
    return -1;
  }

  // Package classes that MUST NOT have thermal pads: CDIP, DIP, HLGA, HSOP, LFCSP except 8, LGA, PLCC, QFP except 32 and 48, SIP, SOIC-18, SOIC-20, SOIC-28, SOIC-32, SPMCC, SSOP-8, SSOP-10, TO, X2QFN, X2SON
  else {
    return 0;
  }
};

// Given a number of pins, generate the appropriate pin labels
const makePins = (package) => {
  let numPins = getPins(package);
  let numThermalPads = Math.max(getEP(package), 0);
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
  for (let i = 0; i < numThermalPads; i++) {
    thermalPadLabels.push(sample(pinLabels));
  }
  return [pinLabels, thermalPadLabels];
};
