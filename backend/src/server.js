import dotenv from 'dotenv';
import connectDB from './config/db.js';
import app from './app.js';
import fs from 'fs';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

connectDB(process.env.MONGO_URI)
    .then(() => {
        app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));
    })
    .catch((e) => {
        console.error('Mongo connection failed', e);
        process.exit(1);
    });
