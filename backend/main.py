import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from typing import List, Optional
from datetime import datetime
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()
MONGODB_URL = os.getenv("MONGODB_URL")
DB_NAME = os.getenv("DB_NAME")
COLLECTION_NAME = os.getenv("COLLECTION_NAME")


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
    allow_origins=["https://ngocthinh09.github.io"],
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

async def check():
    try:
        server_status = await app.mongodb.command("serverStatus")
        print("MongoDB server status OK")
    except Exception as e:
        print("MongoDB server status FAILED:", e)


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
    cursor = app.mongodb[COLLECTION_NAME].find().sort("timestamp", -1)
    
    async for document in cursor:
        document["_id"] = str(document["_id"])
        print (document)    # debug
        records.append(document)
    return records

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
    check()
