let { S3 } = require("aws-sdk");
let uuid = require("uuid").v4;

const s3 = new S3({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY
    }
})

exports.s3UploadImage = async (file) => {
    let params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `images/${uuid()}-${file.originalname}`,
        Body: file.buffer
    }

    return await s3.upload(params).promise();

}

exports.s3UploadPDF = async (file) => {
    let params = {
        Bucket : process.env.AWS_BUCKET_NAME,
        Key : `cvs/${uuid()}-${file.originalname}`,
        Body: file.buffer 
    }

    return await s3.upload(params).promise();
}

exports.s3GetImage = async (file) => {
    let params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: file.key
    }

    return (await s3.getObject(params).promise()).Body.toString("base64");
} 

exports.s3GetPDF = async (file) => {
    let params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key : file.key
    }

    return (await s3.getObject(params).promise()).Body.toString("base64");
}

exports.s3DeleteImage = async (file) => { 
    let params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: file.key
    }

    return await s3.deleteObject(params).promise();
}

exports.s3DeletePDF = async (file) => {
    let params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: file.key
    }

    return await s3.deleteObject(params).promise();
}