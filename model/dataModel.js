const {getDB}=require('../utils/db');
const { v4: uuidv4 } = require('uuid');

const createRoom=async(username,roomname)=>{
    const db=await getDB()
    const uniqueID1 =uuidv4(); // Generate a new unique ID for the room
    const uniqueID2 =uuidv4();
    
    const roomData={
        id: uniqueID1,
        roomName: roomname,
    }

    const user = {
        id:uniqueID2,
        username:username,
        roomId:roomData.id,
    }

    if (!Array.isArray(roomData.users)) {
        roomData.users= [];
    }
   
    roomData.users.push(user)

    await db.collection("rooms").insertOne(roomData)

    return { room: roomData, userId:user.id }; 
}

const getAllRooms=async()=>{
    const db=await getDB()
    const result=await db.collection('rooms').find().toArray()
    return result
}

const getRoomById=async(id)=>{
    const db=await getDB()
    const result=await db.collection('rooms').findOne({id:id})
    return result
}

const getRoomUsers=async(roomId)=>{
    const db=await getDB()
    const result=await db.collection("rooms").findOne({id:roomId})
    return result.users;
}

const getUserById=async(roomid,userid)=>{
    const db=await getDB()
    const result=await db.collection("rooms").findOne({id:roomid,"users.id":userid},{projection:{"users.$":1}})
    return result ? result.users[0] : "User not found";
}

const addUserToRoom=async(roomid,username)=>{
    const db=await getDB()
    const newUser = {id:uuidv4(), username, roomId:roomid }; // Create a new user object

    await db.collection("rooms").updateOne({id:roomid},{$push:{users:newUser}})// Save the updated data back to the file

    return newUser; // Return the new user
}

const removeUserFromRoom=async(roomid,userid)=>{
    const db=await getDB()
    const room=await getRoomById(roomid)
    if(room && room.users.length>0){
        const removeOfUser = room.users.find(user => user.id == userid);
        const result=await db.collection('rooms').updateOne({id:roomid},{$pull:{users:{id:userid}}})
        return result.modifiedCount > 0 ? removeOfUser : "user not found"
    }
    return null;
}

const removeRoom=async(roomid)=>{
    const db=await getDB()
    const result=await db.collection('rooms').deleteOne({id:roomid})
    return result.deletedCount > 0 
}
module.exports={createRoom,removeRoom,getRoomById,getRoomUsers,addUserToRoom,removeUserFromRoom,getAllRooms,getUserById}