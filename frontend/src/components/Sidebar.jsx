import React, { useContext, useEffect, useState } from 'react'
import assets from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { ChatContext } from '../../context/ChatContext'

const Sidebar = () => {

    const { users, getUsers, selectedUser, setSelectedUser, unSeenMessages, setUnSeenMessages } = useContext(ChatContext)
    const { logout, onlineUser } = useContext(AuthContext)
    const [input, setInput] = useState(false)
    const navigate = useNavigate()


    // input = "ali" users list filter ho jaati hai Sirf wo users dikhenge jin ka naam "ali" contain karta ho
    // users = ["Ali", "Sara", "Alina"]
    // filterUsers = ["Ali", "Alina"]
    // agr search box khali h toh To:
    // filterUsers = users
    // Yani poori list show
    const filterUsers = input ?
        // input.toLowerCase() → search text ko bhi small letters mai convert
        users.filter((user) => user.fullName.toLowerCase().includes(input.toLowerCase())) : users

    // Ye code isliye hai taake online users real-time screen pe update hotay rahen
    // matlb ye h k jo bhi user online ho getUser refresh hoga or online users ajaye gy
    useEffect(() => {
        getUsers()
    }, [onlineUser])

    return (
        <div className={`bg-[#8185B2]/10 h-full p-5 rounded-r-xl overflow-y-scroll text-white ${selectedUser ? 'max-md:hidden' : ''}`}>
            {/* --- Header --- */}
            <div className='pb-5'>
                <div className='flex justify-between items-center'>
                    <img src={assets.logo} alt="logo" className='max-w-40' />
                    <div className='relative py-2 group'>
                        <img src={assets.menu_icon} alt="menu" className='max-h-5 cursor-pointer' />
                        <div className='absolute top-full right-0 z-20 w-32 p-5 rounded-md bg-[#282142] border border-gray-600 text-gray-100 hidden group-hover:block'>
                            <p onClick={() => navigate('/profile')} className='cursor-pointer text-sm'>Edit Profile</p>
                            <hr className='my-2 border-t border-gray-500' />
                            <p className='cursor-pointer text-sm' onClick={() => logout()}>Logout</p>
                        </div>
                    </div>
                </div>

                {/* --- Search Bar --- */}
                <div className='bg-[#282142] rounded-full flex items-center gap-2 py-3 px-4 mt-5'>
                    <img src={assets.search_icon} alt="Search" className='w-3' />
                    <input
                        type="text"
                        onChange={(e) => setInput(e.target.value)}
                        className='bg-transparent border-none outline-none text-white text-sm placeholder-[#c8c8c8] flex-1'
                        placeholder='Search User...'
                    />
                </div>
            </div>

            {/* --- User List --- */}
            <div className='flex flex-col'>
                {
                    // filterUsers.map(...) Ye sab filtered users ke liye ek <div> banata hai (list me show karne ke liye).
                    filterUsers.map((user, index) => (
                        <div
                            // check karti hai ke jo user abhi render ho raha hai aur jo selectedUser hai,kya dono ki _id same hai? Agar same hai → to us user ka background highlight ho jaata hai
                            //setSelectedUser(user) me user ka poora object chala jaata hai. 
                            //yahan se user bhej rahi hu or rightSideBar mai os user ki picture show krahi hu selectedUser se
                            // [user._id]: 0 → is particular user ka unseen messages 0 set kar do (kyunki ab user pe click ho gaya).
                            // Pehle wale unseen messages wahi rahenge
                            // Clicked user ka count 0 ho jayega
                            onClick={() => { setSelectedUser(user); setUnSeenMessages(prev => ({ ...prev, [user._id]: 0 })) }}
                            key={index}
                            className={`relative flex items-center gap-2 p-2 pl-4 rounded cursor-pointer max-sm:text-sm ${selectedUser?._id === user._id ? 'bg-[#282142]/50' : ''}`}
                        >
                            <img src={user?.profilePic || assets.avatar_icon} alt="" className='w-[35px] aspect-[1/1] rounded-full' />
                            <div className='flex flex-col leading-5'>
                                <p>{user.fullName}</p>
                                {/* Online/Offline Logic 
                                agr index mai 0 1 2 3 4 5 h toh maine index < 3 deya h toh iska matlab h pehly ek index check hoga k ye 3 se choti h phir print online show hoga ye krty krty 3 hojaye gy 3 pe ye colour hoga baki 2 pe ye gray hoga
                                */}
                                {
                                    // onLineUser ek array h jojo user id ki base pe online hota h array mai add hojata h or ose yahan pe display krdia jata h 
                                    // User ki ID agar onlineUser array me ho → Online warna → Offline
                                    onlineUser.includes(user._id)
                                        ? <span className='text-green-400 text-xs'>Online</span>
                                        : <span className='text-neutral-400 text-xs'>Offline</span>
                                }
                            </div>

                            {/* Number Badge (for users after index 2) */}
                            {
                                unSeenMessages[user._id] > 0 &&
                                <p className='absolute top-3 right-0 text-xs h-5 w-5 flex justify-center items-center rounded-full bg-violet-500/50'>
                                    {/* index 0 se start hota h toh mai index number print krahi hu 0 1 2  ke bad 3 or 4 index print hojaye gy k kitne msg aye hn  */}
                                    {unSeenMessages[user._id]}
                                </p>

                            }
                        </div>
                    ))
                }
            </div>
        </div>
    )
}

export default Sidebar
