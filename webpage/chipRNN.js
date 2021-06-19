const data = { seed: "\n", temperature: 0.8, length: 200 };

// Take a section of text from the generator and fix the encoding
// Take out carriage returns, replace Ø => Ω, Ç => Σ, Æ => Δ, Þ => Ć, ú => μ, ¥ => √
const repair = (textstring) => {
  const replacements = {
    "\r": "",
    "\n": "",
    Ø: "Ω",
    Ç: "Σ",
    Æ: "Δ",
    Þ: "Ć",
    ú: "μ",
    "¥": "√",
  };
  const regex = /(?:[\r\nØÇÆÞú¥])/g;
  return textstring.replace(regex, (x) => replacements[x]);
};

// Use the RNN model to generate a new chip description
const getDescriptionGradual = async (model) => {
  // First, check if the RNN model has prepared a chip description ahead of time
  if (!!model.hasDescriptionReady) {
    let description = model.hasDescriptionReady;
    model.hasDescriptionReady = false;
    return description;
  }
  let finished = false;
  let defaultResult = "Bug generator, 9√-1 V"; // If description generator fails, return this
  let retries = 0;

  let output = sampleFromDict(seeds);
  let startTime = Date.now();
  while (!finished && retries < 5) {
    while (output.length < 200 && !output.includesAny("\r", "\n")) {
      let { sample: newText } = await model.generate({ seed: output, length: 5, temperature: 0.8 });
      console.log(output);
      output += newText;
    }
    // Check if output is longer than 40 characters and without too many neologisms (if it exists)
    output += output.split("\n")[0];
    if (output.length >= 40 && neologisms(output) < 0.5) {
      finished = true;
    } else {
      retries++;
      output = sampleFromDict(seeds);
    }
  }

  output = retries < 5 ? repair(output) : defaultResult;

  // I don't want to commit to manually retouching the RNN outputs, but gosh dang it unmatched parentheses bother me so much I'm going to address it here
  while (output.split("(").length < output.split(")").length) {
    output = "(" + output;
  }
  while (output.split("(").length > output.split(")").length) {
    output = output + ")";
  }
  let endTime = Date.now();
  console.log("Seconds elapsed:", (endTime - startTime) / 1000);
  return output;
};

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
  let startTime = Date.now();
  while (!finished && retries < 5) {
    let seed = sampleFromDict(seeds);
    const { sample } = await model.generate({ seed, temperature: 0.8, length: 200 });
    textArray = (seed + sample).split("\n");
    // Return the first entry in textArray longer than 40 characters without too many neologisms (if it exists)
    const longTexts = textArray.filter((text) => text.length >= 40 && neologisms(text) < 0.5);
    if (longTexts.length >= 1) {
      result = repair(longTexts[0]);
      finished = true;
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
  let endTime = Date.now();
  console.log("Seconds elapsed:", (endTime - startTime) / 1000);
  return result;
  // Instead of just returning the result here, I should do more of the logic right here
};

// Check how many words in a description are neologisms and how many are in the existing corpus
// Return a value between 0 (no neologisms) and 1 (all neologisms)
const neologisms = (description) => {
  // Replace certain word boundaries with spaces, remove other word boundaries
  let filtered = description.replace(/[\r\(\),]/g, "").replace(/[=\n\-\/~]/g, " ");
  let tokens = filtered.toLowerCase().split(" ");
  let neologisms = tokens.map((token) => !corpus.includes(token));
  let rate = neologisms.filter((x) => x).length / neologisms.length;
  return rate;
};
