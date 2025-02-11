import mongoose, {isValidObjectId, set} from "mongoose"
import {Video} from "../models/video.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    // 1. validate the userId
    if (userId && !isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID")
    }

    // filter the videos based on the queries
    const filter = {};

    if (query) {
        filter.$or = [
            {
                title: {
                    $regex: query, 
                    $options: "i"
                }
            }, 
            {
                description: {
                    $regex: query,
                    $options: "i"
                }
            }
        ];
    }
    
    // defining owner by userId
    if (userId) {
        filter.owner = mongoose.Types.ObjectId(userId); 
    }

    // handling sorting
    const validSortFields = ["createdAt", "views"]
    if (!validSortFields.includes(sortBy)) {
        throw new ApiError(400, "Incorrect sort field")
    } 
    
    const sortOptions = { 
        [sortBy]: sortType === "asc" ? 1 : -1
    }

    // writing the agg. pipeline
    const pipeline = [
        {$match: filter}, 
        {$sort: sortOptions}, 
        {$skip: ((page - 1) * Number(limit))}, 
        {$limit: Number(limit)}, 
        {
            $lookup: {
                from: "users", 
                localField: "owner", 
                foreignField: "_id", 
                as: "owner"
            }, 
        }, 
        { $unwind: "$owner" }, 
        {
            $project: {
                title: 1, 
                description: 1, 
                videoFile: 1, 
                thumbnail: 1, 
                duration: 1, 
                views: 1, 
                isPublished: 1,
                createdAt: 1, 
                "owner.username": 1,
            }
        }
    ]

    const videos = await Video.aggregate(pipeline); 

    const totalVideos = await Video.countDocuments(filter)

    return res.status(200)
                .json(new ApiResponse(200, {videos, totalVideos, page, limit}, "Got All videos Successfully"))

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    if (
        [title, description].some((field) => field?.trim() === "") // trim the fields if still empty. throw error
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const allowedVideoMimeTypes = ["video/mp4", "video/mov", "video/webm", "video/mkv"];
    const videoMimeType = req.files?.videoFile[0].mimetype

    if (!allowedVideoMimeTypes.includes(videoMimeType)) {
        throw new ApiError(400, "Only mp4, mov, webm, and mkv files are allowed")
    }
    
    const videoFileLocalPath = req.files?.videoFile[0].path
    if (!videoFileLocalPath) {
        throw new ApiError(400, "Video File is required"); 
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    if (!videoFile || !videoFile.url) {
        throw new ApiError(400, "Video File upload Failed")
    }
    const owner = req.user._id; 

    let video; 
    try {
        video = await Video.create({
            title, 
            description, 
            videoFile: videoFile.url, 
            owner
        })
    } catch (error) {
        throw new ApiError(500, `Error creating the Video in the DB: ${error}`)
    }

    const publishedVideo = await Video.findById(video._id)
    if (!publishedVideo) {
        throw new ApiError(500, "Something went wrong while publishing the Video")
    }

    return res.status(201)
                .json(
                    new ApiResponse(200, publishedVideo, "Video Published Successfully")
                )

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    // 1. validate the videoId
    if (videoId && !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video Not Found!!")
    }
    return res.status(200)
                .json(
                    new ApiResponse(200, video, "Video found successfully")
                )
    
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const {title, description, thumbnail} = req.body
    if (videoId && !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID")
    }

    if (!title && !description && !thumbnail) {
        throw new ApiError(400, "Atleast one update is required")
    }

    const updateVideoData = {};
    if(title) updateVideoData.title = title
    if(description) updateVideoData.description = description
    if(thumbnail) updateVideoData.thumbnail = thumbnail

    const video = await Video.findByIdAndUpdate(
        videoId, 
        {
            $set: updateVideoData
        }, {new: true, runValidators: true}
    )
    if (!video) {
        throw new ApiError(500, "Video not Found")
    }

    return res.status(200)
                .json(
                    new ApiResponse(200, video, "Video Updated successfully")
                )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if (videoId && !isValidObjectId(videoId)) {
        throw new ApiError(400, "Video not found in the DB")
    }

    const video = await Video.findByIdAndDelete(videoId)

    if(!video) {
        throw new ApiError(404, "Video Not Found")
    }
    return res.status(200)
                .json(
                    new ApiResponse(200, "Video Deleted Successfully")
                )

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (videoId && !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(400, "Video not found in the DB")
    }

    // toggle
    video.isPublished = !video.isPublished 

    await video.save()

    return res.status(200)
                .json(
                    new ApiResponse(200, video, "Video publish Status toggled successfully")
                )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}