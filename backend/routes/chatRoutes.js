import express from 'express'
import { protectRoute } from '../middleware/authentication.js'
import { getMessages, getUsersForSidebar, markMessageAsSeen, sentMessage } from '../controllers/chatControllers.js'

const chatRouter = express.Router()

//it will display all users
chatRouter.get('/users', protectRoute, getUsersForSidebar)
chatRouter.get('/:id', protectRoute, getMessages)
chatRouter.put('/mark/:id', protectRoute, markMessageAsSeen)
//POST = Create new thing
chatRouter.post('/sent/:id', protectRoute, sentMessage)



export default chatRouter;