import React, { useContext, useEffect, useRef, useState } from 'react'
import assets, { messagesDummyData } from '../assets/assets'
import { formatMessageTime } from '../lib/utils'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const ChatContainer = () => {

    const { messages, selectedUser, setSelectedUser, sentMessage, getMessages } = useContext(ChatContext)
    const { authUser, onlineUser } = useContext(AuthContext)

    const scrollEnd = useRef()

    const [input, setInput] = useState("")

    // handle sending a message 
    const handleSendMessage = async (e) => {
        // Ye function form submit handle karta hai, empty message ko block karta hai, message bhejta hai, aur input clear karta hai
        e.preventDefault()
        if (input.trim() === "") return null

        await sentMessage({ text: input.trim() })
        setInput("")
    }

    // handle sending an image
    const handleSendImage = async (e) => {
        // User ne jo pehli image select ki hai, wo uthao
        const file = e.target.files[0]
        if (!file || !file.type.startsWith("image/")) {
            // startsWith("image/") check karta hai:
            // “Kya ye image hai?”
            toast.error("Select an image file")
            return
        }
        // Browser ka tool File ko read / convert karne ke liye
        // Image ko URL jaisa string (Base64 / Data URL) me convert kiya jata hai
        //Phir us string ko backend ko bhej diya jata hai
        const reader = new FileReader()
        reader.onloadend = async () => {
            // image ko Base64 string bana deta hai
            // wahi string backend ko bhej di jati hai
            await sentMessage({ image: reader.result })
            // File input se selected file ko clear karti hai Browser ko bolti hai:
            // “Ab koi file select nahi hai”
            e.target.value = ""
        }
        // “Is image ko Data URL (string) bana do”
        reader.readAsDataURL(file)
    }

    useEffect(() => {
        if (selectedUser) {
            getMessages(selectedUser._id)
        }
        // [selectedUser] → React ko batata hai: “Sirf tab ye effect chalao jab selectedUser ka value change ho.”
        //agr mai selectedUser nhi do toh aap ke getMessages function me naya selectedUser ke messages fetch nahi honge.
    }, [selectedUser])

    useEffect(() => {
        if (scrollEnd.current && messages) {
            //ye line automatically scroll bar ko neeche le jati hai, jahan wo <div ref={scrollEnd}> rakha hua hai.
            scrollEnd.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages])


    return selectedUser ? (

        <div className='h-full overflow-scroll relative backdrop-blur-lg'>
            {/* Header */}
            <div className='flex items-center gap-3 py-3 mx-4 border-b border-stone-500'>
                <img src={selectedUser.profilePic || assets.avatar_icon} alt="" className='w-8 rounded-full' />
                <p className='flex-1 text-lg text-white flex items-center gap-2'>{selectedUser.fullName}{onlineUser.includes(selectedUser._id) && <span className='w-2 h-2 rounded-full bg-green-500'></span>}</p>
                <img onClick={() => setSelectedUser(null)} src={assets.arrow_icon} alt="" className='md:hidden max-w-7' />
                <img src={assets.help_icon} alt="" className='max-md:hidden max-w-5 cursor-pointer' />
            </div>
            {/* ChatArea */}
            {/* 100% ka matlab — poori available height (e.g. screen ya parent container ki height).calc(100% - 120px) ka matlab — “poori height me se 120px kam kar do.”Element ki height utni hogi jitni parent ki height hai, minus 120 pixels. */}
            {/* Agar vertical (y-axis) direction me content zyada ho jaye, toh scroll bar dikhadoAgar div ke andar ka content height se bada ho gaya, toh scroll karne ka option milega. */}
            <div className='flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6'>
                {
                    // Agar message current user ne bheja → justify-end se wo right side pe aayega.
                    //Agar message dusre user ne bheja → flex-row-reverse lag jaayega, aur message + avatar left side pe shift ho jaayenge.
                    //Is se basically chat bubbles left/right side dikhte hain — jaise WhatsApp me hota hai.
                    messages.map((msg, index) => (
                        // Agar message current user ka nahi hai(yaani kisi aur ne bheja hai),to us message ka layout ulta (reverse) kar do.
                        <div key={index} className={`flex items-end gap-2 justify-end ${msg.senderId !== authUser._id && 'flex-row-reverse'}`}>
                            {msg.image ? (
                                <img src={msg.image} alt="" className='max-w-[200px] border border-gray-700 rouneded-lg overflow-hidden mb-8' />
                            ) : (
                                <p className={`p-2 max-w-[200px] md:text-sm font-light rounded-lg mb-8 break-all bg-violet-500/30 text-white ${msg.senderId === authUser._id ? 'rounded-br-none' : 'rounded-bl-none'}`}>{msg.text}</p>
                            )}
                            <div className='text-center text-xs'>
                                {/* dono ki chatBox mai profile pic show hogi */}
                                <img src={msg.senderId === authUser._id ? authUser.profilePic || assets.avatar_icon : selectedUser?.profilePic || assets.avatar_icon} alt="" className='w-7 rounded-full' />
                                {/* msg.createdAt as a argument bheja h jo maine date parameter se get kiya h  */}
                                <p className='text-gray-500'>{formatMessageTime(msg.createdAt)}</p>
                            </div>
                        </div>
                    ))
                }
                {/* Jaise hi tumhara chat open hota hai (ya new message aata hai),
chat area automatically neeche scroll ho jata hai —
WhatsApp ya Messenger jaise effect milta hai. */}
                <div ref={scrollEnd}>

                </div>
            </div>

            {/* Bottom Area */}
            <div className='absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3'>
                <div className='flex-1 flex items-center bg-gray-100/12 px-3 rounded-full'>
                    <input type="text" onChange={(e) => setInput(e.target.value)} value={input}
                        // Jab user Enter key dabaye → message send ho jaye
                        onKeyDown={(e) => e.key === "Enter" ? handleSendMessage(e) : null} placeholder='Type a message' className='flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400' />
                    {/* label tag ka htmlFor attribute us input ke id se connect karta hai.
Matlab jab user label pe click kare, toh linked input automatically activate ho jaye.id ek unique identifier hota hai HTML element ke liye.
Matlab har element ka apna naam ya pehchan hota hai. */}
                    <input type="file" onChange={handleSendImage} id='image' accept='image/png , image/jpeg' hidden />
                    <label htmlFor="image">
                        <img src={assets.gallery_icon} alt="" className='w-5 mr-2 cursor-pointer' />
                    </label>
                </div>
                <img onClick={handleSendMessage} src={assets.send_button} alt="" className='w-7 cursor-pointer' />
            </div>


        </div>
    ) : (
        <div className='flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden'>
            <img src={assets.logo_icon} alt="" className='max-w-16' />
            <p className='text-lg font-medium text-white'>Chat anytime, anywhere</p>
        </div>

    )
}

export default ChatContainer
