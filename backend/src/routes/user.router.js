import {Router} from 'express'
import {signupUser, loginUser, logoutUser, changeUserDetails, forgotPassword, resetPassword, getUserDetails } from '../controllers/user.controller.js'
import authenticateToken from '../middlewares/auth.middleware.js'

const userRouter = Router()

userRouter.post('/signup',  signupUser)
userRouter.post('/login', loginUser)
userRouter.post('/logout', authenticateToken, logoutUser)
userRouter.post('/forgot-password', forgotPassword)
userRouter.post('/reset-password', resetPassword)
userRouter.get('/get-user-details', authenticateToken, getUserDetails)
userRouter.patch('/change-user-details', authenticateToken, changeUserDetails)

export default userRouter 