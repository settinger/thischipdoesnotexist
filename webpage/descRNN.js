const data = { seed: "\n", temperature: 0.8, length: 300 };

// Take a section of text from the generator and fix the encoding
// Take out carriage returns, replace Ø => Ω, Ç => Σ, Æ => Δ, Þ => Ć, ú => μ, ¥ => √
const repair = (textstring) => {
  const replacements = {
    "\r": "",
    Ø: "Ω",
    Ç: "Σ",
    Æ: "Δ",
    Þ: "Ć",
    ú: "μ",
    "¥": "√",
  };
  const regex = /(?:[\rØÇÆÞú¥])/g;
  return textstring.replace(regex, (x) => replacements[x]);
};

// Use the RNN model to generate a new chip description
const getDesc = async (model) => {
  let finished = false;
  let textArray = [];
  let result = "Bug generator, 9√-1 V"; // If description generator fails, return this
  let retries = 0;
  while (!finished && retries < 5) {
    const { sample } = await model.generate(data);
    textArray = sample.split("\n");
    if (textArray.length >= 3) {
      // Trim the first and last arrays because they are probably incomplete
      textArray.slice(1, -1);
      // Apply find-replace to remaining options
      textArray = textArray.map((string) => repair(string));
      // Return the first entry in textArray longer than 40 characters (if it exists)
      const longTexts = textArray.filter((text) => text.length >= 40);
      if (longTexts.length >= 1) {
        result = longTexts[0];
        finished = true;
      }
    }
    retries++;
  }
  return result;
};

// Do this when the chip description RNN model is loaded
const descModelLoaded = async (error, model) => {
  let desc = await getDesc(model);
  generatePage(desc);
  console.log(desc);
  return desc;
  // for (let i = 0; i < 5; i++) {
  //   let blah = await getDesc(model);
  //   console.log(blah);
  // }
};
