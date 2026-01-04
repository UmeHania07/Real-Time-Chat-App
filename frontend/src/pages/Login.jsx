import React, { useContext, useState } from 'react'
import assets from '../assets/assets'
import { AuthContext } from '../../context/AuthContext'

const Login = () => {

  const [currentState, setCurrentState] = useState("Sign up")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [bio, setBio] = useState("")
  const [isDataSubmitted, setIsDataSubmitted] = useState(false)


  const { login } = useContext(AuthContext)

  const onSubmitHandler = (event) => {
    event.preventDefault()
    //agr currentState Sign up h toh ye isDataSubmitted ko true krde ga
    //user ne pehla step submit kar diya… ab usko NEXT STEP dikhana hai (bio waala part).”Isliye isDataSubmitted ko true kiya jata hai.
    //matlab data submit hojaye to ye arrow_icon show hojaye bio mai
    if (currentState === 'Sign up' && !isDataSubmitted) {
      setIsDataSubmitted(true)
      return
    }
    // ye api h agr 'signup' : 'login' ye api khud bana legi dynamic
    login(currentState === 'Sign up' ? 'signup' : 'login', { fullName, email, password, bio })
  }

  return (
    <>
      <div className='min-h-screen bg-cover bg-center flex items-center justify-center gap-8 sm:justify-evenly max-sm:flex-col backdrop-blur-2xl'>
        {/* Left */}
        <img src={assets.logo_big} alt="" className='w-[min(30vw,250px)]' />
        {/* Right */}
        {/* ✔ Pehla step submit karte hi
            ✔ isDataSubmitted ko true kar do
            ✔ Taake next step show ho jaye (bio + arrow)
            "isDataSubmitted true hoga to arrow dikhao, false hoga to mat dikhao." */}
        <form onSubmit={onSubmitHandler} className='border-2 bg-white/8 text-white border-gray-500 p-6 flex flex-col gap-6 rounded-lg shadow-lg'>
          <h2 className='font-medium text-2xl flex justify-between items-center'>
            {currentState}
            {
              // Submit click true ho jaata hai Image dikhne lagti hai
              // Image pe click hota h toh ye back page Sign up pe leke jati h toh false ho jaata hai Image wapis gayab ho jaati hai
              //jaisi true hota h wasi he ye icon or texterea show hoga
              isDataSubmitted &&
              <img src={assets.arrow_icon} alt="" onClick={() => setIsDataSubmitted(false)} className='w-5 cursor-pointer' />
            }
          </h2>
          {
            // initially false hone ki wajah se !isDataSubmitted → true ban gaya,aur isi liye input visible hai jab setIsDataSubmitted(true) karegi,toh !isDataSubmitted → false ban jaayegaaur input gayab 
            currentState === 'Sign up' && !isDataSubmitted && (
              <input type="text" onChange={(e) => setFullName(e.target.value)} value={fullName} placeholder='Enter Your Full Name' required className='p-2 border border-gray-500 rounded-md focus:outline-none' />

            )
          }
          {
            // “email or password submit krne k bad textarea show ho Qke woh true h??” YES!! Exactly isi wajah se textarea show hoti hai.
            !isDataSubmitted && (
              <>
                <input type="email" onChange={(e) => setEmail(e.target.value)} value={email} placeholder='Email Address' required className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500' />

                <input type="password" onChange={(e) => setPassword(e.target.value)} value={password} placeholder='Email Password' required className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500' />
              </>
            )
          }
          {
            // isDataSubmitted tab tak TRUE rahega…jab tak tum khud use setIsDataSubmitted(false) nahi kar deti.
            //jaisi maine uper function mai !isDataSubmitted kiya h toh isDataSubmitted true hoga toh agy next step mai setIsDataSubmitted(true) hoga to ye ose wapis false hoga toh ye texterea visible hojaye ga..
            currentState === 'Sign up' && isDataSubmitted && (
              <>
                <textarea rows={4} placeholder='Provide a short bio...' onChange={(e) => setBio(e.target.value)} value={bio} className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500' required></textarea>
              </>
            )
          }
          <button type='submit' className='py-3 bg-gradient-to-r from-purple-400 to-violet-600 text-white rounded-md cursor-pointer'>
            {
              currentState === 'Sign up' ? 'Create Account' : 'Login Now'
            }
          </button>

          <div className='flex items-center gap-2 text-sm text-gray-500'>
            {currentState === 'Sign up' ? <input type="checkbox" required /> : <input type="checkbox" />}
            <p className='text-sm text-gray-400'>Agree to the terms of use & privacy policy.</p>
          </div>
          <div className='flex flex-col gap-2'>
            {
              currentState === 'Sign up' ? (
                // Ab user Login page pe switch karna chahta hai →setIsDataSubmitted(false) taake Sign up ka data aur bio field hide ho jaaye aur form reset ho jaaye.
                <p className='text-sm text-gray-400'>Already have an account? <span onClick={() => { setCurrentState("Login"), setIsDataSubmitted(false) }} className='font-medium text-violet-500 cursor-pointer'>Login here</span></p>
              ) : (
                <p className='text-sm text-gray-400'>Create an account <span onClick={() => setCurrentState("Sign up")} className='font-medium text-violet-500 cursor-pointer'>Click here</span></p>
              )
            }
          </div>
        </form>
      </div>
    </>
  )
}

export default Login
