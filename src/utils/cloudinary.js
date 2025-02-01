import { v2 as cloudinary} from 'cloudinary';
import fs from 'fs'; 

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,  
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
});


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null; 

        // check if the file exists before uploading
        if (!fs.existsSync(localFilePath)) {
            console.error("File doesn't exists at path: ", localFilePath)
            return null;
        }
        // upload the file on cloudinary: 
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto" // detect automatically which type of file is being uploaded [png/jpg/pdf/jpeg]
        })
        console.log(response);
        
        // file has been uploaded successfully: 
        console.log("file is uploaded on cloudinary", response.url);

         if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
            console.log("Local file deleted successfully.");
        }
        return response

    } catch (error) {
        console.log("Cloudinary Upload failed", error);
        
         if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
            console.log("Local file deleted due to failed upload.");
        }
        return null
    }
}

export {uploadOnCloudinary}


