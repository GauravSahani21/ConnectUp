import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

export async function uploadToCloudinary(file: File, folder: string = 'connectup'): Promise<any> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                folder: folder,
                resource_type: 'auto', // Auto-detect image/video/audio
            },
            (error, result) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(result);
            }
        ).end(buffer);
    });
}
