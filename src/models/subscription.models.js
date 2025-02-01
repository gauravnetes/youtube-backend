import mongoose, {model, Schema} from "mongoose";

const subscriptionSchema = new Schema({
    subscriber: { // subscriber is also an user/channel itself. Difference is the channel post videos. Every user can be treated as a channel
        type: Schema.Types.ObjectId, // one who is subscribing
        ref: "User"
    },
    channel: {  // A channel itself is an user
        type: Schema.Types.ObjectId, // One to whom the subscriber is subscribing
        ref: "User"
    }
}, {timestamps: true})

export const Subscription = mongoose.model("Subscription", subscriptionSchema) 