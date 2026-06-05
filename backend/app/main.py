from fastapi import FastAPI

app = FastAPI(
    title="MediSlot API",
    description="API for managing clinic appointments and capacities",
    version="1.0.0"
)

@app.get("/")
def read_root():
    return {"message": "Welcome to MediSlot API!"}