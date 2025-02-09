import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const userId = req.user._id
    //TODO: toggle like on video
    const existingLike = await Like.findOne({
        video: videoId, 
        likedBy: userId
    })

    if (existingLike) {
        await existingLike.deleteOne()
        return res.status(200)
                    .json(
                        new ApiResponse(200, null, "Video disliked successfully")
                    )
    }

    const newLike = new Like({
        video: videoId, 
        likkedBy: userId
    })

    if (!newLike) {
        throw new ApiError(500, "Internal Error while liking the Video")
    }
    await newLike.save()

    return res.status(200)
                .json(
                    new ApiResponse(200, newLike, "Video Liked Successfully")
                )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    const {userId} = req.user._id
    //TODO: toggle like on comment
    const existingLike = await Like.findOne({
        comment: commentId, 
        likedBy: userId
    })

    if (existingLike) {
        await existingLike.deleteOne()
        return res.status(200)
                    .json(
                        new ApiResponse(200, null, "Comment disliked successfully")
                    )
    }

    const newLike = await new Like({
        comment: commentId, 
        likkedBy: userId
    })

    if (!newLike) {
        throw new ApiError(500, "Internal Error while liking the Comment")
    }
    await newLike.save()

    return res.status(200)
                .json(
                    new ApiResponse(200, newLike, "Comment Liked Successfully")
                )

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const {userId} = req.user._id
    //TODO: toggle like on tweet
    const existingLike = await Like.findOne({
        tweet: tweetId, 
        likedBy: userId
    })

    if (existingLike) {
        await existingLike.deleteOne()
        return res.status(200)
                    .json(
                        new ApiResponse(200, null, "tweet disliked successfully")
                    )
    }

    const newLike = await new Like({
        tweet: tweetId, 
        likkedBy: userId
    })

    if (!newLike) {
        throw new ApiError(500, "Internal Error while liking the Tweet")
    }
    await newLike.save()

    return res.status(200)
                .json(
                    new ApiResponse(200, newLike, "Tweet Liked Successfully")
                )
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user._id

    const likedVideos = await Like.find({likedBy: userId}).populate('video', 'title description thumbnail')

    if (!likedVideos || likedVideos.length === 0) {
        throw new ApiError(404, "No Liked Videos found")
    }

    const videos = likedVideos.map((like) => like.video)

    return res.status(200).json(
        new ApiResponse(200, videos, "Liked videos fetched successfully")
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}