from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

app = FastAPI()

class CalculationRequest(BaseModel):
    data: dict

@app.post("/api/calculate")
def calculate(payload: CalculationRequest):
    # call your existing calculator logic here
    return {"status": "ok", "result": payload.data}

app.mount("/", StaticFiles(directory="web", html=True), name="web")