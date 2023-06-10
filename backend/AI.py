import os, os.path
import numpy as np
import tensorflow as tf
import time
import tensorflow.keras as k

DATASETS_DIR = "./datasets/"

def formatDatastream(datastream):
    result = np.zeros(400, dtype=np.uint8)

    for i in datastream:
        result[i] = 1

    return result
    

def writeDatastream(destFolder, datastream):
    file_nb = len([f for f in os.listdir(DATASETS_DIR + str(destFolder))])
    filepath = DATASETS_DIR + str(destFolder) + "/sample" + str(file_nb) + ".txt"

    formatedDatastream = formatDatastream(datastream)
    formatedDatastream = np.reshape(formatedDatastream, (20, 20))

    with open(filepath, "w") as file:
        for line in formatedDatastream:
            file.write(str(line)[1:-1] + "\n")
    file.close()


# https://keras.io/guides/sequential_model/
def createModel():
    model = k.Sequential()

    model.add(k.Input(shape=(400,), name="samples"))
    model.add(k.layers.Dense(64, activation="sigmoid", name="layer1"))
    model.add(k.layers.Dense(64, activation="sigmoid", name="layer2"))
    model.add(k.layers.Dense(10, activation="sigmoid", name="output"))

    model.compile(
        optimizer=k.optimizers.RMSprop(), 
        loss=k.losses.SparseCategoricalCrossentropy(),
        metrics=[k.metrics.SparseCategoricalAccuracy()],
    )

    start = time.time()
    train(model)
    print("AI: Training done in {} seconds !".format(time.time() - start))

    return model


def getDatasets():
    dataset = []
    answers = []

    for folder in os.listdir(DATASETS_DIR):
        for fileName in os.listdir(DATASETS_DIR + str(folder) + "/"):
            answers.append(int(folder))

            with open(DATASETS_DIR + folder + "/" + fileName, "r") as file:
                datastream = []
                for line in file:
                    for char in line:
                        if char.isnumeric():
                            datastream.append(int(char))

            dataset.append(datastream)

    return dataset, answers


# https://www.tensorflow.org/guide/keras/train_and_evaluate?hl=fr
def train(model):
    dataset, answers = getDatasets()
    datatest = np.array(dataset).reshape((len(dataset),400)).astype("float32")
    answers = np.array(answers)
    model.fit(datatest, answers, batch_size=64, epochs=800, verbose=1)


def ask(datastream, model):
    data = np.array(formatDatastream(datastream)).reshape((1,400))
    print("AI: Prediction on user sample")
    prediction = model.predict(data)
    print(prediction)

    return np.ndarray.tolist(prediction)[0]
