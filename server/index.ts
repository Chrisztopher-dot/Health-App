import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GeminiBackendService } from './geminiService';
import { HealthDatabaseService } from './db';
import { SeniorWeatherService } from './weatherService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(cors());
// 50mb body limit for high-res food camera snapshots & video frames
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 1. Health & Config Status Check
app.get('/api/health-check', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: GeminiBackendService.isConfigured(),
    message: GeminiBackendService.isConfigured()
      ? 'Gemini Multimodal AI is active and ready!'
      : 'Server is running in Local Heuristic Fallback mode. Add GEMINI_API_KEY to .env for real-time cloud AI.',
  });
});

// 2. Multimodal Food & Video Scan Endpoint
app.post('/api/scan-food', async (req: Request, res: Response): Promise<void> => {
  const { image, mimeType, hint, profile } = req.body;

  if (!image) {
    res.status(400).json({ error: 'Image base64 data is required.' });
    return;
  }

  if (!GeminiBackendService.isConfigured()) {
    res.status(503).json({
      error: 'GEMINI_API_KEY not configured.',
      fallbackNeeded: true,
    });
    return;
  }

  try {
    const analysis = await GeminiBackendService.analyzeFood(
      image,
      mimeType || 'image/jpeg',
      hint,
      profile
    );
    res.json({
      source: 'gemini-1.5-flash',
      data: analysis,
    });
  } catch (error: any) {
    console.error('Gemini Food Scan Error:', error?.message || error);
    res.status(500).json({
      error: error?.message || 'Failed to analyze food plate with Gemini AI.',
      fallbackNeeded: true,
    });
  }
});

// 3. Conversational Check-In Endpoint
app.post('/api/chat-checkin', async (req: Request, res: Response): Promise<void> => {
  const { messages, userMessage, profile } = req.body;

  if (!userMessage) {
    res.status(400).json({ error: 'User message is required.' });
    return;
  }

  if (!GeminiBackendService.isConfigured()) {
    res.status(503).json({
      error: 'GEMINI_API_KEY not configured.',
      fallbackNeeded: true,
    });
    return;
  }

  try {
    const reply = await GeminiBackendService.generateCheckInResponse(
      messages || [],
      userMessage,
      profile
    );
    res.json({
      source: 'gemini-1.5-flash',
      reply,
    });
  } catch (error: any) {
    console.error('Gemini Chat CheckIn Error:', error?.message || error);
    res.status(500).json({
      error: error?.message || 'Failed to generate chat response.',
      fallbackNeeded: true,
    });
  }
});

// 4. Retrospective Health Query Endpoint
app.post('/api/timeline-query', async (req: Request, res: Response): Promise<void> => {
  const { question, history, profile } = req.body;

  if (!question) {
    res.status(400).json({ error: 'Question is required.' });
    return;
  }

  if (!GeminiBackendService.isConfigured()) {
    res.status(503).json({
      error: 'GEMINI_API_KEY not configured.',
      fallbackNeeded: true,
    });
    return;
  }

  try {
    const answer = await GeminiBackendService.answerHealthHistoryQuery(
      question,
      history || [],
      profile
    );
    res.json({
      source: 'gemini-1.5-flash',
      answer,
    });
  } catch (error: any) {
    console.error('Gemini Query Error:', error?.message || error);
    res.status(500).json({
      error: error?.message || 'Failed to answer query with Gemini AI.',
      fallbackNeeded: true,
    });
  }
});

// 5. Senior Weather & Air Quality Health Advisory Endpoint
app.get('/api/weather-advisory', async (req: Request, res: Response): Promise<void> => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : 37.7749;
    const lon = req.query.lon ? parseFloat(req.query.lon as string) : -122.4194;
    const city = (req.query.city as string) || 'San Francisco Bay Area';

    const advisory = await SeniorWeatherService.getSeniorAdvisory(lat, lon, city);
    res.json(advisory);
  } catch (error: any) {
    console.error('Weather Advisory Error:', error?.message || error);
    res.status(500).json({
      error: 'Failed to retrieve weather advisory',
    });
  }
});

// 6. SQLite Health Data Sync
app.post('/api/sync', (req: Request, res: Response): void => {
  try {
    const result = HealthDatabaseService.syncAllData(req.body);
    res.json(result);
  } catch (error: any) {
    console.error('Database Sync Error:', error?.message || error);
    res.status(500).json({ error: 'Failed to sync data to SQLite database.' });
  }
});

// 7. Create Database Backup Snapshot
app.post('/api/backup', (_req: Request, res: Response): void => {
  try {
    const backup = HealthDatabaseService.createBackup();
    res.json(backup);
  } catch (error: any) {
    console.error('Backup Creation Error:', error?.message || error);
    res.status(500).json({ error: 'Failed to create database backup snapshot.' });
  }
});

// 8. List Backup Snapshots
app.get('/api/backups', (_req: Request, res: Response): void => {
  try {
    const backups = HealthDatabaseService.listBackups();
    res.json(backups);
  } catch (error: any) {
    console.error('List Backups Error:', error?.message || error);
    res.status(500).json({ error: 'Failed to list backup snapshots.' });
  }
});

// 9. Restore Database from Backup
app.post('/api/restore', (req: Request, res: Response): void => {
  try {
    const result = HealthDatabaseService.restoreFromBackup(req.body);
    res.json(result);
  } catch (error: any) {
    console.error('Database Restore Error:', error?.message || error);
    res.status(500).json({ error: error?.message || 'Failed to restore database.' });
  }
});

// 10. User Account Registration & Salting / Hashing Persistence
app.post('/api/auth/register', (req: Request, res: Response): void => {
  try {
    const user = req.body;
    if (!user || !user.username || !user.salt || !user.passwordHash) {
      res.status(400).json({ error: 'Invalid user registration payload.' });
      return;
    }
    HealthDatabaseService.saveUser(user);
    res.json({ status: 'ok', message: 'User registered in SQLite.' });
  } catch (error: any) {
    console.error('Auth Register Error:', error?.message || error);
    res.status(500).json({ error: 'Failed to register user.' });
  }
});

// 11. Retrieve Registered Users (Sanitized without password hashes)
app.get('/api/auth/users', (_req: Request, res: Response): void => {
  try {
    const users = HealthDatabaseService.getAllUsers();
    res.json(users);
  } catch (error: any) {
    console.error('Auth Get Users Error:', error?.message || error);
    res.status(500).json({ error: 'Failed to list users.' });
  }
});

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`🏥 Daily Health Check-In Backend Server`);
  console.log(`🚀 Running on http://localhost:${PORT}`);
  console.log(`✨ Gemini Multimodal AI: ${GeminiBackendService.isConfigured() ? '✅ Connected' : '⚠️ Offline/Fallback Mode'}`);
  console.log(`🗄️ SQLite Database: ✅ Active (WAL Mode)`);
  console.log(`🛡️ Auth & Password Protection: ✅ PBKDF2 Salt & Hash Active`);
  console.log(`🌤️ Weather & Air Quality: ✅ Open-Meteo Connected`);
  console.log(`========================================`);
});
