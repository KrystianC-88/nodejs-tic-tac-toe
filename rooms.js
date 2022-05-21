const short = require('short-uuid');

const rooms = [];

const createRoom = (hostID) => {
    const roomUUID = short.generate();
    const counter = 0;
    rooms.push({
        roomUUID,
        counter,
        host: hostID,
        opponent: undefined,
        board: [
            "", "", "",
            "", "", "",
            "", "", ""
        ],
        turn: hostID, // socket.id 
        turnMark: "O"
    });
    return roomUUID
}


// const addUser = (id, name, room) => {
//     const existingUser = users.find(user => user.name.trim().toLowerCase() === name.trim().toLowerCase())

//     if (existingUser) return { error: "Username has already been taken" }
//     if (!name && !room) return { error: "Username and room are required" }
//     if (!name) return { error: "Username is required" }
//     if (!room) return { error: "Room is required" }

//     const user = { id, name, room }
//     users.push(user)
//     return { user }
// }

const getRoom = roomUUID => {
    let room = rooms.find(room => room.roomUUID == roomUUID)
    return room
}


const deleteRoom = (roomUUID) => {
    const index = rooms.findIndex((room) => room.roomUUID === roomUUID);
    if (index !== -1) return rooms.splice(index, 1)[0];
}

// const getUsers = (room) => users.filter(user => user.room === room)

module.exports = { createRoom, getRoom, deleteRoom }