import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    fullName: {
        type: String,
        required: true,
    },
    profilePic: {
        type: String,
        default: "",
    },
    bio: {
        type: String,
        required: true,
    },
}, {
    //date time add krega
    timestamps: true
})

export const USER = mongoose.model("User" , userSchema)