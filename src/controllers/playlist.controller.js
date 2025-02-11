import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.models.js"

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body
    //TODO: create playlist
    if (
        [name].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "Playlist name is required")
    }
    
    const owner = req.user._id
    const playlist = await Playlist.create({
        name, 
        description, 
        owner
    })

    return res.status(200)
                .json(
                    new ApiResponse(200, playlist, "Playlist Created Successfully")
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
                .json(
                    new ApiResponse(200, fetchedPlaylist, "Playlist fetched Successfully")
                )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if (!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist ID");
    }

    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID");
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(400, "Playlist not Found")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(400, "Video not found")
    }
    
    if (playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video Already Exists in the Playlist")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
            {
                $push: {videos: videoId}
        }, 
        {new: true}
    ).populate("videos", "title description videoFile")

    return res.status(200)
                .json(
                    new ApiResponse(200, updatedPlaylist, "Video Added in Playlist Successfully")
                )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if (!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist ID  --removeVideoFromPlaylist")
    }
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID ")
    }

    const playlist = await Playlist(playlistId)
    if (!playlist) {
        throw new ApiError(400, "Playlist Not Found  --removeVideoFromPlaylist")
    }

    if (!playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video doesn't exist in the Playlist  --removeVideoFromPlaylist")
    }

    const updatedPlaylist = await Playlist.findOneAndUpdate(
        playlistId, 
        {
            $pull: {
                videos: videoId
            }
        }, {new: true}
    ).populate("videos", "title description videoFile")

    return res.status(200)
                .json(
                    new ApiResponse(200,  updatedPlaylist, "Video removed from Playlist successfully")
                )

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if (!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist ID  --deletePlaylist")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist Not Found")
    }

    try {
        await Playlist.findByIdAndDelete(playlistId)
        return res.status(200)
                    .json(
                        new ApiResponse(200, "Playlist Deleted Successfully")
                    )
    } catch (error) {
        throw new ApiError(500, "Playlist Not Deleted ", error)
    }

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if (!playlistId || isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invaild Playlist ID  --updatePlaylist")
    }

    if (!name || !description) {
        throw new ApiError(400, "Atleast One field is required to Update  --updatePlaylist")
    }

    const updateFields = {}
    if (name) {
        updateFields.name = name
    }
    if (description) {
        updateFields.description = description
    }
    
    const playlist = Playlist.findByIdAndUpdate(
        playlistId, 
        {
            $set: {
                name, 
                description
            }
        }, {new: true}
   ).populate("videos", "name description owner").populate("owner", "name")
    
   if (!playlist) {
        throw new ApiError(500, "Error while updating Playlist  --updatePlaylist")
   }

   return res.status(200)
                .json(
                    new ApiResponse(200, playlist, "Playlist updated successfully")
                )
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