import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.models.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Playlist } from "../models/playlist.models.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body
    const owner = req.user._id
    if (!content || !owner) {
        throw new ApiError(400, "All fields are required")
    }

    if (content.length > 200) {
        throw new ApiError(400, "Tweet content exceeds the maximum limit of 280 characters")
    }

    try {
        const tweet = await Tweet.create({
            content, 
            owner
        })
    
        if (!tweet) {
            throw new ApiError(500, "Error while creating Tweet")
        }
    
        return res.status(201)
                    .json(
                        new ApiResponse(201, tweet, "Tweet created Successfully")
                    )
    } catch (error) {
        throw new ApiError(500, "Internal Server Error while creating Tweet", error)
    }
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params

    if (!userId || !isValidObjectId(userId)) {
        throw new ApiError(400, "User ID not valid")
    }
    try {
        const userTweets = await Tweet.find(
            {
                owner: userId
            }
        ).populate("owner", "username").lean()

        if (!userTweets.length) {
            throw new ApiError(404, "No Tweets found")
        }

        return res.status(200)
                    .json(
                        new ApiResponse(200, userTweets, "Tweets Fetched Successfully")
                    )
    } catch (error) {
        throw new ApiError(500, "Internal Server Error while fetching Tweets", error)
    }
    


})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId} = req.params
    const {content} = req.body

    if (!tweetId || !isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invaild Tweet ID  --updateTweet")
    }
    if (!content) {
        throw new ApiError(400, "Must provide content to update Tweet")
    }

    try {
        const updatedTweet = await Tweet.findByIdAndUpdate(
            tweetId, 
            {
                $set: {
                    content
                }
            }, {new: true}
        ).lean()

        return res.status(200)
                    .json(
                        new ApiResponse(200, updatedTweet, "Tweet updated successfully")
                    )
    } catch (error) {
        throw new ApiError(400, "Tweet Update Unsuccessful")
    }

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params

    if (!tweetId || !isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid Tweet ID")
    }
    
    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(404, "Tweet Not found")
    }

    try {
        await Tweet.findByIdAndDelete(tweetId)
        return res.status()
                    .json(
            new ApiResponse(200, "Tweet Successfully Deleted")
        )

    } catch (error) {
        throw new ApiError(500, "Error while deleting Tweet")
    }
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}