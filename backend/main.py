import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from typing import List, Optional
from datetime import datetime
from dotenv import load_dotenv
import os
from backend.gomoku_engine_interface import GomokuEngine

# Load environment variables
load_dotenv()
MONGODB_URL = os.getenv("MONGODB_URL")
DB_NAME = "CaroGame"
COLLECTION_NAME = "record"


class Move(BaseModel):
    x: int
    y: int
    symbol: str

class GameRecord(BaseModel):
    nameMatch: str
    moveList: List[Move]
    winningCells: List[List[int]]
    timeSaved: Optional[datetime] = None

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
@app.on_event("startup")
async def startup_db_client():
    app.mongodb_client = AsyncIOMotorClient(MONGODB_URL)
    app.mongodb = app.mongodb_client[DB_NAME]
    print("Connected to MongoDB!")

@app.on_event("shutdown")
async def shutdown_db_client():
    app.mongodb_client.close()
    print("MongoDB connection closed")

@app.get("/")
async def hello_world():
    return {
        'message' : 'Hello World'
    }

# Save game record endpoint
@app.post("/record/save-game", status_code=201)
async def save_game(gameRecord: GameRecord):
    gameRecord.timeSaved = datetime.now()
    gameDict = gameRecord.dict()
    
    try:
        result = await app.mongodb[COLLECTION_NAME].insert_one(gameDict)
        return {
            "success": True,
            "id": str(result.inserted_id)
        }
    except Exception as error:
        print(error)
        raise HTTPException(status_code=500, detail=f"Failed to save game record: {str(error)}")
    

# Get all game records
@app.get("/record/game-records")
async def get_game_records():
    records = []
    cursor = app.mongodb[COLLECTION_NAME].find().sort("timeSaved", -1)
    
    async for document in cursor:
        document["_id"] = str(document["_id"])
        records.append(document)
    return records

CaroEngine = GomokuEngine(board_size=15)

@app.get("/bot/start_engine")
async def start_engine():
    successStart = CaroEngine.start()
    return "Engine started successfully" if successStart else "Failed to start engine"

@app.get("/bot/stop_engine")
async def close_engine():
    CaroEngine.close()
    return "Engine closed successfully"

@app.get("/bot/get_best_move")
async def get_best_move(x : int, y : int):
    print(f'Your move: {(x, y)}')
    bestX, bestY = CaroEngine.get_best_move(x, y)
    print(f'AI move: {(bestX, bestY)}')    
    return {
        "x" : bestX,
        "y" : bestY
    }   

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
