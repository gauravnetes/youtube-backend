import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose";


const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        if (!user) {
            throw new ApiError(404, "User not found");
            
        }
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        console.error("Error in generateAccessAndRefreshToken", error)
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // res.status(200).json({
    //     msg: "route hit successful"
    // })
    // get user details from ftontend
    // validation - not empty
    // check if user already exists: username, email
    // upload the images check for avatar
    // upload the images to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res or error

    // get user details from ftontend
    const {fullName, email, username, password} = req.body
    console.log("email: ", email);
    
    // validation - not empty
    if (
        [fullName, email, username, password].some((field) => field?.trim() === "") // trim every filed here and even after the trim the field is empty then we've to send the message to the request to the user to properly put values in the requests

    ) {
        throw new ApiError(400, "All fields are required")
    }

    // check if user already exists: username, email
    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    // console.log(req.files);
    
    // upload the images check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path

    let coverImageLocalPath; 
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {      // to check if the coverImage is an Array
        coverImageLocalPath = req.files.coverImage[0].path
    }


    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    // upload the images to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)


    if (!avatar) {
        throw new ApiError(400, "Avatar file is required") 
    }

    // create user object - create entry in db
    const user = await User.create({
        fullName, 
        avatar: avatar.url,
        coverImage: coverImage?.url || "", 
        email, 
        password, 
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    ) 
})

const loginUser = asyncHandler(async (req, res) => {
    // retrieve data from req.body
    // usernane or email 
    // find the user 
    // password check
    // access and refresh token
    // send cookies

    const {email, username, password} = req.body
    console.log(email);
    
    if (!username && !email) {      // alternative if( !(username || email) ) {}
        throw new ApiError(400, "username or email is required")
    }
    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "user does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    const {refreshToken, accessToken} = await generateAccessAndRefereshTokens(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    // sending cookies
    const options = {
        httpOnly: true, 
        secure: true
    }
    return res.status(200)
                .cookie("accessToken", accessToken, options)
                .cookie("refreshToken", refreshToken, options)
                .json(
                    new ApiResponse (
                        200, 
                        {
                            user: loggedInUser, accessToken, refreshToken
                        }, 
                        "User successfully Logged IN"
                    )
                )
})

const logoutUser = asyncHandler(async (req, res) => {
    // to get access to the userId we have to design a middleware => auth.middleware.js
    await User.findByIdAndUpdate(
        req.user._id, 
        {
            $set: {
                refrestToken: undefined
            }
        }, 
        {
            new: true
        }
    )
    // sending cookies
    const options = {
        httpOnly: true, 
        secure: true
    }

    return res.status(200)
                    .clearCookie("accessToken", options)
                    .clearCookie("refreshToken", options)
                    .json(new ApiResponse(200, {}, "User Logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized Request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken, 
            process.env.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh Token Expired or Used")
        }
    
        const options = {
            httpOnly: true, 
            secure: true
        }
    
        const {accessToken, newrefreshToken} = await generateAccessAndRefereshTokens(user._id)
        return res.status(200)
                    .cookie("accessToken", accessToken, options)
                    .cookie("refreshToken", newrefreshToken, options)
                    .json(
                        new ApiResponse(
                            200, 
                            {accessToken, refreshToken: newrefreshToken}, 
                            "Access Token Refreshed"
                        )
                    )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token")
    }
})


const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body
   
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid Old Password")
    }
    user.password = newPassword // it's being hashed in the User model
    await user.save({validateBeforeSave: false})
     
     return res.status(200)
                    .json(new ApiResponse(200, {}, "Password changed successfully"))

})


const getCurrentUser = asyncHandler(async(req, res) => {
    return res.status(200)
                .json(new ApiResponse(200, req.user, "Current User Fetched Successfully"))
})


