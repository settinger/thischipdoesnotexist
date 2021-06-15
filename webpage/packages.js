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

const packages = {"aQFN-73":8,"CDIP-20":3,"CDIP-22":3,"CDIP-24":3,"DFN-10":33,"DFN-12":8,"DFN-14":7,"DFN-16":6,"DFN-6":32,"DFN-8":111,"DIP-14":95,"DIP-16":69,"DIP-18":9,"DIP-20":80,"DIP-22":1,"DIP-24":15,"DIP-28":59,"DIP-40":103,"DIP-8":495,"DIP-8B":17,"DIP-8C":29,"HLGA-6":1,"HQFN-16":1,"LFCSP-10":2,"LFCSP-16":11,"LFCSP-20":6,"LFCSP-24":6,"LFCSP-28":1,"LFCSP-32":7,"LFCSP-64":1,"LFCSP-72":4,"LFCSP-8":11,"LGA-12":3,"LGA-14":2,"LGA-16":6,"LGA-28":1,"LGA-8":7,"LQFP-32":74,"LQFP-44":19,"LQFP-48":149,"LQFP-64":266,"LQFP-80":10,"MLPQ-48":2,"MQFP-44":1,"MQFP-52":1,"MSOP-10":35,"MSOP-12":10,"MSOP-16":12,"MSOP-8":178,"PLCC-20":10,"PLCC-28":5,"PLCC-44":9,"PLCC-52":1,"PLCC-68":2,"QFN-12":6,"QFN-16":103,"QFN-20":69,"QFN-24":76,"QFN-28":50,"QFN-32":155,"QFN-36":2,"QFN-40":19,"QFN-44":47,"QFN-48":85,"QFN-56":5,"QFN-64":113,"QFN-8":3,"QSOP-16":18,"QSOP-24":8,"SIP-15":7,"SIP-8":40,"SIP-9":9,"TO-71":4,"SOIC-14":122,"SOIC-16":210,"SOIC-18":5,"SOIC-20":87,"SOIC-24":21,"SOIC-28":43,"HSOP-36":2,"SOIC-8":977,"SOP-16":9,"SOP-24":1,"SOP-32":1,"SOP-8":29,"SPMCC-027":15,"SSOP-10":5,"SSOP-14":11,"SSOP-16":32,"SSOP-20":36,"SSOP-24":22,"SSOP-28":33,"SSOP-8":27,"TDFN-10":3,"TDFN-14":2,"TDFN-8":6,"TQFN-16":6,"TQFN-20":2,"TQFN-24":1,"TQFN-48":1,"TQFP-32":57,"TQFP-44":60,"TQFP-48":22,"TQFP-52":2,"TQFP-64":91,"TQFP-80":1,"TSSOP-10":4,"TSSOP-14":75,"TSSOP-16":78,"TSSOP-20":119,"TSSOP-24":38,"TSSOP-28":53,"TSSOP-38":16,"TSSOP-8":114,"UDFN-8":6,"UFQFPN-20":3,"UFQFPN-28":14,"UFQFPN-32":42,"UFQFPN-48":59,"UQFN-16":4,"UQFN-20":2,"UQFN-28":4,"UQFN-40":2,"UQFN-48":2,"UQFN-64":2,"VDFN-14":1,"VFQFPN-36":8,"VQFN-16":6,"VQFN-20":13,"VQFN-24":16,"VQFN-28":1,"VQFN-32":5,"VQFN-40":2,"VQFN-48":1,"VQFN-64":3,"VSON-10":12,"VSON-12":1,"VSON-8":1,"VSSOP-24":21,"VSSOP-10":16,"VSSOP-8":50,"WDFN-8":7,"WQFN-16":7,"WQFN-20":4,"WQFN-24":3,"WQFN-32":3,"WSON-10":4,"WSON-12":3,"WSON-8":43,"X2QFN-12":4,"X2SON-8":2};
