# This Chip Does Not Exist

## June 2021

I made a nifty little tool to help us all through the [ongoing chip shortage](https://en.wikipedia.org/wiki/2020%E2%80%932021_global_chip_shortage). This tool will tell you if a particular IC is out of stock or not. The only problem: it only knows about completely made-up chips that probably can't ever exist.

If you spot a problem or have a suggestion for the page, please don't hesitate to contact me! You can reach me on Twitter or by email (ettingersam at gmail), or wherever else you can find me. I ran into some issues, particularly with the [SVG pinout diagrams](https://bugzilla.mozilla.org/show_bug.cgi?id=1716435), so I'd really appreciate if you spot any mistakes.

## Machine Learning

The descriptions of each chip are generated on-the-fly with the help of [ml5js](https://ml5js.org/). I trained an RNN (or maybe it was an LSTM?) on a selection of existing chip descriptions gathered from [KiCad symbols](https://gitlab.com/kicad/libraries/kicad-symbols).

I know barely anything about TensorFlow, and I've been struggling to self-teach this kind of thing. The official(?) ml5js tutorial on RNNs was updated quite recently, but it still requires Tensorflow 1.x to operate (as of writing, the latest version is Tensorflow 2.5 and TF documentation is already gearing up for the release of 3.0). So I [forked it and bodged it to work with TF 2.5](https://github.com/settinger/training-charRNN-for-TF-2.5). Now I can train my own models with Python, but I am left with a ton of questions.
- Why does the ml5js tutorial use Python to generate new models? I get that you can't train a whole ML model in someone's browser, but shouldn't a package with "js" in the title use Nodejs or something, not Python?
- Why can't I get the charRNN model to parse non-ASCII text? Python 3 is supposed to be good at handling UTF-8 text. But if any text mentioned Ćuk converters, or Δ-Σ modulation, or just the Ω ohm symbol, it caused the training to fail. I had to convert my training data into ASCII characters by using a crude substitution cipher, which I then reverse at time of rendering. Surely there's a better way to handle UTF-8.
- My training data is a collection of single lines of text. Ideally, I would find a way to train the model line-by-line, and it could spit out a single, complete, new line when asked. But the only text-training method I found involves treating my entire corpus as one long continuous text, and the model spits out a string that starts mid-way through a line. As a result I have to generate a lot more text than I theoretically need, and discard most of it before rendering the page. This wastes a lot of time. What am I missing here?