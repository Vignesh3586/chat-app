const express = require("express");
const path = require('path');
const http = require("http");
const socket = require("socket.io");
const createAdapter = require("@socket.io/redis-adapter").createAdapter;
const { createClient } = require("redis");
require("dotenv").config();
const formatMessage = require("./utils/messageFunctions");
const { getCurrentUser, getLeaveUser, getRoomUsers, userJoin,createRoom ,getRoom,removeRoom, getAllRooms} = require("./utils/userFunctions");
const fs=require('fs')
const PORT = process.env.PORT || 4000;
const app = express();
app.use(express.static(path.join(__dirname, "public")));
const server = http.createServer(app);
const io = socket(server);

app.use(express.json());
 
app.get('/rooms',async(req,res)=>{
   try{
    const roomsData=await getAllRooms()
    if(roomsData.rooms &&Array.isArray(roomsData.rooms)&& roomsData.rooms.length>0){
        return res.status(200).json(roomsData.rooms)
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
console.log(`Server starting on port: ${PORT}`);

(async () => {
    try {
        const pubClient = createClient({ url: "redis://127.0.0.1:6379" });
        await pubClient.connect();
        const subClient = pubClient.duplicate();
        io.adapter(createAdapter(pubClient, subClient)); // Adapter setup for Redis
        console.log("Connected to Redis");
    } catch (error) {
        console.error('Error connecting to Redis:', error);
        process.exit(1); // Exit the application if Redis connection fails
    }
})();

const botName = "chatBot";
 
const dataPath = path.join(__dirname,"model","data.json");

const writeFile = async (data) => {
    try {
        await fs.promises.writeFile(dataPath, JSON.stringify(data, null, 2)); // Adding indentation for readability
        console.log("File written successfully");
    } catch (err) {
        console.error("Error writing file:", err);
    }
};

const readFile = async () => {
    try {
        const data = await fs.promises.readFile(dataPath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error(`Error reading file: ${err}`);
        throw err; // Rethrow the error for handling in the calling function
    }
};

io.on("connection", (socket) => {
    console.log("New connection");

    // When a user creates a room
    socket.on('createRoom',async({ room, username }) => {
        try {
            // Log username and room details with proper string interpolation
    
    
            // Create room and get the room and user IDs
            const getRoom = await createRoom(username, room);
            const Room = getRoom.room;
    
            // Store room ID and user ID in a JSON file asynchronously
            const data={ roomid: Room.id, userid: getRoom.userId }

            await writeFile(data)
    
            // Log assigned room ID and user I
    
            // Join the socket to the room
            socket.join(Room.roomName);
              // Send room users and room info
        io.to(Room.roomName).emit("roomUsers", {
            room: Room.roomName,
            users:await getRoomUsers(Room.id),
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
    socket.on("joinRoom",async ({roomid,username}) => {

        const user =await userJoin(roomid,username);

        const roomDetails=await getRoom(user.roomId)
        // Store roomid and userid in the socket object
    
        const data={roomid:roomDetails.id,
            userid: user.id}

         await writeFile(data)


        console.log(`Assigned roomid: ${roomDetails.id}, userid: ${user.id}`);

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
    socket.on("chatMessage",async(message) => {
        // Debugging roomid and userid before usage
        const data= await readFile()
        const roomid=data.roomid;
        const userid=data.userid;


        if (!roomid || !userid) {
            console.error('Room ID or User ID is undefined in chatMessage event');
            socket.emit('error', 'Unable to send message. Please join a room first.');
            return;
        }

        const currentUser = await getCurrentUser(userid);
        const room=await getRoom(roomid)

        if (!currentUser) {
            console.error(`User not found for socket ID: ${roomid}`);
            return;
        }
     
       

        // Emit the message to the room
        io.to(room.roomName).emit("message", formatMessage(currentUser.username, message));
    });

    // When a user disconnects
    socket.on("disconnect", async () => {
        const data=await readFile()
        if(!data){
            console.log("Data is undefined")
            return;
        }
        const roomid = data.roomid;
        const userid = data.userid;
        

        if (!roomid || !userid) {
            console.log('Room ID or User ID is undefined during disconnect');
            return;
        }
        
        const user=await getLeaveUser(userid);
        const room=await getRoom(roomid)
        const roomUsers = await getRoomUsers(user.roomId);

        if(!(roomUsers.length>0)){
            await removeRoom(roomid)
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