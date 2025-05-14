const BoardSize = 15;
const winCondition = 5;

class GomokuGame {
    constructor() {
        this.board = Array(BoardSize).fill().map(() => Array(BoardSize).fill(''));
        this.currentPlayer = 'X';
        this.gameMode = sessionStorage.getItem('gameMode') || 'pvp';
        this.gameActive = true;
        this.winningCells = [];
        this.initializeBoard();
        this.updateTurnIndicator();
        this.setupButtons();
        this.clearWinMessage();
    }

    setupButtons() {
        document.getElementById('resetBtn').onclick = () => this.resetGame();
        document.getElementById('homeBtn').onclick = () => window.location.href = 'index.html';
    }

    showWinMessage(winner) {
        const winMessage = document.getElementById('winMessage');
        winMessage.innerHTML = `<span class="trophy">🏆</span> <span style="color:#27ae60">Player ${winner} Wins!</span>`;
        // Ẩn current turn khi có người thắng
        const turnIndicator = document.querySelector('.current-turn');
        if (turnIndicator) turnIndicator.style.display = 'none';
    }

    clearWinMessage() {
        const winMessage = document.getElementById('winMessage');
        winMessage.innerHTML = '';
        // Hiện lại current turn khi reset
        const turnIndicator = document.querySelector('.current-turn');
        if (turnIndicator) turnIndicator.style.display = 'flex';
    }

    highlightWinningCells() {
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
    }

    makeMove(row, col) {
        if (!this.gameActive || this.board[row][col] !== '') return;

        this.board[row][col] = this.currentPlayer;
        this.updateCell(row, col);

        if (this.checkWin(row, col)) {
            this.gameActive = false;
            this.showWinMessage(this.currentPlayer);
            this.highlightWinningCells();
            return;
        }

        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        this.updateTurnIndicator();

        if (this.gameMode === 'pve' && this.currentPlayer === 'O' && this.gameActive) {
            setTimeout(() => this.makeBotMove(), 500);
        }
    }

    updateCell(row, col) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.textContent = this.board[row][col];
        cell.classList.add(this.board[row][col].toLowerCase());
    }

    updateTurnIndicator() {
        const turnIndicator = document.querySelector('.current-turn');
        if (!this.gameActive) {
            turnIndicator.style.display = 'none';
            return;
        }
        turnIndicator.style.display = 'flex';
        // Remove any previous player-x/player-o class
        turnIndicator.classList.remove('player-x', 'player-o');
        turnIndicator.classList.add(`player-${this.currentPlayer.toLowerCase()}`);
        turnIndicator.innerHTML = `
            <span class="current-turn-label">Current Turn:</span>
            <span class="current-player-badge">${this.currentPlayer}</span>
        `;
    }

    checkWin(row, col) {
        const directions = [
            [1, 0], [0, 1], [1, 1], [1, -1] // horizontal, vertical, diagonal
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

    makeBotMove() {
        // Simple bot implementation - finds first empty cell
        for (let i = 0; i < 15; i++) {
            for (let j = 0; j < 15; j++) {
                if (this.board[i][j] === '') {
                    this.makeMove(i, j);
                    return;
                }
            }
        }
    }
}

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    // Set game mode title
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