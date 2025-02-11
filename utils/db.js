const mongoClient=require('mongodb').MongoClient
require("dotenv").config();
const MONGO_URI=process.env.MONGO_URI

let dbo;
const connectDB=async()=>{
    try{
        const client=await mongoClient.connect(MONGO_URI)
        dbo=client.db("mydb")
        await dbo.createCollection("rooms")  
    }catch(err){
        console.error(`Error:${err.message}`)
        process.exit(1)
    }    
}


const getDB=()=>{
    if (!dbo) {
        throw new Error("Database not initialized. Call connectDB() first.");
    }
    return dbo
}

module.exports={connectDB,getDB}