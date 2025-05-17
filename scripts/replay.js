class ReplayMode {
    constructor() {
        this.highlightCell = null
        this.initializeData();
        this.setupBoard();
        this.setupControls();
        this.loadGameName();
        this.updateMoveInfo();
        // this.updateTurnIndicator();
    }
    
    initializeData() {
        const gameData = JSON.parse(sessionStorage.getItem('replayGame'));
        
        if (!gameData) {
            alert('No game data found');
            window.location.href = 'index.html';
            return;
        }
        
        this.gameName = gameData.name;
        this.moveList = gameData.moveList || [];
        this.winningCells = gameData.winningCells || [];
        this.isHighlightedWinningCells = false;
        this.boardSize = 15;
        this.currentMoveIndex = -1;
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(''));
    }
    
    setupBoard() {
        const boardElement = document.getElementById('gameBoard');
        boardElement.innerHTML = '';
    
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                boardElement.appendChild(cell);
            }
        }
    }
    
    setupControls() {
        document.getElementById('backBtn').onclick = () => window.location.href = 'replay-list.html';
        document.getElementById('prevMoveBtn').onclick = () => this.previousMove();
        document.getElementById('nextMoveBtn').onclick = () => this.nextMove();
        
        this.updateButtonState();
    }
    
    loadGameName() {
        document.getElementById('gameName').textContent = this.gameName;
    }
    
    nextMove() {
        if (this.currentMoveIndex < this.moveList.length - 1) {
            this.currentMoveIndex++;
            const move = this.moveList[this.currentMoveIndex];
            
            this.board[move.x][move.y] = move.symbol;
            this.updateCell(move.x, move.y, move.symbol);
            
            this.updateHighlight(move.x, move.y);

            if (this.currentMoveIndex === this.moveList.length - 1 && this.winningCells.length > 0) {
                this.highlightWinningCells();
            }

            this.updateButtonState();
            this.updateMoveInfo();
            // this.updateTurnIndicator();
        }
    }
    
    previousMove() {
        if (this.currentMoveIndex >= 0) {
            const move = this.moveList[this.currentMoveIndex];
            
            this.board[move.x][move.y] = '';
            this.clearCell(move.x, move.y);
            
            this.clearAllHighlights();
            this.currentMoveIndex--;

            if (this.currentMoveIndex >= 0) {
                const prevMove = this.moveList[this.currentMoveIndex];
                this.updateHighlight(prevMove.x, prevMove.y);
            }
            
            this.updateButtonState();
            this.updateMoveInfo();
            // this.updateTurnIndicator();
        }
    }

    highlightWinningCells(){
        this.isHighlightedWinningCells = true;
        this.winningCells.forEach(([row, col]) => {
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (cell) {
                cell.classList.add('highlight-current');
            }
        });
    }

    updateHighlight(row, col) {
        if (this.highlightedCell) {
            const [oldRow, oldCol] = this.highlightedCell;
            const oldCell = document.querySelector(`[data-row="${oldRow}"][data-col="${oldCol}"]`);
            if (oldCell) {
                oldCell.classList.remove('highlight-current');
            }
        }
        
        const newCell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (newCell) {
            newCell.classList.add('highlight-current');
        }
        
        this.highlightedCell = [row, col];
    }
    
    clearAllHighlights() {
        if (this.highlightedCell) {
            const [row, col] = this.highlightedCell;
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (cell) {
                cell.classList.remove('highlight-current');
            }
            this.highlightedCell = null;
        }
        if (this.isHighlightedWinningCells) {
            this.winningCells.forEach(([row, col]) => {
                const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                if (cell) {
                    cell.classList.remove('highlight-current');
                }
            });
            this.isHighlightedWinningCells = false;
        }   
    }

    updateCell(row, col, symbol) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cell.textContent = symbol;
            cell.classList.add(symbol.toLowerCase());
        }
    }
    
    clearCell(row, col) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cell.textContent = '';
            cell.classList.remove('x', 'o');
        }
    }
    
    updateButtonState() {
        document.getElementById('prevMoveBtn').disabled = this.currentMoveIndex < 0;
        document.getElementById('nextMoveBtn').disabled = this.currentMoveIndex >= this.moveList.length - 1;
    }
    
    updateMoveInfo() {
        const moveInfo = document.getElementById('moveInfo');
        if (this.currentMoveIndex >= 0 && this.moveList.length > 0) {
            const currentMove = this.moveList[this.currentMoveIndex];
            moveInfo.textContent = `Move ${this.currentMoveIndex + 1}/${this.moveList.length}: Player ${currentMove.symbol} at (${currentMove.x}, ${currentMove.y})`;
        } else {
            moveInfo.textContent = 'Move 0/' + this.moveList.length;
        }
    }
    
    // updateTurnIndicator() {
    //     const turnIndicator = document.querySelector('.current-turn');
        
    //     let nextPlayer;
    //     if (this.currentMoveIndex < 0) {
    //         nextPlayer = 'X';
    //     } else {
    //         const currentSymbol = this.moveList[this.currentMoveIndex].symbol;
    //         nextPlayer = currentSymbol === 'X' ? 'O' : 'X';
    //     }
        
    //     turnIndicator.classList.remove('player-x', 'player-o');
    //     turnIndicator.classList.add(`player-${nextPlayer.toLowerCase()}`);
        
    //     turnIndicator.innerHTML = `
    //         <span class="current-turn-label">Current Turn:</span>
    //         <span class="current-player-badge">${nextPlayer}</span>
    //     `;
    // }
}


document.addEventListener('DOMContentLoaded', () => {
    new ReplayMode();
});