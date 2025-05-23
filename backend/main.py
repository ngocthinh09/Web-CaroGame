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
    """
    Đại diện cho một nước đi trong ván cờ.

    Attributes:
        x (int): Tọa độ hàng.
        y (int): Tọa độ cột.
        symbol (str): Ký hiệu người chơi ('X' hoặc 'O').
    """
    x: int
    y: int
    symbol: str

class GameRecord(BaseModel):
    """
    Đại diện cho một bản ghi ván cờ.

    Attributes:
        nameMatch (str): Tên trận đấu.
        moveList (List[Move]): Danh sách các nước đi.
        winningCells (List[List[int]]): Danh sách ô chiến thắng.
        timeSaved (datetime, optional): Thời gian lưu.
    """
    nameMatch: str
    moveList: List[Move]
    winningCells: List[List[int]]
    timeSaved: Optional[datetime] = None

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],            # Cho phép truy cập từ tất cả domain
    allow_credentials=True,         
    allow_methods=["*"],            # Hỗ trợ mọi phương thức và mọi header
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_db_client():
    """
    Kết nối đến MongoDB khi ứng dụng khởi động.
    """
    app.mongodb_client = AsyncIOMotorClient(MONGODB_URL)
    app.mongodb = app.mongodb_client[DB_NAME]
    print("Connected to MongoDB!")

@app.on_event("shutdown")
async def shutdown_db_client():
    """
    Đóng kết nối MongoDB khi ứng dụng tắt.
    """
    app.mongodb_client.close()
    print("MongoDB connection closed")

@app.get("/")
async def hello_world():
    """
    API kiểm tra kết nối server.

    Returns:
        dict: {"message": "Hello World"}
    """
    return {
        'message' : 'Hello World'
    }


@app.post("/record/save-game", status_code=201)
async def save_game(gameRecord: GameRecord):
    """
    API để lưu bản ghi một ván chơi.

    Args:
        gameRecord (GameRecord): Dữ liệu của ván chơi.

    Returns:
        dict: Kết quả lưu thành công hoặc thông báo lỗi.
    """
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
    
    
@app.get("/record/game-records")
async def get_game_records():
    """
    API lấy danh sách các bản ghi ván chơi.

    Returns:
        list: Danh sách bản ghi đã lưu.
    """
    records = []
    cursor = app.mongodb[COLLECTION_NAME].find().sort("timeSaved", -1)
    
    async for document in cursor:
        document["_id"] = str(document["_id"])
        records.append(document)
    return records

# Khởi tạo engine AI
CaroEngine = GomokuEngine(board_size=15)

@app.get("/bot/start_engine")
async def start_engine():
    """
    Khởi động engine AI.

    Returns:
        str: "Engine started successfully" nếu thành công hoặc "Failed to start engine"
    """
    successStart = CaroEngine.start()
    return "Engine started successfully" if successStart else "Failed to start engine"

@app.get("/bot/stop_engine")
async def close_engine():
    """
    Tắt engine AI.

    Returns:
        str: Trạng thái sau khi tắt.
    """
    CaroEngine.close()
    return "Engine closed successfully"

@app.get("/bot/get_best_move")
async def get_best_move(x : int, y : int):
    """
    Trả về nước đi tốt nhất của AI dựa trên nước đi của người chơi.

    Args:
        x (int), y (int): Tọa độ nước đi của người chơi

    Returns:
        dict: Tọa độ (x, y) mà AI sẽ đánh.
    """
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
