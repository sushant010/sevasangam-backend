import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import cloudinary from './cloudinary.js';

// Set up Cloudinary storage for PDFs
const pdfStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'pdfs', // Folder in Cloudinary to store PDFs
        format: async (req, file) => 'pdf', // Ensure the format is always 'pdf'
        public_id: (req, file) => file.originalname.split('.')[0], // Use the file name without extension as public ID
        resource_type: 'raw' // Set resource type to 'raw' for non-image files like PDFs
    },
});

const pdfUpload = multer({ storage: pdfStorage });

export default pdfUpload;