const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}

export {asyncHandler}

// const asyncHandler = (func) => { () => {} }

// const asyncHandler = (fn) => async (req, res, next) => {     // higher order function. passing a function in a function's parameter
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false, 
//             message: error.message
//         })
//     }
// }