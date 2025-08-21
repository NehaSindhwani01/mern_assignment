import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import authRoutes from './routes/authRoutes.js';
import agentRoutes from './routes/agentRoutes.js';
import listRoutes from './routes/listRoutes.js';

const app = express();

app.use(cors({
    origin: 'http://localhost:3000', // allow only frontend URL
    credentials: true,
}));


app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));

app.use('/uploads', express.static(path.resolve('uploads')));

app.get("/", (req, res) => res.send("🚀 Server is running successfully!"));


app.get('/api/health', (req, res) => res.json({ ok: true }));


app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/lists', listRoutes);


app.use((err, req, res, next) => {
    console.error(err);
    if (err?.message?.includes('Invalid file type')) {
        return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error' });
});

export default app;