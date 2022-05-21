const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const cors = require('cors');

const { Server } = require("socket.io");
const io = new Server(server);

const { createRoom, getRoom, deleteRoom } = require('./rooms');

function isDraw(board) {
    let isSpace = false;
    for (let i = 0; i < board.length; i++) {
        const tile = board[i];
        if (tile == "") {
            isSpace = true;
        }
    }


    return (!isSpace) ? "draw" : undefined;
}


function checkWinner(board, turnMark) {
    console.log("checkingWinner");
    if (!board) return;
    const winPossibility = [
        board[0] + board[1] + board[2],
        board[3] + board[4] + board[5],
        board[6] + board[7] + board[8],
        board[0] + board[3] + board[6],
        board[1] + board[4] + board[7],
        board[2] + board[5] + board[8],
        board[0] + board[4] + board[8],
        board[6] + board[4] + board[2]
    ]


    for (let i = 0; i < winPossibility.length; i++) {
        const possibility = winPossibility[i];
        if (possibility == turnMark + turnMark + turnMark) {
            console.log("winner!! :" + turnMark);
            return "win";
        }
        console.log(`possibility: ${possibility} us: ${turnMark+turnMark+turnMark}`)
    }

    return undefined;
}
app.use(cors());

app.get('/', (req, res) => {
    res.sendFile('html/home.html', { root: __dirname })
});


io.of('/home').on('connection', (socket) => {
    console.log("HOME SOCKET CONNECTED | " + socket.id);
    socket.on('create room', () => {
        const roomLink = createRoom();
        console.log(roomLink);
        socket.emit('create room', roomLink)
    })

})


app.get('/game/:roomlink', (req, res) => {
    res.sendFile('html/game.html', { root: __dirname });

})

io.of('/game/').on('connection', (socket) => {
    socket.on('joined room', (roomUUID) => {
        const roomDB = getRoom(roomUUID);
        if (!roomDB) { socket.emit("room not found"); return; }
        roomDB.counter++;
        console.log(socket.id + " joined room " + roomUUID);
        console.log(roomDB.counter);

        if (roomDB.counter > 2) {
            socket.emit("room is full")
            return
        }

        if (roomDB.counter == 1) {
            roomDB.host = socket.id;
            roomDB.turn = socket.id;
        }


        socket.join(roomUUID);
        console.log(socket.rooms)

        if (roomDB.counter == 2) {
            console.log("Both Players!")
            roomDB.opponent = socket.id;
            socket.to(roomUUID).emit('ready to play')
            socket.emit('ready to play');

            socket.to(roomDB.turn).emit('your-turn');


        }



    });

    socket.on("disconnecting", () => {
        console.log(socket.id + " DISCONNECTED")
        console.log(socket.rooms); // the Set contains at least the socket ID
        socket.rooms.forEach(room => {
            socket.leave(room);
            const roomDB = getRoom(room);
            if (roomDB) {
                roomDB.counter--;
                socket.to(roomDB.roomUUID).emit('disconnected')
                deleteRoom(roomDB.roomUUID);

            }
        });
        console.log(socket.rooms);


    });


    socket.on("move:make", (roomUUID, tileID) => {
        const roomDB = getRoom(roomUUID);
        let info = {};

        if (!roomDB) { socket.emit('room not found'); return; }
        if (!roomDB.opponent) return;
        console.log(`turn: ${roomDB.turn}, socketID: ${socket.id}, tileID: ${tileID}`);

        if (socket.id != roomDB.turn) return;

        if (roomDB.board[tileID] == "") roomDB.board[tileID] = roomDB.turnMark;
        else return;

        let result = checkWinner(roomDB.board, roomDB.turnMark) || isDraw(roomDB.board);

        if (result != undefined) {
            console.log(result);
            socket.to(roomUUID).emit('game-status', result, roomDB.turnMark);
            socket.emit('game-status', result, roomDB.turnMark);

            deleteRoom(roomUUID);
        }

        switch (socket.id) {
            case roomDB.host:
                roomDB.turn = roomDB.opponent;
                roomDB.turnMark = "X";
                break;
            case roomDB.opponent:
                roomDB.turn = roomDB.host;
                roomDB.turnMark = "O";
                break;
        }

        socket.to(roomUUID).emit('update board', roomDB.board);
        socket.emit('update board', roomDB.board)
        socket.to(roomDB.turn).emit('your-turn');


        // socket.broadcast.to(roomDB.turn).emit('your turn');
    })
});






server.listen(3000, () => {
    console.log('listening on *:3000');
});