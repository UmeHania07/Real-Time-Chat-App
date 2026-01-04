import React, { useContext, useState } from 'react'
import Sidebar from '../components/Sidebar'
import ChatContainer from '../components/ChatContainer'
import RightSideBar from '../components/RightSideBar'
import { ChatContext } from '../../context/ChatContext'

const Home = () => {
    // initially jab tak user koi apna frind/user select nhi krega ose screen pe sidebar or rightbar nazar ayega ChatBox nhi
    const {selectedUser} = useContext(ChatContext)
    return (
        <>
            <div className="border w-full h-screen sm:px-[15%] sm:py-[5%]">
                <div className={`backdrop-blur-xl  border-2 border-gray-600 rounded-2xl overflow-hidden h-[105%] grid grid-cols-1 relative  ${selectedUser ? 'md:grid-cols-[1fr_1.5fr_1fr] xl:grid-cols-[1fr_2fr_1fr]' : 'md:grid-cols-2'}`}>
                    {/* agr user koi dosra user/friend select nhi krega toh ose only 2 colum mily gy */}
                    <Sidebar />
                    <ChatContainer />
                    <RightSideBar />
                </div>
            </div>
        </>
    )
}

export default Home
