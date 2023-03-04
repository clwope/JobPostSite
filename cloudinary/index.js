let cloudinary = require('cloudinary').v2;
const multer = require('multer');
let { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});

let storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "Project",
        allowedFormats: ["jpeg", "png", "jpg"]
    }
});

module.exports = {
    cloudinary,
    storage
}

let sto = multer.memoryStorage();