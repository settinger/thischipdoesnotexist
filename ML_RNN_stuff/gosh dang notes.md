# GOSH DANG NOTES TO MYSELF

## Getting the chip descriptions: learning to machine learning (barf emoji)

To get the real-world chip descriptions, I wrote `getDesc.py` to scrape my kicad library. Then I manually went in and made lots of changes--consistent capitalization, consistent hyphenization, remove trademarks, remove package types

The method I used to train a model and then get a frontend javascript implementation to use that model:
* Clone training-charRNN from ml5js: https://github.com/ml5js/training-charRNN
  * Their example only works with python 3.6.x and tensorflow 1.x, which is very dumb
  * To update it to work with Python 3.9.x and tensorflow 2.5, run `tf_upgrade_v2`
  * That isn't enough, though! tensorflow.contrib.legacy_seq2seq has been removed, and I can't figure out what it's been replaced with, so I had to go into the old tf 1.x source code and copy-paste two methods from legacy_seq2seq into my project
  * Remember to change "requirements.txt" which originally said it needed tf <2.0
  * AND I had to disable eager execution with `tf.compat.v1.disable_eager_execution()`, I have no idea what this means
* After doing all that, I was able to follow the ml5js charRNN example. All my data is in a single text document. None of these fucking models can handle UTF-8 text, which is infuriating. I only had a few non-ASCII characters in my dataset so I did a find-replace, and the webpage will have to reverse that find-replace down the line, but this approach sucks. This suuuucks.
* Ideally the model would train on each line independently, and spit out a single complete line, but that isn't covered in the tutorial--instead, it treats the entire text as a continues single body of work, so it generates a little excerpt (line breaks and all) and I have to just cross my fingers and hope it contains at least one complete line in it.
* Anyway I built the model using `python train.py --data_path dataASCII.txt`. I *think* I also changed seq_length from 50 to 128 and num_epochs from 50 to 40 or something. This produces a folder `./models/dataASCII` (1.1 MB) which I then copied as-is into my webpage folder.

Other things I tried to get a text model that worked:
* "recipe generation" https://github.com/trekhleb/machine-learning-experiments/blob/master/experiments/recipe_generation_rnn/recipe_generation_rnn.ipynb
  * This one hamstrung me with the odd requirements for stop characters and different fields. I eventually got some data out of it but I could not figure out how to save the model in a way that the javascript module could use; also, the model was 64 MB for some reason. And it can't handle non-ASCII characters and I don't know why. It should work! They have a Wikipedia RNN example that uses unicode text!
* "textgenrnn" https://github.com/minimaxir/textgenrnn
  * This works great for generating short strings in python. It trains on each line individually, which is perfect for my use case. But it is putting its own layers on top of keras layers or whatever, and it only exports the model weights, not the entire model, and I can't figure out how to save it and also convert it into a format that tfjs can use. Again, can't handle non-ASCII text.
  * I tried modifying the library to save whole models instead of just weights but in the conversion step there's an issue with layers having non-default names?? I don't know anything

A question I still haven't resolved:
Is it possible to train my model in node instead of Python? Regardless, what am I not understanding about converting models between forms that tfjs and python-tf can use?
Why the FUCK can none of these cope with UTF-8

It is very difficult to search for answers on a lot of these things because there have been so many significant changes between tensorflow 1.x and 2.x, and between python 2.x and 3.x, that most stackoverflow (etc) results are no longer useful, and also make it difficult to find up-to-date information