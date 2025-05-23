## Web Caro Game :video_game: 

This project presents a web-based implementation of the classic Caro game, also known as Gomoku or Five in a Row. It allows users to play against each other (Player vs Player) or challenge an AI opponent (Player vs Bot). The application features a clean user interface, game state saving capabilities, and utilizes a dedicated backend server to manage game logic and AI interactions. The goal is to provide an accessible and engaging Caro experience directly within a web browser.


## :scroll: Table of Contents

- [:sparkles: Features](#sparkles-features)
- [:gear: Setup and Installation](#gear-setup-and-installation)
- [:rocket: Usage](#rocket-usage)
- [:building_construction: Architecture](#building_construction-architecture)
- [:link: References](#link-references)


## :sparkles: Features

This Web Caro Game boasts several features designed for an enjoyable user experience:

*   **Multiple Game Modes:** Players can choose between two distinct modes. The Player vs Player (PvP) mode allows two individuals to compete against each other on the same device. The Player vs Environment (PvE) mode pits the player against an AI opponent, powered by the AlphaGomoku engine, offering a challenging single-player experience.
*   **Interactive Game Board:** The game features a standard 15x15 Caro board. Players interact by clicking on empty cells to place their respective symbols ("X" or "O"). The interface clearly indicates the current player"s turn and highlights the most recent move.
*   **Win Detection and Highlighting:** The game automatically detects when a player achieves five consecutive symbols horizontally, vertically, or diagonally. Upon winning, the game announces the winner and visually highlights the winning line of symbols on the board.
*   **Game Saving:** Players have the option to save the state of a completed game. This includes the sequence of moves and the final board configuration. Saved games are stored in a MongoDB database via the backend API, allowing for later review.
*   **Game Replay:** A dedicated replay feature allows users to browse a list of previously saved games. Selecting a game from the list enables players to step through the entire sequence of moves, visualizing how the game unfolded.
*   **AI Opponent:** The PvE mode integrates the AlphaGomoku engine, a separate executable, to provide AI-driven moves. The backend manages communication with this engine, sending the player"s move and receiving the AI"s calculated best response.
*   **Responsive Interface:** While primarily designed for desktop browsers, the interface elements are structured using standard HTML and CSS, offering potential for responsiveness adjustments.
*   **Clear Backend API:** The game utilizes a FastAPI backend to handle game logic coordination, AI engine interaction, and database operations (saving/loading game records).



## :gear: Setup and Installation

To run this Web Caro Game project locally, you will need Python 3.x and pip installed. Follow these steps:

1.  **Clone the Repository:**
    Open your terminal or command prompt and clone the repository from GitHub:
    ```bash
    git clone https://github.com/ngocthinh09/Web-CaroGame.git
    cd Web-CaroGame
    ```

2.  **Set Up Backend Environment:**
    Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
    It is highly recommended to create a virtual environment for Python dependencies:
    ```bash
    python -m venv venv
    # Activate the virtual environment:
    # On Windows:
    # venv\Scripts\activate
    # On macOS/Linux:
    # source venv/bin/activate
    ```
    Install the required Python packages:
    ```bash
    pip install -r ../requirements.txt 
    ```
    *Note: The `requirements.txt` file is in the root directory, hence `../requirements.txt`.*

3.  **Configure Environment Variables:**
    The backend requires a MongoDB connection string. Create a `.env` file inside the `backend` directory:
    ```bash
    cd backend # If not already inside
    # Create a .env file (e.g., using nano or your preferred editor)
    # nano .env 
    ```
    Add your MongoDB connection URL to the `.env` file:
    ```env
    MONGODB_URL=your_mongodb_connection_string_here
    ```
    Replace `your_mongodb_connection_string_here` with your actual MongoDB Atlas or local MongoDB instance connection string.
    
    You can change the Database Name and Collection Name by constants varible `DB_NAME` and `COLLECTION_NAME` in file `backend/main.py`

4.  **Prepare the AI Engine:**
    The AI engine (`pbrain-AlphaGomoku`) is included in the `backend/AlphaGomoku` directory. Ensure it has execute permissions. On Linux/macOS, you might need to run:
    ```bash
    chmod +x backend/AlphaGomoku/pbrain-AlphaGomoku
    ````
    *Note: The provided engine seems compiled for Linux. If running on Windows or macOS, you might need to find or compile a compatible version of the AlphaGomoku engine.*

5.  **Run the Backend Server:**
    From the `backend` directory (with the virtual environment activated), start the FastAPI server:
    ```bash
    uvicorn main:app --reload --port 8000
    ```
    The server should now be running, typically at `http://127.0.0.1:8000`.
    You need change constant varible `linkServerBackend` in file `scripts/board.js` and `scripts/replay-list.js` to `http://localhost:8000`
    
6.  **Access the Frontend:**
    No separate build step seems required for the frontend. Simply open the HTML files located in the root directory (`index.html`, `game.html`, etc.) directly in your web browser.
    *   Start by opening `index.html`.
    *   The frontend JavaScript (`scripts/board.js`, `scripts/replay.js`, etc.) is configured to communicate with the backend server, which it expects to be running at `https://web-carogame.onrender.com` by default. **For local development, you must modify the `linkServerBackend` variable in the JavaScript files (`scripts/board.js`, `scripts/replay-list.js`, `scripts/replay.js`) to point to your local backend server address (e.g., `http://127.0.0.1:8000`).**



## :rocket: Usage

Once the backend server is running and the frontend HTML files are opened in a browser (with the backend URL correctly configured in the JavaScript files for local testing), follow these steps to play:

1.  **Main Menu (`index.html`):**
    *   You will be presented with the main menu.
    *   Choose your desired game mode: "Player vs Player" or "Player vs Bot".
    *   Clicking a mode button will navigate you to the game board (`game.html`).
    *   There is also an option to view "Replays", which takes you to the replay list (`replay-list.html`).

2.  **Gameplay (`game.html`):**
    *   The game board is displayed, along with the current game mode title.
    *   An indicator shows whose turn it is ("X" or "O"). Player "X" always starts.
    *   Click on an empty cell on the 15x15 grid to place your symbol.
    *   **PvP Mode:** Players take turns clicking on empty cells.
    *   **PvE Mode:** The player ("X") makes a move. The game then sends the move to the backend, which communicates with the AI engine. After a short delay (while the AI calculates), the AI"s move ("O") will appear on the board. The turn indicator updates accordingly.
    *   The game continues until one player gets five symbols in a row (horizontally, vertically, or diagonally) or the board is full (resulting in a draw, although draw detection might not be explicitly implemented).
    *   If a player wins, a win message is displayed, the winning line is highlighted, and the turn indicator disappears.
    *   **Buttons:**
        *   `Home`: Returns to the main menu (`index.html`).
        *   `Reset`: Clears the board and starts a new game in the current mode. In PvE mode, this also signals the backend to restart the AI engine if necessary.
        *   `Save Game`: This button appears only after a game concludes (someone wins). Clicking it opens a modal window prompting for a name for the game record. Enter a name and click "Save" to store the game"s move list and outcome in the database via the backend API. A confirmation or error message will be shown briefly.

3.  **Replay List (`replay-list.html`):**
    *   Accessed via the "Replays" button on the main menu.
    *   This page fetches and displays a list of previously saved game records from the backend.
    *   Each entry typically shows the saved game name and the time it was saved.
    *   Clicking on a specific game record navigates to the replay view (`replay.html`), passing the unique ID of the selected game.

4.  **Replay View (`replay.html`):**
    *   Displays the board for the selected saved game.
    *   Provides controls (e.g., "Next Move", "Previous Move", "Go to Start", "Go to End") to step through the recorded moves.
    *   Each move is visualized on the board, allowing users to retrace the game"s progression.
    *   The final state, including any highlighted winning line, is shown at the end of the replay.



## :building_construction: Architecture

The Web Caro Game employs a client-server architecture:

*   **Frontend:**
    *   Built using standard HTML, CSS, and vanilla JavaScript.
    *   Responsible for rendering the game board, handling user interactions (clicks on cells, button presses), displaying game state (current turn, win messages), and managing navigation between different views (main menu, game board, replay list, replay view).
    *   Communicates with the backend via asynchronous JavaScript requests (Fetch API) to:
        *   Initiate AI moves in PvE mode.
        *   Save completed game records.
        *   Retrieve lists of saved games for replay.
        *   Fetch specific game data for replay visualization.
    *   Key files: `index.html`, `game.html`, `board.html`, `replay-list.html`, `replay.html`, `styles/style.css`, `scripts/board.js`, `scripts/replay-list.js`, `scripts/replay.js`.

*   **Backend:**
    *   Developed using the Python FastAPI framework.
    *   Provides a RESTful API for the frontend.
    *   Manages game state persistence by interacting with a MongoDB database to store and retrieve game records (move lists, win details, timestamps).
    *   Interfaces with the external AI engine (AlphaGomoku) for the PvE mode.
    *   Handles CORS (Cross-Origin Resource Sharing) to allow requests from the browser-based frontend.
    *   Uses `uvicorn` as the ASGI server.
    *   Dependencies are managed via `requirements.txt` (including `fastapi`, `uvicorn`, `motor` for asynchronous MongoDB access, `python-dotenv`).
    *   Key files: `backend/main.py`, `backend/gomoku_engine_interface.py`, `requirements.txt`, `.env` (for configuration).

*   **AI Engine:**
    *   Utilizes the `pbrain-AlphaGomoku` engine, a separate executable program.
    *   Communicates with the backend server via standard input/output (stdin/stdout) using the Gomocup protocol.
    *   The backend (`gomoku_engine_interface.py`) manages the engine"s lifecycle (start, stop, restart) and sends commands (like `START`, `TURN`, `BEGIN`, `BOARD`) to get AI moves based on the current board state.
    *   Located in `backend/AlphaGomoku/`.

*   **Database:**
    *   MongoDB is used for persistent storage of game records.
    *   The backend uses the `motor` asynchronous driver to interact with the database.
    *   Each game record typically stores the match name, a list of moves (coordinates and player symbol), the winning cells (if any), and a timestamp.
    *   The connection details are configured via the `MONGODB_URL` environment variable.



## :link: References

*   **Original Repository:** [https://github.com/ngocthinh09/Web-CaroGame](https://github.com/ngocthinh09/Web-CaroGame)
*   **AI Engine (AlphaGomoku):** [https://github.com/MaciejKozarzewski/AlphaGomoku](https://github.com/MaciejKozarzewski/AlphaGomoku)
*   **FastAPI:** [https://fastapi.tiangolo.com/](https://fastapi.tiangolo.com/)
*   **MongoDB:** [https://www.mongodb.com/](https://www.mongodb.com/)
*   **Motor (Async MongoDB Driver):** [https://motor.readthedocs.io/](https://motor.readthedocs.io/)
