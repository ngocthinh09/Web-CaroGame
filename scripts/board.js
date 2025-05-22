const BoardSize = 15;
const winCondition = 5;

const homeBtn = document.getElementById('homeBtn')
const resetBtn = document.getElementById('resetBtn')
const saveBtn = document.getElementById('saveBtn')
const saveModal = document.getElementById('saveModal')
const saveNameInput = document.getElementById('saveNameInput')
const confirmSaveBtn = document.getElementById('confirmSaveBtn')
const cancelSaveBtn = document.getElementById('cancelSaveBtn')
const loadingModal = document.getElementById('loadingModal');
const successModal = document.getElementById('successModal');

let linkServerBackend = 'https://web-carogame.onrender.com'

class GomokuGame {
    constructor() {
        this.board = Array(BoardSize).fill().map(() => Array(BoardSize).fill(''));
        this.currentPlayer = 'X';
        this.gameMode = sessionStorage.getItem('gameMode') || 'pvp';
        this.gameActive = true;
        this.winningCells = [];
        this.moveList = [];
        this.initializeBoard();
        this.updateTurnIndicator();
        this.setupButtons();
        this.clearWinMessage();
    }

    setupButtons() {
        // Thiết lập các nút chức năng  
        homeBtn.onclick = () => window.location.href = 'index.html';    // Khi click vào Home sẽ chuyển hướng về MeguPage
        resetBtn.onclick = () => this.resetGame();                      // Khi click vào sẽ kích hoạt hàm reset bàn cờ
        saveBtn.onclick = () => {
            saveModal.style.display = 'flex';                           // Khi click nút Save sẽ xuất hiện bảng lưu game
        };
        cancelSaveBtn.onclick = () => {
            saveModal.style.display = 'none';                           // Khi click nút Cancel trên bảng lưu sẽ tắt bảng lưu game 
            saveNameInput.value = '';
        };
        confirmSaveBtn.onclick = () => {
            const name = saveNameInput.value.trim();
            const errorMessage = document.getElementById('error-message');
            if (!name) {
                errorMessage.style.display = 'block';
                return;
            }
            errorMessage.style.display = 'none';
            saveModal.style.display = 'none';
            saveNameInput.value = '';
            this.saveGameRecord(name);
        };
    }

    showWinMessage(winner) {
        const winMessage = document.getElementById('winMessage');
        winMessage.innerHTML = `<span class="trophy">🏆</span> <span style="color:#27ae60">Player ${winner} Wins!</span>`;
        const turnIndicator = document.querySelector('.current-turn');
        if (turnIndicator) turnIndicator.style.display = 'none';
    }

    clearWinMessage() {
        const winMessage = document.getElementById('winMessage');
        winMessage.innerHTML = '';

        const turnIndicator = document.querySelector('.current-turn');
        if (turnIndicator) turnIndicator.style.display = 'flex';
    }

    highlightWinningCells() {   
        // Khi có người chơi thắng, sẽ thêm các class .win vào cho các ô trên đường chiến thắng để highlight các ô chiến thắng
        for (const [row, col] of this.winningCells) {
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (cell) cell.classList.add('win');
        }
    }

    resetGame() {
        this.board = Array(BoardSize).fill().map(() => Array(BoardSize).fill(''));
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.winningCells = [];
        this.moveList = [];
        if (this.gameMode === 'pve'){
            this.requestCloseEngine();
        }
        this.initializeBoard();
        this.updateTurnIndicator();
        this.clearWinMessage();
    }

    initializeBoard() {
        const boardElement = document.getElementById('gameBoard');
        boardElement.innerHTML = '';

        for (let i = 0; i < BoardSize; i++) {
            for (let j = 0; j < BoardSize; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                cell.addEventListener('click', () => this.makeMove(i, j));
                boardElement.appendChild(cell);
            }
        }
        saveBtn.style.display = 'none';
        
        if (this.gameMode === 'pve'){
            this.requestStartEngine()
        }
    }

    async requestStartEngine(){
        try {
            const response = await fetch(`${linkServerBackend}/bot/start_engine`)
            console.log(response)
        } catch (error){
            alert('Error fetching start engine')
        }
    }

    async requestCloseEngine(){
        try{
            const respone = await fetch(`${linkServerBackend}/bot/stop_engine`)
            console.log(respone)
        } catch (error){
            alert('Error fetching close engine')
        }
    }

