import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import authRoutes from './routes/authRoutes';
import friendRoutes from './routes/friendRoutes';
import messageRoutes from './routes/messageRoutes';
import userRoutes from './routes/userRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app: Application = express();

app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);

if (process.env.VERCEL) {
  const publicDir = path.join(process.cwd(), 'public');

  app.get('*', (req: Request, res: Response, next) => {
    if (
      req.path.startsWith('/api') ||
      req.path.startsWith('/socket.io') ||
      req.path === '/health'
    ) {
      return next();
    }

    const relativePath = req.path === '/' ? 'index.html' : req.path.replace(/^\//, '');
    const assetPath = path.join(publicDir, relativePath);

    if (relativePath !== 'index.html' && fs.existsSync(assetPath) && fs.statSync(assetPath).isFile()) {
      return res.sendFile(assetPath);
    }

    const indexPath = path.join(publicDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }

    return next();
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
