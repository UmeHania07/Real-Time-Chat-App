import mongoose from 'mongoose'

const chatSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
    },
    image: {
        type: String,
    },
    seen: {
        type: Boolean,
        default: false
    }
}, {
    //date time add krega
    timestamps: true
})

export const CHAT = mongoose.model("Chat", chatSchema)