import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";



export const ChatContext = createContext()

export const ChatProvider = ({ children }) => {

    const [messages, setMessages] = useState([])
    const [users, setUsers] = useState([])
    const [selectedUser, setSelectedUser] = useState(null)
    const [unSeenMessages, setUnSeenMessages] = useState({})

    const { socket, axios } = useContext(AuthContext)

    // function to get all users for sidebar
    const getUsers = async () => {
        try {
            //maine AuthContext mai axios ki setting krli h ba s mai ise jaha chaho use krskhti hu
            const { data } = await axios.get('/api/chat/users')
            if (data.success) {
                setUsers(data.users)
                setUnSeenMessages(data.unseenMessages)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // get to all messages for selected user
    const getMessages = async (userId) => {
        try {
            const { data } = await axios.get(`/api/chat/${userId}`)
            if (data.success) {
                setMessages(data.messages)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    //function to set message to selected user
    const sentMessage = async (messageData) => {
        try {
            //pehly userSelect kregy phir ose message type krey post Q ke message sent krna h or phir messageData 
            const { data } = await axios.post(`/api/chat/sent/${selectedUser._id}`, messageData)
            if (data.success) {
                // purane messages hngy osmai or new messages add hojaye gy
                setMessages((prevMessages) => [...prevMessages, data.newMessage])
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
        }
    }

    // function to subscribe to messages for selected user
    // Jab bhi naya message aaye, ye function react karta hai.Usually chat screen open hote hi call hota hai
    const subscribeToMessage = async () => {
        //Matlab: jab tak socket connect na ho, message sun’na possible nahi  
        if (!socket) return

        //Because socket.io ke events text ke naam se pehchane jate hain
        socket.on("newMessage", (newMessage) => {
            // dekho mere pass AuthContext se araha h ye socket jo current login h oske ander h userId pura document h os mai se senderId or selectedUserId same ho or oska message seen hojaye bas seen hojayega screen pe or DB mai
            // Iska matlab:koi user selected hai (chat open hai)AND jo message aya hai wo usi user ka hai jiska chat open hai Matlab:user usi chat ko dekh raha hai
            // Agar receiver online hai → message turant unke socket pe chala jaye
            // Agar offline hai → database me save hai, next time fetch hoga
            if (selectedUser && newMessage.senderId === selectedUser._id) {
                // Koi API call nahi → ye temporary state update hai.DB me permanent mark karna
                newMessage.seen = true
                setMessages((prevMessage) => [...prevMessage, newMessage])
                // only perticular message marked as True
                axios.put(`/api/chat/mark/${newMessage._id}`)
            } else {
                // “unseen messages count” update karne ka logic
                // unSeenMessages state me har sender ke unseen messages ka count store hota hai
                // Existing unseen counts ko spread karna Taaki pehle wale data delete na ho jaye
                // Agar is sender ke liye already unseen messages hain → 1 add karo
                // Agar nahi → 1 set karo (pehla unseen message)
                // senderId jitne bhi mesage sent krega utne he unseen message count hongy wrna only one message unseen hoga
                setUnSeenMessages((prevUnseenMessages) => ({
                    ...prevUnseenMessages, [newMessage.senderId]:
                        prevUnseenMessages[newMessage.senderId] ? prevUnseenMessages[newMessage.senderId] + 1 : 1
                }))
            }
        })
    }

    // function to unSubscribe from messages
    const unSubscribeFromMessages = () => {
        // Ye ek function hai Iska kaam: messages sunna band karna
        // Matlab:“Jo function newMessage sun raha tha, usko hata do”
        // Socket connection abhi bhi ON hota hai
        // Ali: Hello
        // Screen pe show hota hai
        // Tum Ali ki chat band karti ho
        // aur Sara ki chat open karti ho
        // “Ali ke messages sunna band karo”
        // Ali: Are you there?
        // ❌ Screen pe show nahi hota
        // ❌ Kyun?
        // Kyunki newMessage listener OFF hai
        if (socket) socket.off('newMessage')
    }

    // "newMessage" sun’na band karo Jaise phone ka volume mute kar dena Taaki ek hi message baar baar repeat na ho
    // Ali ki chat band karti ho Sara ki chat open karti ho Ab app ko Ali ke messages sunte rehna nahi chahiye
    // Ali ke messages sunna band karo”
    //“Sara ke messages suno”
    useEffect(() => {
        subscribeToMessage()

        return () => {
            // jab chat change hoti h Yahan app bol rahi hoti hai: Jo purana socket listener laga tha Usko remove kar do
            unSubscribeFromMessages()
        }
        // socket kyun diya?
        // App open hui
        // Socket baad me connect hota hai
        // Agar [socket] na do:
        // subscribeToMessage() kabhi nahi chalega
        // Messages sunne hi nahi lagenge 
        // Taaki socket milte hi listener lag jaye

        // selectedUser kyun diya
        // Tum Ali ki chat dekh rahi ho
        // Phir Sara ki chat open karti ho
        // Agar[selectedUser] na do:
        // Ali ka listener laga rahega
        // Sara ka listener bhi lag jayega
        // ❌ Confusion
        // ❌ Duplicate / wrong messages
    }, [socket, selectedUser])



    const value = {
        messages,
        users,
        selectedUser,
        setSelectedUser,
        getUsers,
        getMessages,
        sentMessage,
        unSeenMessages,
        setUnSeenMessages
    }

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    )
}