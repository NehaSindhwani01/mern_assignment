import multer from 'multer';
import path from 'path';


const storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, 'uploads/'),
        filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    }
});


const allowed = ['.csv', '.xlsx', '.xls'];


export const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
        if (!allowed.includes(ext)) {
            return cb(new Error('Invalid file type. Allowed: csv, xlsx, xls'));
        }
        cb(null, true);
    },
    limits: { fileSize: 10 * 1024 * 1024 }
});