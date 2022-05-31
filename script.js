const Elements = (function () {
    const table = document.querySelector(".table");
    const scores = document.querySelectorAll(".score>div:not(:nth-child(2))");
    const playerNames = document.querySelectorAll(".player-name");
    const isHumanElements = document.querySelectorAll(".player-type.human");
    const isCPUElements = document.querySelectorAll(".player-type.cpu");
    const difficultyElements = [
        document.querySelectorAll(".player-1 .difficulty"),
        document.querySelectorAll(".player-2 .difficulty")]
    const winnerAnnouncer = document.querySelector(".winner-announcer");
    const winnerAnnouncement = document.querySelector(".winner-announcer>p");
    const nameInputs = document.querySelectorAll(".player-name")
    const cells = document.querySelectorAll(".cell");
    const getxFill = function () {
        let x = document.createElement('div');
        x.classList.add('x-inside');
        return x;
    };

    const getoFill = function () {
        let x = document.createElement('div');
        x.classList.add('circle-inside');
        return x;
    };

    const xGhostFill = function () {
        let x = document.createElement('div');
        x.classList.add('x-inside');
        x.style['opacity'] = "0.5";
        return x;
    }();

    const oGhostFill = function () {
        let x = document.createElement('div');
        x.classList.add('circle-inside');
        x.style['opacity'] = "0.5";
        return x;
    }();

    const playAgain = document.querySelector(".play-again");

    const resetButton = document.querySelector(".reset-button");
    return {
        table,
        scores,
        playerNames,
        isHumanElements,
        isCPUElements,
        difficultyElements,
        winnerAnnouncer,
        winnerAnnouncement,
        nameInputs,
        cells,
        getoFill,
        getxFill,
        oGhostFill,
        xGhostFill,
        playAgain,
        resetButton,
    }
})();


function gameStateFactory(players, score, isAcceptingInput, gameOverInfo, boardState , hoverState) {
    return { players, score, isAcceptingInput, gameOverInfo, boardState, hoverState };
}

function getNrOfPlacements(gameState) {
    return gameState.boardState.reduce((previousValue, currentRow) => {
        return previousValue + currentRow.reduce((prev, currentCell) => {
            let val = 0;
            if (currentCell == 1 || currentCell == 2) val = 1;
            return prev + val;
        }, 0);
    }, 0);
}
function getTurn(gameState) {
    let nrOfPlacements = getNrOfPlacements(gameState);
    return nrOfPlacements % 2;
}

function playerFactory(isHuman, difficulty, name) {
    return { isHuman, difficulty, name };
}

function render(gameState) {
    ///render score
    (function () {
        Elements.scores.forEach((score, playerIndex) => {
            score.textContent = gameState.score[playerIndex];
        });
    })();


    ///render player information
    (function () {
        Elements.playerNames.forEach((playerName, playerIndex) => {
            playerName.value = gameState.players[playerIndex].name;
        });

        ///set the human difficulty
        Elements.isHumanElements.forEach((isHumanElement, index) => {
            let color;
            if (gameState.players[index].isHuman) {
                color = 'var(--selected)';
            } else {
                color = 'var(--secondary)';
            }

            isHumanElement.style['background-color'] = color;
        });


        ///set the CPU difficulty elements
        Elements.isCPUElements.forEach((isCPUElement, index) => {
            let color;
            if (!gameState.players[index].isHuman) {
                color = 'var(--selected)';
            } else {
                color = 'var(--secondary)';
            }

            isCPUElement.style['background-color'] = color;

            Elements.difficultyElements[index].forEach((difficultyElement, elementDifficulty) => {
                let color;
                if (gameState.players[index].difficulty === elementDifficulty && (!gameState.players[index].isHuman)) {
                    color = 'var(--selected)';
                } else {
                    color = 'var(--secondary)';
                }

                difficultyElement.style['background-color'] = color;

            });
        });
    })();


    ///render win announcement
    (function () {
        if (gameState.gameOverInfo.isGameOver) {
            Elements.winnerAnnouncer.style['display'] = 'block';
            if (gameState.gameOverInfo.winner === 2) {
                Elements.winnerAnnouncement.textContent = `Its a draw!`;
            } else {
                Elements.winnerAnnouncement.textContent = `${gameState.players[gameState.gameOverInfo.winner].name} Has Won!`;
            }
        } else {
            Elements.winnerAnnouncer.style['display'] = 'none';
        }
    })();


    ///render the cells
    (function () {
        Elements.cells.forEach((cell) => {
            const i = cell.row;
            const j = cell.col;
            if (gameState.boardState[i][j] === 0) {
                cell.replaceChildren();
            }
            if (gameState.boardState[i][j] === 1) {
                cell.replaceChildren(Elements.getxFill());
            }
            if (gameState.boardState[i][j] === 2) {
                cell.replaceChildren(Elements.getoFill());
            }

            if (gameState.hoverState[i][j] === 1 && gameState.boardState[i][j] === 0 && checkIfAcceptingInput(gameState)) {
                let playerMark;
                if (getTurn(gameState) === 0) {
                    playerMark = Elements.xGhostFill;
                } else {
                    playerMark = Elements.oGhostFill;
                }
                cell.replaceChildren(playerMark);
            }
        });
    })();

    ///render reset button
    (function () {
        if (gameState.gameOverInfo.isGameOver) {
            Elements.resetButton.style['display'] = "none";
        } else {
            Elements.resetButton.style['display'] = "block";
        }
    })();

    ///cheks if oppontent move is awaited
    CPUmoveHandler.tryToMakeMove(gameState);
}

