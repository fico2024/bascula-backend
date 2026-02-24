import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from './prisma';

dotenv.config();

import entityRoutes from './routes/entity.routes';
import ticketRoutes from './routes/ticket.routes';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import settingsRoutes from './routes/settings.routes';
import statsRoutes from './routes/stats.routes';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

import fs from 'fs';
import path from 'path';

app.get('/api/ping-agent', (req, res) => {
    const agentPath1 = path.join(process.cwd(), 'assets', 'bascula.exe');
    const agentPath2 = path.join(__dirname, '..', '..', 'assets', 'bascula.exe');
    res.json({
        cwd: process.cwd(),
        dirname: __dirname,
        path1: agentPath1,
        exists1: fs.existsSync(agentPath1),
        path2: agentPath2,
        exists2: fs.existsSync(agentPath2)
    });
});

app.use('/api/entities', entityRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/system-settings', settingsRoutes);
app.use('/api/stats', statsRoutes);

// Main health route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Bascula API is running'
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`[Backend] API server running on port ${PORT}`);
});
