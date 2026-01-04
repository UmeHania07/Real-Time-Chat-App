import { generateToken } from "../lib/utils.js"
import { USER } from "../models/userModel.js"
import bcrypt from 'bcryptjs'
import cloudinary from '../lib/cloudinary.js'



//Signup the user
export const userSignup = async (req, res) => {
    //Token header se nikalta hai jwt.verify() karta hai Token se userId nikalta hai Database me user check karta hai
    //Agar sab sahi ho, req.user = user set karta hai//next() karke controller me le jata hai
    //👉 Yani verify sirf tab hota hai jab tum protected route call karti ho, login ke waqt nahi.
    try {
        const { fullName, email, password, bio } = req.body
        if (!fullName || !email || !password || !bio) {
            return res.json({
                message: 'User not found',
                success: false
            })
        }

        //we can not store orignal password in db
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const user = await USER.findOne({ email: email })
        if (user) {
            return res.json({
                message: 'Account already exists',
                success: false
            })
        }

        const newUser = await USER.create({
            fullName,
            email,
            password: hashedPassword,
            bio
        })

        //now it will generate new token
        const token = generateToken(newUser._id)
        res.json({
            success: true,
            userData: newUser,
            token,
            message: `Account created successfully.`,

        });

    } catch (error) {
        console.log(error.message)
        return res.json({
            success: false,
            message: 'Failed to Signup'
        })
    }
}

//Login a user
export const userLogin = async (req, res) => {
    //Token header se nikalta hai jwt.verify() karta hai Token se userId nikalta hai Database me user check karta hai
    //Agar sab sahi ho, req.user = user set karta hai//next() karke controller me le jata hai
    //👉 Yani verify sirf tab hota hai jab tum protected route call karti ho, login ke waqt nahi.
    try {
        const { email, password } = req.body
        if (!email || !password) {
            return res.json({
                message: 'Login failed try again.',
                success: false
            })
        }
        const user = await USER.findOne({ email })
        if (!user) {
            return res.json({
                success: false,
                message: "User not found"
            })
        }
        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            return res.json({
                success: false,
                message: "Incorrect password"
            })
        }

        //now it will generate new token
        const token = generateToken(user._id)
        res.json({
            success: true,
            userData: user,
            //ye token middleware mai verify horaha h 
            token,
            message: `Welcome Back To QuickChat ${user.fullName}`,

        });

    } catch (error) {
        console.log(error.message)
        return res.json({
            success: false,
            message: 'Failed to Login'
        })
    }
}

//controller to check if user is authenticated
export const checkAuthentication = async (req, res) => {
    try {
        //ye middleware verify se araha h req.user
        return res.json({
            success: true,
            user: req.user
        })


    } catch (error) {
        console.log(error.message)
        return res.json({
            success: false,
            message: 'User not found'
        })
    }
}

//controller to update user profile details
export const updateProfile = async (req, res) => {
    try {
        const { profilePic, bio, fullName } = req.body
        //ye authentication se araha h 
        const userId = req.user._id


        let updatedUser;
        if (!profilePic) {
            //jo userId login h oski id ki base pe only bio , fullname update hoga agr profilepicture nhi h toh
            //userId ke base pe ek document dhundhna aur usme nayi values update karna.
            // { new: true } likhne ka matlab hai “mujhe update hone ke baad ka naya result wapas do.”
            //{ _id: 1, fullName: "Hania", bio: "Hello" }  ❌ (purana)
            //{ _id: 1, fullName: "UmeHania 💫", bio: "Hello" } ✅ (naya updated)
            updatedUser = await USER.findByIdAndUpdate(userId, { bio, fullName }, { new: true })
        } else {
            const uploadPicture = await cloudinary.uploader.upload(profilePic);
            updatedUser = await USER.findByIdAndUpdate(userId, { profilePic: uploadPicture.secure_url, bio, fullName }, { new: true })
        }
        res.json({
            message: 'Profile updated successfully — changes saved.',
            success: true,
            user: updatedUser
        })

    } catch (error) {
        console.log(error.message)
        return res.json({
            success: false,
            message: 'Failed to updateProfile'
        })

    }
}

