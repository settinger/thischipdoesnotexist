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
const getDescription = async (model) => {
  // First, check if the RNN model has prepared a chip description ahead of time
  if (!!model.hasDescriptionReady) {
    let description = model.hasDescriptionReady;
    model.hasDescriptionReady = false;
    return description;
  }
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
  // I don't want to commit to manually retouching the RNN outputs, but gosh dang it unmatched parentheses bother me so much I'm going to address it here
  while (result.split("(").length < result.split(")").length) {
    result = "(" + result;
  }
  while (result.split("(").length > result.split(")").length) {
    result = result + ")";
  }
  return result;
  // Instead of just returning the result here, I should do more of the logic right here
};
