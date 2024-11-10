const { v4: uuidv4 } = require('uuid');
const {usersReadData,usersWriteData,roomsReadData,roomsWriteData}=require("./fileHandlerFunction")

// Create a new room and add the first user to it
const createRoom = async (username, room) => {
    const roomData = await roomsReadData();
    const userData=await usersReadData()
    const uniqueID1 =uuidv4(); // Generate a new unique ID for the room
    const uniqueID2 =uuidv4();

    const Room = {
        id: uniqueID1,
        roomName: room,
    };

    const user = {
        id:uniqueID2,
        username:username,
        roomId:Room.id,
    }
    if (!Array.isArray(userData.users)) {
        userData.users= [];
    }
   
    userData.users.push(user)

    try {
        await usersWriteData(userData);
    } catch (error) {
        console.error("Failed to write user data:", error);
    }



    if (!Array.isArray(roomData.rooms)) {
        roomData.rooms = [];
    }
    roomData.rooms.push(Room)
    try {
        await roomsWriteData(roomData);
    } catch (error) {
        console.error("Failed to write room data:", error);
    }

    return { room: Room, userId:user.id }; // Return the room details and the user's ID
};

const getAllRooms=async()=>{
    const roomData = await roomsReadData(); 
    return roomData
}
// Get room by ID
const getRoom = async (id) => {
    const roomData = await roomsReadData(); // Read the current data
    return roomData.rooms.find(room => room.id == id); // Find and return the room by ID
};



// Add a user to an existing room
const userJoin = async (roomid, username) => {
    const room=await getRoom(roomid)
    const userData = await usersReadData();
    const newUser = {id:uuidv4(), username, roomId:room.id }; // Create a new user object
    userData.users.push(newUser) // Add the user to the room

    await usersWriteData(userData); // Save the updated data back to the file

    return newUser; // Return the new user
};

// Get the current user by room ID and user ID
const getCurrentUser = async (userid) => {
    const userData = await usersReadData();
    return userData.users.find(user=>user.id== userid) // Find and return the user by user ID
};

// Remove a user from a room
const getLeaveUser = async (userid) => {
    const userData = await usersReadData(); // Read the current data
    if(userData.users.length>0){
        const indexOfUser = userData.users.findIndex(user => user.id == userid);
        // Find the index of the user in the room
       if (indexOfUser !== -1) {
           const removedUser = userData.users.splice(indexOfUser, 1)[0]; // Remove the user and return the removed user
           await usersWriteData(userData); // Save the updated data back to the file
           return removedUser;
       }else{
           const removedUser = userData.users.splice(0, 1)[0]; // Remove the user and return the removed user
           await usersWriteData(userData); // Save the updated data back to the file
           return removedUser;
       }
    }
    return null;
};

const removeRoom=async(roomid)=>{
    const roomsData=await roomsReadData()
    const indexOfRoom=roomsData.rooms.findIndex(room=>room.id==roomid)
    if(indexOfRoom!=-1){
       roomsData.rooms.splice(indexOfRoom,1)
       await roomsWriteData(roomsData)
    }  
}
// Get all users in a room
const getRoomUsers = async (roomid) => {
    const room = await getRoom(roomid);
    const userData = await usersReadData(); 
    const roomUsers=userData.users.filter(user=>user.roomId==room.id)
    return roomUsers? roomUsers : []; // Return the users if the room exists, otherwise return an empty array
};

module.exports = { userJoin, getCurrentUser, getLeaveUser, getRoomUsers, createRoom,getRoom ,removeRoom,getAllRooms};
