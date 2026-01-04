import { CHAT } from "../models/chatModel.js"
import { USER } from "../models/userModel.js"
import cloudinary from '../lib/cloudinary.js'
import { io, userSocketMap } from "../server.js"


// Get all user except login user
export const getUsersForSidebar = async (req, res) => {
    try {
        //Ye ID middleware (protectRoute) se milti hai.Jab user login hota hai aur valid token bhejta hai,to middleware req.user me uska data store kar deta hai.Yahan hum usi login user ka ID le rahe hain.Matlab: ye login user ka ID hai.
        const userId = req.user._id
        //Matlab: filteredUsers me login user ke siwa sab users aa jayenge.
        //Example:
        //Agar tum login ho Hania (id = 1)
        //aur db me users hain
        //Ali (id = 2), Sara (id = 3)
        //→ to result hoga: [Ali, Sara]
        //Hania ko chhod ke sab users mil gaye.
        const filteredUsers = await USER.find({ _id: { $ne: userId } }).select('-password')

        //Count number of messages not seen
        // Yahan ek empty object banaya gaya hai jisme har user ke liye unseen messages count store hoga.
        const unseenMessages = {}
        const promises = filteredUsers.map(async (user) => {
            //senderId: user._id Ye wo banda hai jo login user nahi hai Yani ye user message bhejne wala hai.(Ali, Sara)
            //receiverId: userId Ye login user hai Yani message receive karne wala banda.
            //(Tum — jo abhi login ho)
            //seen: false
            //Sirf wo messages jinhay abhi tak dekha nahi gaya (unread)
            //Ye filteredUsers se aata hai.filteredUsers me sab users hain login user ke siwa.Matlab: dusre log (friends, contacts, etc.)
            //senderId: user._id → woh user hai jo login user ke siwah hai (dusra banda — usne message bheja)
            //receiverId: userId → woh banda hai jo abhi system me login hai (current login user — usne message receive kiya)
            //senderId jo login thy onke msg or receiverId jo current system mai login h
            const messages = await CHAT.find({ senderId: user._id, receiverId: userId, seen: false })
            if (messages.length > 0) {
                // (yaani usne login user ko messages bheje hain aur wo abhi tak dekhe nahi gaye),to andar ka code chalega.
                //unseenMessages[user._id] user._id → ye us user ka ID hai jinhone message bheje hain jo login thy.unseenMessages.length ye unseen msg ki length h
                // “Har user ke liye kitne unread messages hain” ye hum ek object unseenMessages me store kar rahe hain.
                //yahn pe maine key value pair deye hn jaise ke "key" : "value"  unseenMessages[user._id] yahn pe mai key derahi hu or messages.length value h k kitne msg aye hn ek user k
                // iska matlab ye h na k const messages = await CHAT.find({ senderId: user._id, receiverId: userId, seen: false }) k login user ko kitne user ne message sent kiya hn
                unseenMessages[user._id] = messages.length
            }
        })
        // Ye line ensure karti hai ke map() ke andar jitne bhi asynchronous operations (database queries) chal rahe hain,
        //wo sab complete ho jayein uske baad hi next code chale.
        // Matlab:“Sab users ke unseen messages count hone ke baad hi final response bhejna.”
        await Promise.all(promises)
        res.json({
            success: true,
            users: filteredUsers,
            unseenMessages
        })
    } catch (error) {
        console.log(error.message)
        return res.json({
            success: false,
            message: 'Failed to fatch users'
        })
    }
}

