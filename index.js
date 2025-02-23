const express = require("express");
const path = require('path');
const http = require("http");
const socket = require("socket.io");
const createAdapter = require("@socket.io/redis-adapter").createAdapter;
const { createClient } = require("redis");
require("dotenv").config();
const formatMessage = require("./utils/messageFunctions");
const { getUserById, removeUserFromRoom, getRoomUsers, addUserToRoom,createRoom ,getRoomById,getAllRooms,removeRoom} = require("./model/dataModel");
const PORT = process.env.PORT
const app = express();
app.use(express.static(path.join(__dirname, "public")));
const server = http.createServer(app);
const io = socket(server);


app.use(express.json());

app.get('/rooms',async(req,res)=>{
   try{
    
    const roomsData=await getAllRooms()
    if(roomsData&&Array.isArray(roomsData)&& roomsData.length>0){
        return res.status(200).json(roomsData)
    }else{
        return res.status(200).json([])
    }
   }catch(err){
    console.error(`Error in getAllRooms:${err}`)
   }  
})

app.get("/",(req,res)=>{
    res.sendFile(path.join(__dirname,"public","login-page.html"))
})

app.get("/chat-box",(req,res)=>{
    res.sendFile(path.join(__dirname,"public","chat-box.html"))
})

app.get('/create-room',(req,res)=>{
    res.sendFile(path.join(__dirname,"public","create-room.html"))
})

const pubClient = createClient({ 
    url: process.env.REDIS_URI,
    socket: { tls: true, 
     },
    connectTimeout: 10000, 
});

(async () => {
    try {
        await pubClient.connect();
        const subClient = pubClient.duplicate();
        io.adapter(createAdapter(pubClient, subClient)); // Adapter setup for Redis
    } catch (error) {
        console.error('Error connecting to Redis:', error);
        process.exit(1); // Exit the application if Redis connection fails
    }
})();

const botName = "chatBot";
 
const storeUserRoom=async(userid,roomid)=>{
    await pubClient.hSet(`user:${userid}`,"roomid",roomid)
}

const getUserRoom=async(userid)=>{
    return await pubClient.hGet(`user:${userid}`,"roomid")
}

const removeUserRoom=async(userid)=>{
    await pubClient.del(`user:${userid}`)
}

io.on("connection", (socket) => {
    console.log("new connection")
    // When a user creates a room
    socket.on('createRoom',async({ roomName, userName }) => {
        try {
            // Log username and room details with proper string interpolation
       
           // Create room and get the room and user IDs
            const getRoom = await createRoom(userName, roomName);
            const Room = getRoom.room;
            socket.userId=getRoom.userId
            socket.roomId=getRoom.room.id
    
            // Store room ID and user ID in a JSON file asynchronously
            const data={ roomid: Room.id, userid: getRoom.userId }

            await storeUserRoom(data.userid,data.roomid)
    
            // Log assigned room ID and user I
    
            // Join the socket to the room
            socket.join(Room.roomName);
              // Send room users and room info
        io.to(Room.roomName).emit("roomUsers", {
            room: Room.roomName,
            users:await getRoomUsers(data.roomid),
        });
            // Emit events to notify the client
            socket.emit('roomCreated', Room.roomName);
            socket.emit("message", formatMessage(botName, "Welcome to the room"));
        } catch (error) {
            console.error("Error creating room or writing to file:", error);
            // Optionally, emit an error event to the client
            socket.emit('error', { message: 'Failed to create room' });
        }
    });

    // When a user joins a room
    socket.on("joinRoom",async ({userName,roomId}) => {
        const user =await addUserToRoom(roomId,userName);
       socket.userId=user.id
       socket.roomId=user.roomId
        const roomDetails=await getRoomById(socket.roomId)
        // Store roomid and userid in the socket object
    
        const data={roomid:roomDetails.id,
            userid: user.id}

         await storeUserRoom(data.userid,data.roomid)


        // Join the room
        socket.join(roomDetails.roomName); // Add socket to the room

        // Welcome current user
        socket.emit("message", formatMessage(botName, "Welcome to ChatApp"));

        // Broadcast to other users when someone connects
        socket.broadcast
            .to(roomDetails.roomName)
            .emit("message", formatMessage(botName, `${user.username} has joined the chat`));

        // Send room users and room info
        io.to(roomDetails.roomName).emit("roomUsers", {
            room: roomDetails.roomName,
            users: await getRoomUsers(roomDetails.id),
        });
    });

    // Listen for chat messages
    socket.on("chatMessage",async({message}) => {
        // Debugging roomid and userid before usage
        const data= await getUserRoom(socket.userId)
       
        if (!socket.roomId|| !socket.userId) {
            console.error('Room ID or User ID is undefined in chatMessage event');
            socket.emit('error', 'Unable to send message. Please join a room first.');
            return;
        }

        const currentUser = await getUserById(socket.roomId,socket.userId);
        const room=await getRoomById(socket.roomId)

        if (!currentUser) {
            console.error(`User not found for socket ID: ${socket.roomId}`);
            return;
        }
     
       

        // Emit the message to the room
        io.to(room.roomName).emit("message", formatMessage(currentUser.username, message));
    });

    // When a user disconnects
    socket.on("disconnect", async() => {
        await removeUserRoom(socket.userId)
    
        const user=await removeUserFromRoom(socket.roomId,socket.userId);
        const room=await getRoomById(socket.roomId)
        const roomUsers = await getRoomUsers(socket.roomId);

        if(!(roomUsers.length>0)){
            await removeRoom(socket.roomId)
            return;
        }

        if (user&&room) {
            io.to(room.roomName).emit("message", formatMessage(botName, `${user.username} has left the chat`));

         // Send updated room users and room info
            io.to(room.roomName).emit("roomUsers", {
                room: room.roomName,
                users: roomUsers,
            });
        }
    });
});



server.listen(PORT, () => console.log("Server is running on port: " + PORT));

 return server