///ai move handler

function checkDraw(gameState) {
    return !checkWin(gameState) && getNrOfPlacements(gameState) === gameState.boardState.reduce((prev, current) => prev + current.length, 0);
}


///1 -> player 1 wins from this position if both play optimally
///-1 -> player 2 wins from this position if both play optimally
///0 -> it is a draw from this position if both play optimally
function evaluateWinner(gameState) {

    ///if there is a win on the board, it's assumed that the player who just moved wins,
    ///since that will be the case for all valid positions
    const lastMoved = 1 - getTurn(gameState);
    if (checkWin(gameState)) {
        if (lastMoved === 0) return 1;
        else return -1;
    }

    if (checkDraw(gameState)) {
        return 0;
    }

    const freePositions = getFreePositions(gameState);
    const possibleResults = freePositions.map(([row,col]) => 
        evaluateWinner(makePlay(gameState, row, col))
    );

    if (getTurn(gameState) === 0) { /// we're player 1, so we want to pick a situation with the maximum
        return Math.max(...possibleResults);
    } else {
        return Math.min(...possibleResults);
    }
}
let CPUmoveHandler = (function () {
    let awaitingAImove = false;
    function tryToMakeMove(gameState) {
        if (!gameState.players[getTurn(gameState)].isHuman && !gameState.gameOverInfo.isGameOver && !awaitingAImove) {
            let delay = 500 + Math.floor(Math.random() * 500);
            awaitingAImove = true;
            
            setTimeout(makeCPUmove, delay);
        }
    }

    function getAwaitingAImove() {
        return awaitingAImove;
    }

    function makeCPUmove() {
        awaitingAImove = false;
        if (!gameState.players[getTurn(gameState)].isHuman && !gameState.gameOverInfo.isGameOver && !awaitingAImove) {
            [row, col] = getAImove(gameState);
            gameState = makePlay(gameState, row, col);
            render(gameState);
        }
    }

    return {
        tryToMakeMove,
        getAwaitingAImove,
    }
})();

function changePlayerName(gameState, eventInfo) {
    let newGameState = JSON.parse(JSON.stringify(gameState));
    newGameState.players[eventInfo.playerIndex].name = eventInfo.newPlayerName;
    return newGameState;
}

function changeToCPU(gameState, player) {
    let newGameState = JSON.parse(JSON.stringify(gameState));
    newGameState.players[player].isHuman = false;
    if (newGameState.players[player].difficulty === null) {
        newGameState.players[player].difficulty = 1;
    }
    return newGameState;
}

function changeToDifficulty(gameState, player, difficulty) {
    let newGameState = JSON.parse(JSON.stringify(gameState));
    newGameState.players[player].isHuman = false;
    newGameState.players[player].difficulty = difficulty;
    return newGameState;
}

