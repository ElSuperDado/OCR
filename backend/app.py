import json
import AI
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
model = AI.createModel()


# https://fastapi.tiangolo.com/tutorial/cors/?h=+cors#use-corsmiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.post("/askai/")
async def askAI(req: Request):
    data = await req.body()
    jsonData = json.loads(data)

    datastream = jsonData["dataStream"]
    prediction = json.dumps({"data":AI.ask(datastream, model)})

    return prediction


@app.post("/trainai/")
async def trainAI(req: Request):
    data = await req.body()
    jsonData = json.loads(data)

    datastream = jsonData["dataStream"]
    userinput = jsonData["userInput"]
    AI.writeDatastream(userinput, datastream)
    AI.train(userinput, model)
    
    return await req.body()
