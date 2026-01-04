import mongoose from "mongoose";

//function to connect to the mongodb

export const connectDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/chat-app`)
        console.log("Mongodb Is Connected Successfully... ")
    } catch (error) {
        console.log("Failed To Connect Mongodb... " , error.message)
    }
}