    makeMove(row, col) {
        if (!this.gameActive || this.board[row][col] !== '') return;

        this.board[row][col] = this.currentPlayer;
        this.updateCell(row, col);

        this.moveList.push({
            x : row,
            y : col,
            symbol : this.currentPlayer
        })

        if (this.checkWin(row, col)) {
            this.gameActive = false;
            this.showWinMessage(this.currentPlayer);
            this.highlightWinningCells();
            saveBtn.style.display = 'flex';
            if (this.gameMode === 'pve'){
                this.requestCloseEngine();
            }
            return;
        }

        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        this.updateTurnIndicator();

        if (this.gameMode === 'pve' && this.currentPlayer === 'O' && this.gameActive) {
            setTimeout(() => this.makeBotMove(), 500);
        }
    }

    updateCell(row, col) {
        if (this.moveList.length > 0){
            const lastMove = this.moveList[this.moveList.length - 1];
            const lastCell = document.querySelector(`[data-row="${lastMove.x}"][data-col="${lastMove.y}"]`);
            lastCell.classList.remove('highlight-current');
        }
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.textContent = this.board[row][col];
        cell.classList.add(this.board[row][col].toLowerCase());
        cell.classList.add('highlight-current');
    }

    updateTurnIndicator() {
        const turnIndicator = document.querySelector('.current-turn');
        if (!this.gameActive) {
            turnIndicator.style.display = 'none';
            return;
        }
        turnIndicator.style.display = 'flex';
        turnIndicator.classList.remove('player-x', 'player-o');
        turnIndicator.classList.add(`player-${this.currentPlayer.toLowerCase()}`);
        turnIndicator.innerHTML = `
            <span class="current-turn-label">Current Turn:</span>
            <span class="current-player-badge">${this.currentPlayer}</span>
        `;
    }

    checkWin(row, col) {
        const directions = [
            [1, 0], [0, 1], [1, 1], [1, -1]
        ];
        for (const [dx, dy] of directions) {
            let count = 1;
            let cells = [[row, col]];
            count += this.countDirection(row, col, dx, dy, cells);
            count += this.countDirection(row, col, -dx, -dy, cells);
            if (count >= winCondition) {
                this.winningCells = cells;
                return true;
            }
        }
        return false;
    }

    countDirection(row, col, dx, dy, cells) {
        let count = 0;
        let r = row + dx;
        let c = col + dy;
        while (
            r >= 0 && r < BoardSize && c >= 0 && c < BoardSize &&
            this.board[r][c] === this.currentPlayer
        ) {
            count++;
            cells.push([r, c]);
            r += dx;
            c += dy;
        }
        return count;
    }

    async makeBotMove() {
        try {
            const row = this.moveList[this.moveList.length - 1]["x"]
            const col = this.moveList[this.moveList.length - 1]["y"]
            const respone = await fetch(`${linkServerBackend}/bot/get_best_move?x=${row}&y=${col}`)
            const coordinate = await respone.json()
            console.log(coordinate)
            this.makeMove(coordinate['x'], coordinate['y'])
        } catch (error){
            alert('Error fetching get botMove')
        }
    }

    saveGameRecord(name) {
        loadingModal.style.display = 'flex';

        const gameData = {
            nameMatch: name,
            moveList: this.moveList,
            winningCells: this.winningCells
        };

        console.log(gameData)   // debug

        fetch(`${linkServerBackend}/record/save-game`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(gameData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Game saved successfully:', data);
            
            loadingModal.style.display = 'none';
            successModal.style.display = 'flex';
            setTimeout(() => {
                successModal.style.display = 'none';
            }, 1000);
        })
        .catch(error => {
            console.error('Error saving game:', error);
            loadingModal.style.display = 'none';
            alert('Failed to save game. Please try again.');
        });
    }
}


window.addEventListener('DOMContentLoaded', () => {
    const mode = sessionStorage.getItem('gameMode') || 'pvp';
    const gameModeTitle = document.getElementById('gameModeTitle');
    if (gameModeTitle) {
        if (mode === 'pvp') {
            gameModeTitle.innerHTML = '<span style="font-size:1.5rem">👥</span> Player vs Player';
        } else {
            gameModeTitle.innerHTML = '<span style="font-size:1.5rem">🤖</span> Player vs Bot';
        }
    }
    new GomokuGame();
});