import { USER } from "../models/userModel.js"
import jwt from 'jsonwebtoken'



//middleware to protect route
// Jani, har protected request ke sath token is liye jata hai taake backend ko pata chale ‘ye wohi user hai jo login hua tha’.
export const protectRoute = async (req, res, next) => {
  try {
    //ye token utils sign se araha h
    //Token read karta hai 
    //Frontend ke request headers se Simple API testing (e.g. Postman, axios headers)
    //Browser cookies se Secure login systems (HTTP-only cookies)
    const token = req.headers.token
    const decode = jwt.verify(token, process.env.JWT_SECRET)

    //yahan pe mai user ki ID ly ke verify krahi hu k ye authenticated h k nhi ye find krega id k through password ko hata k 
    // “Token me jo userId mili thi, us user ko database se dhoondo,
    //lekin uska password mat bhejna.”
    const user = await USER.findById(decode.userId).select('-password')
    if (!user) {
      return res.json({
        message: 'User Unauthorized',
        success: false
      })
    }

    //agr sab thik ho toh ye hoo

    //jwt.verify() check karta hai ke token valid hai ya nahi.
    //agar valid hai to wo token me se userId nikal leta hai.
    //phir database me us user ko dhoondhta hai USER.findById(decode.userId)
    //aur agar user mil gaya to req.user = user karke next route ko bhej deta hai.
    req.user = user
    next()

  } catch (error) {
    console.log(error.message)
    return res.json({
      message: 'Something went wrong',
      success: false
    })
  }
}