import mongoose, { isValidObjectId } from "mongoose"
import {Video} from "../models/video.models.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.models.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const { userId } = req.params

    if (!userId || !isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid Channel ID")
    }

    try {
        const channel = await User.findById(userId)
        if (!channel) {
            throw new ApiError(404, "Channel Not Found")
        }

        const channelStats = Video.aggregate([
            { $match: { owner: userId } }, 
            {
                $group: {
                    _id: null, 
                    /*
                    The $sum operator is used to sum values.
                    In this case, we are summing 1 for each document (video) that is passed to this stage, effectively counting the total number of videos for the given user (userId).
                    */
                    totalVideos: { $sum: 1 }, 
                    totalViews: { $sum: "$views" }, // This sums up the value of the views field from each video document.
                    totalLikes: { $sum: "$likes" }, // Similar to the totalViews, this sums up the likes field from each video document.
                }
            }
        ])

    } catch (error) {
        throw new ApiError(500, "Error Fetching Channel Stats")
    }
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
})

export {
    getChannelStats, 
    getChannelVideos
    }