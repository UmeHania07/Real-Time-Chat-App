import { createContext, useEffect, useState } from "react";
import axios from 'axios'
import toast from "react-hot-toast";
import { io } from 'socket.io-client'


// Axios ko bolo ke har request ka backend base URL ye hi hoga.
//Matlab har baar tumhe manually nai likhna padega:
//axios.get("http://localhost:5000/auth/login")

const backendUrl = import.meta.env.VITE_BACKEND_URL
axios.defaults.baseURL = backendUrl


// ✔ Ye global storage / global object banata hai
//✔ React ke andar kahin bhi data share kar sakti ho without props



// Provider = data dene wala
// Context = data ka box
// useContext = box kholne ka tareeqa
// Ye AuthContext = createContext() bas ek khali box hai jisme data rakhna hai.
// Because AuthProvider context nahi deta,AuthProvider sirf provider hai.

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

    //✔ Token browser ke localStorage se le rahi ho.Yani agar user pehle login hua hua hoga → token mil jayega
    const [token, setToken] = useState(localStorage.getItem("token"))
    //User ka data store karega(jaise name, email, etc)
    const [authUser, setAuthUser] = useState(null)
    //Real-time jo users online hain unki list rakhega
    //array is liye banaya Q ke
    //✔ multiple online users hotay hain
    //✔ list store karne ke liye array hota hai
    const [onlineUser, setOnlineUser] = useState([])
    //Yaani app open karte hi socket kaam karne lagta hai. start mai null hota h 
    const [socket, setSocket] = useState(null)

    //Check if the user is authenticated and if so, set the user data and connect the socket
    // ✔ Pehle ensure karo ke user authenticated hai
    //✔ Phir hi socket connect karo
    // ✔ Warna har koi socket connect karke “online” ban jayega without login
    const checkAuth = async () => {
        try {
            // Yahan data property axios ka feature hai, backend ka nahi.
            const { data } = await axios.get("/api/auth/check-authentication")
            if (data.success) {
                setAuthUser(data.user)
                //“User login hoga tabhi socket connect karna hai.”
                connectSocket(data.user)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // login/signup function to handle user authentication and socket connection
    const login = async (state, credential) => {
        try {
            // state  login/signup hay user jo chahy ga
            // frontend ko decide karna hota hai:User signup button press kare → backend ko /signup bhejo
            // User login button press kare → backend ko /login bhejo
            const { data } = await axios.post(`/api/auth/${state}`, credential)
            if (data.success) {
                setAuthUser(data.userData)
                // online/offline status
                // messages
                // live chat
                connectSocket(data.userData)
                axios.defaults.headers.common["token"] = data.token
                setToken(data.token)
                localStorage.setItem("token", data.token) // getItem nahi, setItem use karna
                toast.success(data.message)               // backend success message
            } else {
                toast.error(data.message)                // backend ka error message
            }
        } catch (error) {
            toast.error(error.message)                     // network/server error
        }
    }

    // logout function to handle user logout and socket disconnection
    const logout = async () => {
        localStorage.removeItem("token")
        setToken(null)
        setAuthUser(null)
        setOnlineUser([])
        axios.defaults.headers.common["token"] = null
        toast.success("Logged out successfully")
        // likhti ho → actual connection backend se cut hota hai
        //jab setSocket state socket ko update krta h to logout k time woh disConnect hojata h initial socket null h 
        //setSocket osmai userId dalta h jo connctSocket se araha h 
        socket.disconnect()
    }

    // Update profile function to handle user profile updates

    const updateProfile = async (body) => {
        try {
            const { data } = await axios.put('/api/auth/update-profile', body)
            if (data.success) {
                // authUser state ko backend wale updated user se replace kar deta hai.
                // setAuthUser(data.user) is liye use hota hai taake frontend ka current logged-in user fresh updated data se replace ho jaye.pura user update.
                setAuthUser(data.user)
                toast.success(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // connect socket function to handle socket connection and online users update
    // User Disconnected 6933d879ddbca67c46db6bbb
    // User Connected 6933d879ddbca67c46db6bbb
    //is liye araha h Q ke jab page refresh hota toh user pehly page open hoty he socket connect hota h phir page refresh ya kisi route pe req jati h toh disconnect hota h or phir se connect hojata h 
    const connectSocket = (userData) => {
        // Agar user ka data nahi mila → return Agar socket already connected hai → return.Ye duplicate socket connections se bachata hai.
        // Pehle check karta hai: agar socket already connected hai — dubara mat connect karo
        if (!userData || socket?.connected) return;

        // Naya socket create karta hai
        const newSocket = io(backendUrl, {
            // Backend ko socket ke sath userId bhej raha hai.Taki backend ko pata chale kaun user connect ho raha hai
            //maine is function ko AuthCheck mai call kiya h  take user k login hoty hi socketConnect ho jaye or os mai jo userData hoga os mai se Id lay lo.
            //ye userId word backend wali he honi chaiyee same 
            query: {
                userId: userData._id
            }
        })
        // Ye actual socket connection establish karta hai.
        // Socket global/state me aa jata hai Tum chat me kahin bhi socket ka use kar sakti ho
        newSocket.connect()
        setSocket(newSocket)

        // Online users receive karne ka event set hota hai
        // 👉 Backend jab bhi batayega “ye online users hain”,Tumhari app us list ko setOnlineUser() me rakh degi Tum real-time online list dekh paogi
        //Backend aur frontend dono jagah string bilkul same honi chahiye. Socket.io me event ka naam sirf string hota hai.Socket ko ye nahi pata hota ke tum kya mean kar rahi ho — wo sirf string match karta hai.
        newSocket.on("getOnlineUsers", (userIds) => {
            setOnlineUser(userIds)
        })
    }

    //useEffect → “Page khulte hi ye kaam karo”
    // Jab tumhara React component pehli baar open hota hai,
    // to ye function automatic chalega.Bas 1 hi baar — baar baar nahi.
    useEffect(() => {
        // “Har request me token bhejna zaroori hai, warna backend tumhe authenticated nahi samjhega.”
        // tumne token ko headers me check kiya hua hai, cookies me nahi.Is liye ab token frontend se bhejna zaroori hai.
        // Jab bhi tum code me axios.get(), axios.post(), axios.put(), axios.delete() likhti ho,ye sab requests hoti hain.
        // ✔ Har request ke sath token CHOOPAK kar jaye
        //✔ Backend check kare:
        //const user = jwt.verify(req.headers.token, SECRET_KEY)
        // ✔ Aur bole:
        // “Haan ye valid user hai. Isko request karne do.”
        // Jani, har protected request ke sath token is liye jata hai taake backend ko pata chale ‘ye wohi user hai jo login hua tha’.
        if (token) {
            axios.defaults.headers.common["token"] = token
        }
        checkAuth()
    }, [])


    const value = {
        axios,
        authUser,
        onlineUser,
        socket,
        login,
        logout,
        updateProfile

    }
    //✔ Ye tumhara global wrapper hai
    //✔ Iske andar jitne components honge, wo sab:
    // axios
    // authUser
    // onlineUser
    // socket
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}