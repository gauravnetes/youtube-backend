import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.models.js"

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description, videos} = req.body
    //TODO: create playlist
    if (
        [name].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "Playlist name is required")
    }
    
    if (!Array.isArray(videos) || videos.length === 0) {
        throw new ApiError(400, "Atleast One Video is Required to create a Playlist")
    }

    for (let i = 0; i < videos.length; i++) {
        if (!isValidObjectId(videos[i])) {
            throw new ApiError(400, `Invalid Object ID at index index: ${i}`)
        }
        
    }
    const owner = req.user._id
    const playlist = await Playlist.create({
        name, 
        description, 
        owner
    })

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlist._id, {
        $push: {
            videos: {
                $each: videos
            }
        }
    }, {new: true}

    ).populate("videos", "title description owner videoFile")


    if (!updatedPlaylist) {
        throw new ApiError(400, "Error while Updating playlist")
    }

    return res.status(200)
                .json(
                    new ApiResponse(200, updatedPlaylist, "Playlist Created Successfully")
                )

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if (!userId || !isValidObjectId(userId)) {
        throw new ApiError(400, "User ID not found in DB")
    }

    const userPlaylists = await Playlist.find({owner: userId}).populate("videos", "title description videoFile").lean()

    if (!userPlaylists.length) {
        throw new ApiError(500, "user playlists NOT fetched successfully")
    }

    return res.status(200)
                .json(
                    new ApiResponse(200, userPlaylists, "User playlists fetched successfully")
                )

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if (!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Playlist ID not found in DB")
    }

    const fetchedPlaylist = await Playlist.findById(playlistId).populate("videos", "title description videoFile").lean()

    if (!fetchedPlaylist.length) {
        throw new ApiError(500, "Playlist does not exist")
    }

    return res.status(200)
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}