const updateAccountDetails = asyncHandler(async (req, res) => {
    const {fullName, email} = req.body

    // professional practice: when file is being updated, handle it in another endpoint/controller. reduce congestion as the 
    // text data is not being send everytime a file data is updated

    if (fullName || email) {
        throw new ApiError(400, "All Fields are required")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id, // find the id
        {
            $set: {
                fullName: fullName, 
                email: email
            }
        },           // update with new info
        {new: true} // return the info after being updated
    ).select("-password")

    return res.status(200)
                .json(new ApiResponse(200, user, "Account Details Updated Successfully"))
})

const updateUserAvatar = asyncHandler( async (req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar File is Missing")
    }

    // TODO: delete old Avatar

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on Avatar")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        }, 
        {new: true}
    ).select("-password")

    return res.status(200)
                .json(
                    new ApiResponse(200, user, "Avatar Image Updated Successfully")
                )
})

const updateUserCoverImage = asyncHandler( async (req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover Image File is Missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on Cover Image")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        }, 
        {new: true}
    ).select("-password")

    return res.status(200)
                .json(
                    new ApiResponse(200, user, "Cover Image Updated Successfully")
                )

})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    // when clicked on a channel redirect to the channel's url
    const {username} = req.params; 
    if (!username?.trim()) {
        throw new ApiError(400, "Username is Missing")
    }

    // User.find({username})

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        }, 
        // agg. pipeline to find the no. of subscribers of a channel
        {
            $lookup: {
                from: "subscriptions", // in MongoDB models Schemas get converted to lowercase and plurals
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        }, 
        // Agg. pipeline for how many channels I've subscribed
        {
            $lookup: {
                from: "subscriptions", 
                localField: "_id", 
                foreignField: "subscriber", 
                as: "subscribedTo"
            }
        }, 
        // add these above two fields
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers",  // subscribers is a field. use $ sign
                }, 
                channelsSubscribedToCount: {
                    $size: "$subscribedTo", 
                }, 
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]}, 
                        then: true, 
                        else: false
                    }
                }
            }
        }, 
        {
            $project: {
                fullName: 1, 
                username: 1, 
                subscribersCount: 1, 
                channelsSubscribedToCount: 1, 
                isSubscribed: 1,
                avatar: 1, 
                coverImage: 1, 
                email: 1, 
                createdAt: 1
            }
        }
    ])

    // console.logging the channel will return an Array of Objects
    if (!channel?.length) {
        throw new ApiError(404, "Channel doesn't exist")
    }
    return res.status(200)
                .json(new ApiResponse(200, channel[0], "User Channel fetched successfully"))
})

const getWatchHistory = asyncHandler(async (req, res) => {

    // req.user._id
    // INTERVIEW:  we can fetch the userID from mongoDB. But in mongoDB the userID is the entire Object and not only the id string
    // but as we're using mongoose, it automatically convert it to the Object format of mongoDB's id. 

    const user = await User.aggregate([
        {
            $match: {
                _id: mongoose.Types.ObjectId(req.user._id)
            }
        }, 
        {
            $lookup: {
                from: "videos", 
                localField: "watchHistory", 
                foreignField: "_id", 
                as: "watchHistory", 
                pipepline: [
                    {
                        $lookup: {
                            from: "users", 
                            localField: "owner", 
                            foreignField: "_id", 
                            as: "owner", 
                            pipepline: [
                                {
                                    $project: {
                                        fullName: 1, 
                                        username: 1, 
                                        avatar: 1,   
                                    }
                                }
                            ]
                        }
                    }, 
                    // To send structured Data from backend to frontend
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
    
    return res.status(200)
                .json(new ApiResponse(200, user[0].watchHistory, "Watch History fetched successfully"))
})

export {registerUser,
        loginUser,
        logoutUser, 
        refreshAccessToken, 
        changeCurrentPassword, 
        getCurrentUser, 
        updateAccountDetails, 
        updateUserAvatar, 
        updateUserCoverImage, 
        getUserChannelProfile, 
        getWatchHistory
    }