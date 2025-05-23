import subprocess
import time
import os
import platform
import logging
from typing import List, Tuple, Optional, Dict, Any, Union
import numpy as np

# Thiết lập logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("gomoku_engine")

ENGINE_PATH = r"backend/AlphaGomoku/pbrain-AlphaGomoku"

class GomokuEngine:
    """
    Lớp giao tiếp với engine Caro (Gomoku) thông qua stdin/stdout và sử dụng giao thức Gomocup
    """
    
    def __init__(self, engine_path: str = ENGINE_PATH, board_size: int = 15, timeout: int = 15000):
        """
        Khởi tạo engine Gomoku
        
        Args:
            engine_path: Đường dẫn đến file thực thi engine
            board_size: Kích thước bàn cờ (15 cho standard, 20 cho freestyle)
            timeout: Thời gian tối đa chờ engine trả lời (milliseconds)
        """
        self.engine_path = engine_path
        self.board_size = board_size
        self.timeout = timeout
        self.process = None
        self.is_windows = platform.system() == "Windows"
        
        if not os.path.exists(engine_path):
            raise FileNotFoundError(f"Engine file not found: {engine_path}")
    
    def start(self) -> bool:
        """
        Khởi động engine process và thiết lập bàn cờ
        
        Returns:
            bool: True nếu khởi động thành công
        """
        try:
            # Khởi động process với stdin/stdout pipe
            self.process = subprocess.Popen(
                self.engine_path,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1,
                shell=self.is_windows
            )
            
            # Khởi tạo bàn cờ với kích thước đã chọn
            response = self.send_command(f"START {self.board_size}")
            
            if "OK" in response:
                logger.info(f"Engine started successfully with board size {self.board_size}")
                
                # Thiết lập các thông số
                self.send_command(f"INFO timeout_turn {self.timeout}")
                self.send_command(f"INFO timeout_match {self.timeout * 100}")
                self.send_command("INFO rule 1")
                
                return True
            else:
                logger.error(f"Failed to start engine: {response}")
                return False
                
        except Exception as e:
            logger.error(f"Error starting engine: {str(e)}")
            return False
    
    def send_command(self, command: str) -> str:
        """
        Gửi lệnh đến engine và đọc phản hồi
        
        Args:
            command: Lệnh cần gửi
            
        Returns:
            str: Phản hồi từ engine
        """
        if self.process is None or self.process.poll() is not None:
            raise RuntimeError("Engine process is not running")
        
        logger.debug(f"Sending command: {command}")
        self.process.stdin.write(f"{command}\n")
        self.process.stdin.flush()
        
        # Đối với các lệnh không yêu cầu phản hồi, trả về chuỗi rỗng
        if command.startswith("INFO") or command == "END":
            return ""
            
        # Đọc phản hồi
        return self._read_response()
    
    def _read_response(self) -> str:
        """
        Đọc phản hồi từ engine
        
        Returns:
            str: Phản hồi từ engine
        """
        if self.process is None or self.process.poll() is not None:
            raise RuntimeError("Engine process is not running")
        
        # Đọc output cho đến khi nhận được phản hồi hợp lệ hoặc hết thời gian
        start_time = time.time()
        timeout_seconds = self.timeout / 1000
        response_lines = []
        
        while time.time() - start_time < timeout_seconds:
            line = self.process.stdout.readline().strip()
            if line:
                logger.debug(f"Received: {line}")
                response_lines.append(line)
                
                if (len(line.split(",")) == 2 and all(part.strip().isdigit() for part in line.split(","))) or \
                   line.startswith("ERROR") or \
                   line.startswith("UNKNOWN") or \
                   line == "OK":
                    break
                
                if line.startswith("MESSAGE"):
                    continue
            
            # Ngắt nếu process đã kết thúc
            if self.process.poll() is not None:
                break
                
            time.sleep(0.01)
        
        return "\n".join(response_lines)
    
    def set_board(self, board: List[List[int]]) -> Tuple[Optional[int], Optional[int]]:
        """
        Thiết lập trạng thái bàn cờ và lấy nước đi tiếp theo
        
        Args:
            board: Ma trận 2D biểu diễn bàn cờ (0: trống, 1: người chơi 1, 2: người chơi 2)
            
        Returns:
            Tuple[int, int]: Tọa độ (x, y) của nước đi tiếp theo, hoặc (None, None) nếu có lỗi
        """
        try:
            # Gửi lệnh BOARD để bắt đầu thiết lập bàn cờ
            self.process.stdin.write("BOARD\n")
            self.process.stdin.flush()
            
            for i in range(self.board_size):
                for j in range(self.board_size):
                    if board[i][j] == 1:
                        self.process.stdin.write(f"{j},{i},1\n")
                        self.process.stdin.flush()
                    elif board[i][j] == 2:
                        self.process.stdin.write(f"{j},{i},2\n")
                        self.process.stdin.flush()
            
            self.process.stdin.write("DONE\n")
            self.process.stdin.flush()
            
            response = self._read_response()
            
            if "ERROR" in response or "UNKNOWN" in response:
                logger.error(f"Error setting board: {response}")
                return None, None
            
            for line in response.split('\n'):
                if line.startswith("MESSAGE"):
                    continue
                    
                parts = line.strip().split(',')
                if len(parts) == 2 and all(part.strip().isdigit() for part in parts):
                    x, y = int(parts[0]), int(parts[1])
                    logger.info(f"Engine suggests move: ({x}, {y})")
                    return x, y
            
            logger.warning("Could not parse engine response for best move")
            return None, None
            
        except Exception as e:
            logger.error(f"Error setting board: {str(e)}")
            return None, None
    
    def get_best_move(self, x: int, y: int) -> Tuple[Optional[int], Optional[int]]:
        """
        Gửi nước đi của người chơi và lấy nước đi tốt nhất từ engine
        
        Args:
            x: Tọa độ x của nước đi người chơi
            y: Tọa độ y của nước đi người chơi
            
        Returns:
            Tuple[int, int]: Tọa độ (x, y) của nước đi tốt nhất, hoặc (None, None) nếu có lỗi
        """
        try:
            response = self.send_command(f"TURN {x},{y}")
            
            if "ERROR" in response or "UNKNOWN" in response:
                logger.error(f"Engine error: {response}")
                return None, None
            
            for line in response.split('\n'):
                if line.startswith("MESSAGE"):
                    continue
                    
                parts = line.strip().split(',')
                if len(parts) == 2 and all(part.strip().isdigit() for part in parts):
                    move_x, move_y = int(parts[0]), int(parts[1])
                    logger.info(f"Engine suggests move: ({move_x}, {move_y})")
                    return move_x, move_y
            
            logger.warning("Could not parse engine response for best move")
            return None, None
            
        except Exception as e:
            logger.error(f"Error getting best move: {str(e)}")
            return None, None
    
    def begin_game(self) -> Tuple[Optional[int], Optional[int]]:
        """
        Bắt đầu trò chơi mới và yêu cầu engine đi nước đầu tiên
        
        Returns:
            Tuple[int, int]: Tọa độ (x, y) của nước đi đầu tiên, hoặc (None, None) nếu có lỗi
        """
        try:
            response = self.send_command("BEGIN")
            
            if "ERROR" in response or "UNKNOWN" in response:
                logger.error(f"Engine error: {response}")
                return None, None
            
            for line in response.split('\n'):
                if line.startswith("MESSAGE"):
                    continue
                    
                parts = line.strip().split(',')
                if len(parts) == 2 and all(part.strip().isdigit() for part in parts):
                    x, y = int(parts[0]), int(parts[1])
                    logger.info(f"Engine's first move: ({x}, {y})")
                    return x, y
            
            logger.warning("Could not parse engine response for first move")
            return None, None
            
        except Exception as e:
            logger.error(f"Error starting game: {str(e)}")
            return None, None
    
    def restart(self) -> bool:
        """
        Khởi động lại trò chơi
        
        Returns:
            bool: True nếu khởi động lại thành công
        """
        try:
            response = self.send_command("RESTART")
            
            if "ERROR" in response:
                logger.error(f"Error restarting game: {response}")
                return False
                
            return True
            
        except Exception as e:
            logger.error(f"Error restarting game: {str(e)}")
            return False
    
    def close(self) -> None:
        """
        Đóng engine process
        """
        if self.process is not None:
            try:
                self.send_command("END")
                
                time.sleep(0.5)
                
                self.process.terminate()
                self.process.wait(timeout=2)
                
                logger.info("Engine process closed")
                
            except Exception as e:
                logger.error(f"Error closing engine: {str(e)}")
                
                # Nếu không thể đóng bình thường, kill process
                try:
                    self.process.kill()
                except:
                    pass
            
            finally:
                self.process = None