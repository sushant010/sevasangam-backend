import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import cloudinary from './cloudinary.js';

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'avatars',
        format: async (req, file) => file.mimetype.split('/')[1],
        public_id: (req, file) => file.originalname.split('.')[0], // Use the file name without extension as public ID
    },
});

const upload = multer({ storage: storage });

export default upload;