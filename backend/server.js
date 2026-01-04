import express from 'express'
import 'dotenv/config'
import cors from 'cors'
import http from 'http'
import { connectDB } from './lib/dbConnection.js'
import userRouter from './routes/userRoutes.js'
import chatRouter from './routes/chatRoutes.js'
import { Server } from 'socket.io'


//create Express app and http server
const app = express()
//ye is liye kiya h Q k sockit.io http server ko support krta h 
const server = http.createServer(app)

//Initialize socket.io server
// Socket.io ab is server ke upar real-time connections handle karega.
// "*" Koi bhi frontend / domain connect kar sakta hai.
export const io = new Server(server, {
    cors: { origin: "*" }
})

//store All online user userSocketMap here
//user kaun sa online hai
//aur uska socket.id kya hai
//kis user ko real-time message bhejna hai → uska socketId isi map se milta hai
// ✔ Specific user ko real-time message bhejne ke liye
//✔ "typing..." indicator
//✔ "user online / offline" status
//✔ Private chat send karne ke liye
export const userSocketMap = {}; //{userId:socketId}

//socket.io connection handler
// Jab bhi koi user app open karta hai / connect hota hai → ye function run hota hai.
io.on("connection", (socket) => {
    // Ye line frontend se aaya hua userId read kar rahi hai.
    // Uska userId console me print kar diya jata hai
    const userId = socket.handshake.query.userId
    console.log("User Connected", userId)

    //"Ye user is socket connection se online hai."
    // "Is user ke liye is waqt ye socket.id use ho raha hai."
    // userId → socketId ka relation ban gaya
    if (userId) userSocketMap[userId] = socket.id

    //Emit online users to all connected client
    //Ye line saare connected clients ko online users ki list bhej rahi hoti hai.
    // io.emit ka matlab:👉 Server sab connected users ko message send karegaEvent ka naam:"getOnlineUsers"Ye frontend me receive hoga.
    // Object.keys(userSocketMap)userSocketMap kuch aisa hota hai:
    // {
    //   "user1": "socket12",
    //   "user2": "socket33",
    //   "user3": "socket99"
    // }
    //Ye saare connected clients ko bhejta hai ki kaun kaun online hai
    // Because socket.io ke events text ke naam se pehchane jate hain
    io.emit("getOnlineUsers", Object.keys(userSocketMap))

    //disconnect ek reserved keyword hay jo frontend mai bhi h Socket
    // When user leaves / closes app / internet chala jaye → socket disconnect hota hai:Map me se us user ko delete kar do.Sab users ko updated online user list bhej do.
    // iska matlb ye h na console.log("User Disconnected", userId) delete userSocketMap[userId] k jo user dissconnect hogaya h oski id console mai dekhao or userSocketMap mai se osse delete krdo?? right kaha na maine
    socket.on("disconnect", () => {
        console.log("User Disconnected", userId)
        delete userSocketMap[userId]
        io.emit("getOnlineUsers", Object.keys(userSocketMap))
    })

})

//middleware setup
//mai frontend se bus itni limit confirm krahi hu k frontend se itni mb ki picture data hoga
app.use(express.json({ limit: "4mb" }))
app.use(cors())

//Route setup
// Agar tumhare project me sirf user ka system hai(e.g. signup, login, update profile, authentication check),to sirf ek router — userRouter — hi kaafi hai ✅
app.use("/api/status", (req, res) => res.send("Server is live 🔥..."))
app.use('/api/auth', userRouter)
app.use('/api/chat', chatRouter)


//connect to mongodb
await connectDB()

if (process.env.NODE_ENV !== "production") {
    //Agar dono side true hain, left-side (first one) run hoti hai.OR operator pehla true milte hi ruk jaata hai ✅
    const PORT = process.env.PORT || 5000
    server.listen(PORT, () => console.log('Server is running on PORT:' + PORT))
}
//Export server for vercel
export default server;



