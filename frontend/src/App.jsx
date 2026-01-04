import { Navigate, Route, Routes } from "react-router-dom"
import Home from './pages/Home'
import Login from './pages/Login'
import Profile from './pages/Profile'
import { Toaster } from "react-hot-toast"
import { useContext } from "react"
import { AuthContext } from "../context/AuthContext"


const App = () => {
  // "AuthContext ke andar jo data / functions tumne provide kiye, unka mujhe access do."
  //Ye locker ko khol rahi ho.
  const { authUser } = useContext(AuthContext)
  return (
    <>
      <div className="h-screen bg-[url('/bgImage.svg')] bg-contain bg-center bg-no-repeat bg-black ">
        <Toaster />
        <Routes>
          {/* Agar user authenticated hai (authUser true hai) → Home page dikhado Agar user authenticated nahi hai → /login pe redirect kar do*/}
          <Route path="/" element={authUser ? <Home /> : <Navigate to="/login" />} />
          {/* Agar user authenticated nahi hai → Login page dikhado Agar user authenticated hai → / (home) pe redirect kar do*/}
          <Route path="/login" element={!authUser ? <Login /> : <Navigate to="/" />} />
          {/* Agar user authenticated hai → Profile page dikhado Agar user authenticated nahi hai → /login pe redirect kar do*/}
          <Route path="/profile" element={authUser ? <Profile /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </>
  )
}

export default App