//Get all th messages for selected user
export const getMessages = async (req, res) => {
    try {
        //Aur yahan se selectedUser = "675ab12d8f9" Matlab:Jis user ke saath chat dekhni hai, us ID ki all messages mujy mil jaye gy.
        const { id: selectedUser } = req.params
        // Ye login user ka ID hai (jo abhi system me logged in hai).Ye middleware (protectRoute) ke through req.user me aaya hota hai.
        const myId = req.user._id
        //ye all messages display krega myId or selectedUser ke 
        // Ye query CHAT collection me messages dhoondh rahi hai. Aur $or ka matlab hota hai —“agar in dono me se koi ek condition true ho, to wo document le aao.”
        const messages = await CHAT.find({
            $or: [
                // Mujhe wo sab messages do jahan:
                //Maine bheje ho selected user ko
                //(senderId: myId, receiverId: selectedUser)ya
                //Selected user ne bheje ho mujhe
                // (senderId: selectedUser, receiverId: myId)
                //messages me ab dono taraf ke (sent + received) messages aa jayenge,taake tum chat box me complete conversation dikha sako 💬
                { senderId: myId, receiverId: selectedUser },
                { senderId: selectedUser, receiverId: myId },
            ]
        })
        await CHAT.updateMany({ senderId: selectedUser, receiverId: myId }, { seen: true })
        res.json({
            success: true,
            messages
        })

    } catch (error) {
        console.log(error.message)
        return res.json({
            success: false,
            message: 'Failed to fatch all messages'
        })
    }
}

//api to mark message as seen using message id
export const markMessageAsSeen = async (req, res) => {
    try {
        //Ye message ki ID hai
        //aur ye message document ka ID hai.
        const { id } = req.params
        //Jo message abhi open ya read hua hai — bas usi ko update karega.
        //ye seen ka status dusre user ko dikhega  
        await CHAT.findByIdAndUpdate(id, { seen: true })
        res.json({
            success: true
        })

    } catch (error) {
        console.log(error.message)
        return res.json({
            success: false
        })
    }
}

// sent a message to selectdUser 
export const sentMessage = async (req, res) => {
    try {
        const { text, image } = req.body
        // Route mein kuch aisa hoga:router.post("/message/:id", sendMessage);:id URL ke parameter se aata hai.
        //jis user ko message bhejna hai, uski ID.
        const receiverId = req.params.id
        //ye middleware se arahi h
        //kaun message bhej raha hai current logged-in user
        // Agar token valid ho → req.user mein current logged-in user ki details store ho jati hain.Isi req.user ke andar _id hota hai.
        const senderId = req.user._id
        // ✔ Kon message bhej raha hai
        //✔ Kisko bhej raha hai
        let imageURL;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image)
            imageURL = uploadResponse.secure_url
        }

        //new message store hoga database mai 
        const newMessage = await CHAT.create({
            senderId,
            receiverId,
            text,
            image: imageURL
        })

        //Emit the new message to the receivers socket
        // Online = real-time message
        // Offline = stored message, baad me show hoga
        // Har online user ka socket.id hota hai
        //userSocketMap ek object hota hai jisme har user ki ID → socket.id save hoti hai
        // Isliye kyunki JavaScript me square brackets [] sirf array ke liye nahi hote.[] ka matlab hota hai:“Is object ki key ka value do.”
        //finaaly mai yahan pe receiverId le rahi hu jis ko message bhej rahy hn 
        const receiverSocketId = userSocketMap[receiverId]
        // Agar receiver online hai to he message bhejna."
        //Agar receiver online nahi hai → socket.id nahi milega → real-time message nahi milega.
        // Is line ka kaam:
        // Receiver user ki current socket.id nikaalna
        // “Woh online hai ya nahi” check karna
        if (receiverSocketId) {
            //real-time mai jis banday ko message bheja h ose he he online hone k bad show ho
            // “Message is specific socket (specific banda) ko bhejna hai, sabko nahi.”
            //Because socket.io ke events text ke naam se pehchane jate hain
            // Agar receiver online hai → message turant unke socket pe chala jaye
            // Agar offline hai → database me save hai, next time fetch hoga
            io.to(receiverSocketId).emit("newMessage", newMessage)
        }
        res.json({
            success: true,
            newMessage
        })

    } catch (error) {
        console.log(error.message)
        return res.json({
            success: false,
            message: 'Message could not be delivered. Please try again'
        })
    }
}
