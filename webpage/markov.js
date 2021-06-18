// Takes a list of input texts and builds a letter-level Markov model off it
const makeMarkov = (input, order = 3) => {
  const model = { order, initials: defaultDict(), transitions: defaultDict(() => defaultDict()) };
  input.forEach((line) => {
    model.initials[line.slice(0, order)]++;
    for (let i = 0; i < line.length - order; i++) {
      model.transitions[line.slice(i, i + order)][line[i + order]]++;
    }
  });
  return model;
};

// Use the Markov model to generate an output
const useMarkov = (model, maxLength = 60) => {
  let result = sampleFromDict(model.initials);
  let newValue;
  while (result.length < maxLength) {
    let ngraph = result.slice(-model.order);
    // This should never happen, but if the transitions table for this n-graph is empty, pick a random result from a random transition table
    if (Object.keys(model.transitions[ngraph]).length < 1) {
      newValue = sampleFromDict(sample(Object.values(model.transitions)));
    }
    newValue = sampleFromDict(model.transitions[ngraph]);
    if (newValue == "\n") break;
    result += newValue;
  }
  return result;
};

// Create a Markov model that main.js can access
let vendorsWithEndings = vendors.map((v) => v + "\n");
const markov = makeMarkov(vendorsWithEndings);
