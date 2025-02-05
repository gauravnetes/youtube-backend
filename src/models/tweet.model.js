import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const tweetSchema = new Schema(
    {
        owner: {
            type: mongoose.Types.ObjectId, 
            ref: "User"
        }, 
        content: {
            type: String, 
            required: true
        }
    }, {timestamps: true}
)

tweetSchema.plugin(mongooseAggregatePaginate)
export const tweet = mongoose.model("Tweet", tweetSchema)