function changeToHuman(gameState, player) {
    let newGameState = JSON.parse(JSON.stringify(gameState));
    newGameState.players[player].isHuman = true;
    return newGameState;
}
function boardStateFactory(boardState) {

    let board = boardState || [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    return board;
}

function changeBoardAt(board, row, col, newVal) {
    let newBoard = JSON.parse(JSON.stringify(board));
    newBoard[row][col] = newVal;
    return newBoard;
}

function mouseEnterCell(gameState, row, col) {
    const newGameState = JSON.parse(JSON.stringify(gameState));
    newGameState.hoverState[row][col] = 1;
    return newGameState;
}


function mouseLeaveCell(gameState, row, col) {
    const newGameState = JSON.parse(JSON.stringify(gameState));
    newGameState.hoverState[row][col] = 0;
    return newGameState;
}

function checkWin(gameState) { /// just checks for some win, doesn't matter who won
    let checkSame = function (row) {
        return row.every((v) => v === row[0]) && row[0] != 0;
    }
    let someHorizontal = [0, 1, 2].map((row) => {
        return checkSame(gameState.boardState[row]); /// true if it is all the same
    }).reduce((previous, current) => previous || current);

    let someVertical = [0, 1, 2].map((col) => {
        return checkSame(gameState.boardState.map((row) => row[col])); /// true if it is all the same
    }).reduce((previous, current) => previous || current);

    let mainDiagonal = checkSame(gameState.boardState.map((row, i) => row[i]));

    let secondaryDiagonal = checkSame(gameState.boardState.map((row, i) => row[2 - i]));
    return someHorizontal || someVertical || mainDiagonal || secondaryDiagonal;
}


///returns the game state if there was a move made at cell (row,col)
function makePlay(gameState, row, col) {
    let turn = getTurn(gameState);
    let newGameState = JSON.parse(JSON.stringify(gameState));
    newGameState.boardState[row][col] = turn + 1;
    if (checkWin(newGameState)) {
        newGameState.gameOverInfo = {
            isGameOver: true,
            winner: turn,
        }
        newGameState.score[turn] = gameState.score[turn] + 1;
    }

    if (checkDraw(newGameState)) {
        newGameState.gameOverInfo = {
            isGameOver: true,
            winner: 2, /// 2 means draw
        }
    }
    return newGameState;
}

function checkIfAcceptingInput(gameState) {
    return gameState.players[getTurn(gameState)].isHuman && gameState.gameOverInfo.isGameOver == false;
}
///setup goes here, is run on page load


window.onresize = (e) => {
    Elements.table.style['width'] = `${Elements.table.clientHeight}px`;
};
Elements.table.style['width'] = `${Elements.table.clientHeight}px`;

let gameState = gameStateFactory(
    [playerFactory(true, null, "Player 1"), playerFactory(false, 1, "Player 2")],
    [0, 0],
    true,
    { isGameOver: false, winner: null },
    boardStateFactory(),
    boardStateFactory(),
);

///add all the event listeners
Elements.nameInputs.forEach((nameInput, index) => {
    nameInput.addEventListener('keydown', (event) => {
        if (event.keyCode == 13) {
            nameInput.blur();
        }
    });
    nameInput.addEventListener('blur', (e) => {
        gameState = changePlayerName(gameState, {
            playerIndex: index,
            newPlayerName: nameInput.value,
        });

        render(gameState);
    });
});

Elements.isCPUElements.forEach((element, index) => {
    element.addEventListener('click', (e) => {
        gameState = changeToCPU(gameState, index);
        render(gameState);
    });
});

Elements.difficultyElements.forEach((difficultyElement, player) => {
    difficultyElement.forEach((element, difficulty) => {
        element.addEventListener('click', (e) => {
            gameState = changeToDifficulty(gameState, player, difficulty);
            render(gameState);
        });
    });
});

Elements.isHumanElements.forEach((element, player) => {
    element.addEventListener('click', (e) => {
        gameState = changeToHuman(gameState, player);
        render(gameState);
    });
});

function resetGame(gameState) {
    let newGameState = JSON.parse(JSON.stringify(gameState));
    newGameState.boardState = boardStateFactory();
    newGameState.gameOverInfo = {
        isGameOver: false,
        winner: null,
    }
    return newGameState;
}

///returns an array of [col,row] pairs representing the free positions
function getFreePositions(gameState) {
    return gameState.boardState.map((arr, i) => arr.map((val, j) => { return { pos: [i, j], val: val } }).filter(val => val.val === 0)).map(x => x.map(y => y.pos)).reduce((a, b) => a.concat(b));
}

let boardStateMemoization = {};

function getAImove(gameState) {


    ///returns a [row,col] pair which is just a random move on a free spot
    function getRandomMove(gameState) {
        ///transform game state into an array of [i,j] pairs signifying the position of free elements
        let freePositions = getFreePositions(gameState);
        let choice = Math.floor(Math.random() * freePositions.length);
        return freePositions[choice];
    }

    ///checks if any move immediately wins, in which case moves there.
    ///if not, checks if any cell would cause, if the opponent moved there, would cause an immediate loss. If so, moves there
    ///otherwise, moves at a random spot.
    function getIntermediateMove(gameState) {
        const freePositions = getFreePositions(gameState);
        const immediateWins = freePositions.filter( ([row,col]) => {
            return makePlay(gameState, row, col).gameOverInfo.isGameOver === true;
        });
        if (immediateWins.length > 0) {
            return immediateWins[0];
        } else {
            const randomMoveCandidate = getRandomMove(gameState);
            const candidateGameState = makePlay(gameState, randomMoveCandidate[0] , randomMoveCandidate[1]);
            const immediateLoses = getFreePositions(candidateGameState).filter(([row,col]) => {
                let possibleGameOverInfo = makePlay(candidateGameState, row, col).gameOverInfo;
                return possibleGameOverInfo.isGameOver === true && possibleGameOverInfo.winner != 2;
            });
            if (immediateLoses.length > 0) {
                return immediateLoses[0];
            } else {
                return randomMoveCandidate;
            }
        }
    }

    function getBestMove(gameState) {
        const boardStateStringified = JSON.stringify(gameState.boardState);
        if (boardStateStringified in boardStateMemoization) {
            return boardStateMemoization[boardStateStringified];
        }

        let freePositions = getFreePositions(gameState);
        let bestMove = freePositions.reduce((prev, curent) => {
            let prevEvaluation = evaluateWinner(makePlay(gameState, prev[0] , prev[1]));
            let curentEvaluation = evaluateWinner(makePlay(gameState, curent[0] , curent[1]));
            let condition; /// condition that needs to be true to have prev be better than current
            if (getTurn(gameState) === 0) { /// we're player 1, so we want the maximum outcome
                condition = prevEvaluation > curentEvaluation;
            } else {
                condition = prevEvaluation < curentEvaluation
            }
            if (condition) {
                return prev;
            } else {
                return curent;
            }
        });

        boardStateMemoization[boardStateStringified] = bestMove;
        return bestMove;
    }
    let difficulty = gameState.players[getTurn(gameState)].difficulty;
    if (difficulty === 0) {
        ///get random move
        return getRandomMove(gameState);
    } else if (difficulty == 1) {
        return getIntermediateMove(gameState);
    } else if (difficulty == 2) {
        return getBestMove(gameState);
    }
}


Elements.cells.forEach((cell, index) => {
    let row = Math.floor((index) / 3);
    let col = (index) % 3;
    cell.row = row;
    cell.col = col;
    cell.addEventListener('mouseenter', (e) => {
        if (gameState.boardState[row][col] == 0) {
            gameState = mouseEnterCell(gameState, row, col);
            render(gameState);
        }
    });
    cell.addEventListener('mouseleave', (e) => {
        gameState = mouseLeaveCell(gameState, row, col);
        render(gameState);
    });

    cell.addEventListener('click', (e) => {
        if (gameState.boardState[row][col] === 0 && checkIfAcceptingInput(gameState)) {
            gameState = makePlay(gameState, row, col);
            render(gameState);
        }
    });

    Elements.playAgain.addEventListener('click', (e) => {
        gameState = resetGame(gameState);
        render(gameState);
    });

    Elements.resetButton.addEventListener('click', (e) => {
        gameState = resetGame(gameState);
        render(gameState);
    });
});

render(gameState);
