import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { application } from "express"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID")
    }

    try {
        const comments = await Comment.find(
            {
                video: videoId
            }
        ).populate("owner", "username avatar")
            .sort({ createdAt: -1 })
            .skip( (page - 1) * Number(limit) )
            .limit(Number(limit))

        res.status(200)
                .json(
                    new ApiResponse(200, {comments, page, limit}, "Comments fetched successfully")
                )

    } catch (error) {
        throw new ApiError(500, "Error occured while fetching comments")
    }

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { content } = req.body
    const { videoId } = req.params; 
    const userId = req.user._id

    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID")
    }
    if (!content) {
        throw new ApiError(400, "comment field can't be empty")
    }

    try {
        const commentAdded = await Comment.create({

            content,
            video: videoId,
            owner: userId

        })

        return res.status(201)
                    .json(
                        new ApiResponse(201, commentAdded, "Comment Added Successful")
                    )

    } catch (error) {
        console.log(error);
        throw new ApiError(500, "Error while Adding comment")
    }
    
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params
    const { content } = req.body

    if (!commentId || !isValidObjectId(commentId)) {
        throw new ApiError(400, "invalid Comment ID")
    }
    try {
        const updatedComment = await Comment.findByIdAndUpdate(
            commentId, 
            {
                $set: { content }
            }, { new: true, runValidators: true}
        )
        if (!updateComment) {
            throw new ApiError(404, "Comment Not Found ")
        }
        return res.status(200)
                    .json(
                        new ApiResponse(200, updateComment, "Comment Edited Successfully")
                    )
    } catch (error) {
        console.log(error);
        throw new ApiError(500, "Error occured while updating comment")
    }
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params
    if (!commentId || !isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid Comment ID")
    }

    try {
        const deletedComment = await Comment.findByIdAndDelete(commentId)
        if (!deletedComment) {
            throw new ApiError(404, "Comment Not Found")
        }
        return res.status(200)
                    .json(
                        new ApiResponse(200, {}, "Comment Deleted Successfully")
                    )
    } catch (error) {
        throw new ApiError(500, "Error while Deleting Comment")
    }
})

export {
        getVideoComments, 
        addComment, 
        updateComment,
        deleteComment
    }