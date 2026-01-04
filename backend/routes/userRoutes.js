import express from 'express'
import { protectRoute } from '../middleware/authentication.js'
import { checkAuthentication, updateProfile, userLogin, userSignup } from '../controllers/userControllers.js'

const userRouter = express.Router()

userRouter.post('/signup' , userSignup)
userRouter.post('/login' , userLogin)
userRouter.put('/update-profile' , protectRoute , updateProfile)
userRouter.get('/check-authentication' , protectRoute , checkAuthentication)

export default userRouter;