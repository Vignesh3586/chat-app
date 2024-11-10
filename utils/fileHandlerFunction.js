
const fs = require('fs').promises;
const path = require('path');

// Path to your db.json file
const roomFilePath = path.join(__dirname, "..", "model", "rooms.json");
const userFilePath = path.join(__dirname, "..", "model", "users.json");


const usersWriteData=async(userData)=>{
    try{

         await fs.writeFile(userFilePath,JSON.stringify(userData),"utf8")
    }catch(err){
        console.error("Error writing to JSON file:",err)
    }
}

// Helper function to write data to the JSON file
const roomsWriteData =async(roomData) => {
    try { 
        await fs.writeFile(roomFilePath, JSON.stringify(roomData), 'utf8'); // Writing the updated data back to the file
    } catch (err) {
        console.error("Error writing to JSON file:", err);
    }
};


// Helper function to read the JSON file
const roomsReadData = async() => {
    try {
        const roomFileData =await fs.readFile(roomFilePath, 'utf8');

        if (!roomFileData) return { rooms: [] };
        return JSON.parse(roomFileData); // Parse the JSON string into an object
    } catch (err) {
        console.error("Error reading JSON file:", err);
        return { rooms: [] }; // Return an empty object if the file is missing or corrupt
    }
};
const usersReadData = async() => {
    try {
        const userFileData =await fs.readFile(userFilePath, 'utf8');

       // Reading the file synchronously
        if (!userFileData ) return { users: []};
        return JSON.parse( userFileData ); // Parse the JSON string into an object
    } catch (err) {
        console.error("Error reading JSON file:", err);
        return { users: [] }; // Return an empty object if the file is missing or corrupt
    }
};



module.exports={usersReadData,usersWriteData,roomsReadData,roomsWriteData}