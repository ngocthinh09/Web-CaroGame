function startGame(mode) {
    sessionStorage.setItem('gameMode', mode);
    window.location.href = 'board.html';
}