import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.models.js"
import { Subscription } from "../models/subscription.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const userId = req.user._id
    // TODO: toggle subscription
    const existingSubscription = await Subscription.findOne({
        channel: channelId, 
        subscriber: userId
    })

    if (existingSubscription) {
        await existingSubscription.deleteOne()
        return res.status(200)
                    .json(
                        new ApiResponse(200, existingSubscription, "Channel Unsubscribed successfully")
                    )
    }

    const newSubscription = new Subscription({
        channel: channelId, 
        subscriber: userId
    })

    if (!newSubscription) {
        throw new ApiError(500, "Error while Subscribing The Channel")
    }
    await newSubscription.save()

    return res.status(200)
                .json(
                    new ApiResponse(200, newSubscription, "Channel Subscribed Successfully")
                )
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if (!channelId || !isValidObjectId(channelId)) {
        throw new ApiError(400, 'Invalid channel ID')
    }
    const subscribersList = await Subscription.find({channel: channelId}).populate("subscriber", "name username avatar").lean()

    return res.status(200)
                .json(
                    new ApiResponse(200, subscribersList, "Channel Subscriber fetched Successfully")
                )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    // const subscriberId = req.user._id   // restrict to fetch subscribed channels by only authenticated user
    if (!subscriberId || !isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid Subscriber ID")
    }
    const channelsSubscribedTo = await Subscription.find({subscriber: subscriberId}).populate("channel", "name avatar coverImage username").lean()

    if (channelsSubscribedTo.length == 0) {
        return res.status(200).json(new ApiResponse(200, [],"No Subscribed Channels found"))
    }
    return res.status(200).json(
        new ApiResponse(200, channelsSubscribedTo, "Subscribed Channels List fetched successfully")
    )

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}