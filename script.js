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


function gameStateFactory(players, score, isAcceptingInput, gameOverInfo, boardState) {
    return { players, score, isAcceptingInput, gameOverInfo, boardState };
}

function getTurn(gameState) {
    let nrOfPlacements = gameState.boardState.reduce((previousValue, currentRow) => {
        return previousValue + currentRow.reduce((prev, currentCell) => {
            let val = 0;
            if (currentCell == 1 || currentCell == 2) val = 1;
            return prev + val;
        } , 0);
    }, 0);
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
            Elements.winnerAnnouncement.textContent = `${gameState.players[gameState.gameOverInfo.winner].name} Has Won!`;
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
        });
    })();

    ///render reset button
    (function() {
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
let CPUmoveHandler = (function() {
    let awaitingAImove = false;
    function tryToMakeMove(gameState) {
        if (!gameState.players[getTurn(gameState)].isHuman && !gameState.gameOverInfo.isGameOver && !awaitingAImove) {
            let delay = 500 + Math.floor(Math.random() * 500);
            awaitingAImove = true;
            setTimeout(makeCPUmove , delay);
        }
    }

    function makeCPUmove() {
        awaitingAImove = false;
        [row,col] = getAImove(gameState);
        gameState = makePlay(gameState , row, col);
        render(gameState);
    }

    return {
        tryToMakeMove
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
    newGameState.boardState[row][col].isHovering = true;
    return newGameState;
}


function mouseLeaveCell(gameState, row, col) {
    const newGameState = JSON.parse(JSON.stringify(gameState));
    newGameState.boardState[row][col].isHovering = false;
    return newGameState;
}

function checkWin(gameState) { /// just checks for some win, doesn't matter who won
    let checkSame = function(row) {
        return row.every( (v) => v === row[0] ) && row[0] != 0;
    }
    let someHorizontal = [0,1,2].map((row) => {
        return checkSame(gameState.boardState[row]); /// true if it is all the same
    }).reduce((previous, current) => previous || current);
    
    let someVertical = [0,1,2].map((col) => {
        return checkSame(gameState.boardState.map((row) => row[col])); /// true if it is all the same
    }).reduce((previous, current) => previous || current);

    let mainDiagonal = checkSame(gameState.boardState.map((row , i) => row[i]));

    let secondaryDiagonal =  checkSame(gameState.boardState.map((row , i) => row[2 - i]));
    return someHorizontal || someVertical || mainDiagonal || secondaryDiagonal;
}
function makePlay(gameState, row, col) {
    let turn = getTurn(gameState);
    let newGameState = JSON.parse(JSON.stringify(gameState));
    newGameState.boardState[row][col] = turn + 1;
    if (checkWin(newGameState)) {
        newGameState.gameOverInfo = {
            isGameOver : true,
            winner : turn,
        }
        newGameState.score[turn] = gameState.score[turn] + 1;
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
    boardStateFactory()
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
        isGameOver : false,
        winner : null,
    }
    return newGameState;
}

function getAImove(gameState) {
    function getRandomMove(gameState) {
        ///transform game state into an array of [i,j] pairs signifying the position of free elements
        let freePositions = gameState.boardState.map((arr,i) => arr.map((val,j) => {return {pos : [i,j] , val : val}}).filter(val => val.val === 0)).map(x => x.map(y =>y.pos)).reduce((a,b) => a.concat(b));
        let choice = Math.floor(Math.random() * freePositions.length);
        return freePositions[choice];
    }

    let difficulty = gameState.players[getTurn(gameState)].difficulty;
    if (difficulty === 0) {
        ///get random move
        return getRandomMove(gameState);
    }
}

Elements.cells.forEach((cell, index) => {
    let row = Math.floor((index) / 3);
    let col = (index) % 3;
    cell.row = row;
    cell.col = col;
    cell.addEventListener('mouseenter', (e) => {
        if (gameState.boardState[row][col] == 0 && checkIfAcceptingInput(gameState)) {
            let playerMark;
            if (getTurn(gameState) === 0) {
                playerMark = Elements.xGhostFill;
            } else {
                playerMark = Elements.oGhostFill;
            }
            cell.replaceChildren(playerMark);
        }
    });
    cell.addEventListener('mouseleave', (e) => {
        if (gameState.boardState[row][col] == 0) {
            cell.replaceChildren();
        }
    });

    cell.addEventListener('click', (e) => {
        if (gameState.boardState[row][col] === 0 && checkIfAcceptingInput(gameState)) {
            gameState = makePlay(gameState, row, col);
            render(gameState);
        }
    });

    Elements.playAgain.addEventListener('click' , (e) => {
        gameState = resetGame(gameState);
        render(gameState);
    });

    Elements.resetButton.addEventListener('click' , (e) => {
        gameState = resetGame(gameState);
        render(gameState);
    });
});

render(gameState);
