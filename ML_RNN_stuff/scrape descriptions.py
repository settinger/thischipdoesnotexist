import os

path = "E:\Program Files\KiCad\share\kicad\library"
os.chdir(path)
(_, _, filenames) = next(os.walk(path))

def getDescriptions():
    for filename in (filename for filename in filenames if filename.endswith(".dcm")):
        with open(filename, encoding="utf8") as f:
            with open(r"E:\Code\thischipdoesnotexist\descriptions.txt", "a+", encoding="utf8") as target:
                target.write("--------" + filename + "--------\n")
                linesToWrite = [line[2:] for line in f if line.startswith("D ")]
                target.write(''.join(linesToWrite))

def filterDescriptions():
    newFile = r"E:\Code\thischipdoesnotexist\newDescriptionsProcessed.txt"
    file = r"E:\Code\thischipdoesnotexist\descriptionsProcessed.txt"
    with open(file, encoding="utf8") as f:
        allLines = f.readlines()
        filtered = sorted(set(allLines))
        with open(newFile, "a+", encoding="utf8") as target:
            target.write(''.join(filtered))
