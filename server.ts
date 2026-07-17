import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Path to file database
const DB_PATH = path.join(process.cwd(), 'user_db.json');

// Interface for server database store
interface ServerUserRecord {
  username: string;
  email: string;
  currentStreak: number;
  highestStreak: number;
  lastActiveDate: string | null;
  level: number;
  xp: number;
  subscription: 'free' | 'premium';
  badges: string[];
  milestones: string[];
  notificationsEnabled: boolean;
  notificationTime: string;
  dailyLogs: any[];
  ratings: Record<string, number>;
  readHistory: Record<string, string>;
  customCards: any[];
}

interface ServerDB {
  users: Record<string, ServerUserRecord>;
}

// Memory fallback and load/save helper
let db: ServerDB = { users: {} };

function loadDB() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      db = JSON.parse(data);
    } else {
      saveDB();
    }
  } catch (error) {
    console.error('Error loading server DB, using memory:', error);
  }
}

function saveDB() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving server DB:', error);
  }
}

// Initial DB load
loadDB();

// Lazy Gemini client helper
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is not configured in the environment.');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// --- API ROUTES ---

// 1. Authenticate / Sync Route
app.post('/api/auth/login', (req: express.Request, res: express.Response) => {
  const { email, username, clientData } = req.body;

  if (!email || !email.includes('@')) {
    res.status(400).json({ error: 'Valid email is required.' });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();
  let userRecord = db.users[normalizedEmail];

  // If user does not exist, create or adopt client-side profile
  if (!userRecord) {
    console.log(`Registering new user: ${normalizedEmail}`);
    userRecord = {
      username: username || normalizedEmail.split('@')[0],
      email: normalizedEmail,
      currentStreak: clientData?.profile?.currentStreak || 0,
      highestStreak: clientData?.profile?.highestStreak || 0,
      lastActiveDate: clientData?.profile?.lastActiveDate || null,
      level: clientData?.profile?.level || 1,
      xp: clientData?.profile?.xp || 0,
      subscription: clientData?.profile?.subscription || 'free',
      badges: clientData?.profile?.badges || [],
      milestones: clientData?.profile?.milestones || [],
      notificationsEnabled: clientData?.profile?.notificationsEnabled || false,
      notificationTime: clientData?.profile?.notificationTime || '09:00',
      dailyLogs: clientData?.dailyLogs || [],
      ratings: clientData?.ratings || {},
      readHistory: clientData?.readHistory || {},
      customCards: clientData?.customCards || []
    };
    db.users[normalizedEmail] = userRecord;
    saveDB();
  } else if (clientData && clientData.profile) {
    // If user exists, resolve conflicts using highest XP or most badges/streaks
    const clientXp = clientData.profile.xp || 0;
    if (clientXp > userRecord.xp) {
      console.log(`Merging state for ${normalizedEmail}: Client profile is newer/higher XP.`);
      userRecord.xp = clientXp;
      userRecord.level = clientData.profile.level || userRecord.level;
      userRecord.currentStreak = Math.max(userRecord.currentStreak, clientData.profile.currentStreak || 0);
      userRecord.highestStreak = Math.max(userRecord.highestStreak, clientData.profile.highestStreak || 0);
      userRecord.lastActiveDate = clientData.profile.lastActiveDate || userRecord.lastActiveDate;
      userRecord.badges = Array.from(new Set([...userRecord.badges, ...(clientData.profile.badges || [])]));
      userRecord.milestones = Array.from(new Set([...userRecord.milestones, ...(clientData.profile.milestones || [])]));
      userRecord.dailyLogs = clientData.dailyLogs || userRecord.dailyLogs;
      userRecord.ratings = { ...userRecord.ratings, ...clientData.ratings };
      userRecord.readHistory = { ...userRecord.readHistory, ...clientData.readHistory };
      userRecord.customCards = [...userRecord.customCards, ...(clientData.customCards || [])].filter(
        (card, idx, arr) => arr.findIndex(c => c.id === card.id) === idx
      );
      saveDB();
    }
  }

  res.json({
    message: 'Login successful',
    profile: {
      username: userRecord.username,
      email: userRecord.email,
      currentStreak: userRecord.currentStreak,
      highestStreak: userRecord.highestStreak,
      lastActiveDate: userRecord.lastActiveDate,
      level: userRecord.level,
      xp: userRecord.xp,
      subscription: userRecord.subscription,
      badges: userRecord.badges,
      milestones: userRecord.milestones,
      notificationsEnabled: userRecord.notificationsEnabled,
      notificationTime: userRecord.notificationTime
    },
    dailyLogs: userRecord.dailyLogs,
    ratings: userRecord.ratings,
    readHistory: userRecord.readHistory,
    customCards: userRecord.customCards
  });
});

// 2. Incremental Sync
app.post('/api/sync', (req: express.Request, res: express.Response) => {
  const { email, syncData } = req.body;
  if (!email) {
    res.status(401).json({ error: 'Authentication required for syncing.' });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = db.users[normalizedEmail];
  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  if (syncData) {
    // Update server state with client's synchronized logs/stats
    user.xp = Math.max(user.xp, syncData.profile.xp || 0);
    user.level = Math.max(user.level, syncData.profile.level || 1);
    user.currentStreak = syncData.profile.currentStreak;
    user.highestStreak = Math.max(user.highestStreak, syncData.profile.highestStreak || 0);
    user.lastActiveDate = syncData.profile.lastActiveDate;
    user.badges = Array.from(new Set([...user.badges, ...(syncData.profile.badges || [])]));
    user.milestones = Array.from(new Set([...user.milestones, ...(syncData.profile.milestones || [])]));
    user.notificationsEnabled = syncData.profile.notificationsEnabled;
    user.notificationTime = syncData.profile.notificationTime;
    user.dailyLogs = syncData.dailyLogs || user.dailyLogs;
    user.ratings = { ...user.ratings, ...syncData.ratings };
    user.readHistory = { ...user.readHistory, ...syncData.readHistory };
    user.customCards = syncData.customCards || user.customCards;
    
    saveDB();
  }

  res.json({ success: true, profile: user });
});

// 3. Leaderboard Route (global sorting)
app.get('/api/leaderboard', (req: express.Request, res: express.Response) => {
  // Return top users sorted by XP
  const list = Object.values(db.users).map(user => ({
    username: user.username,
    xp: user.xp,
    streak: user.currentStreak,
    level: user.level,
    isPremium: user.subscription === 'premium'
  }));

  // Ensure mock data exists so the leaderboard is never blank
  const defaultCompetitors = [
    { username: 'MindsetAlchemist', xp: 2450, streak: 14, level: 12, isPremium: true },
    { username: 'AuraImprover', xp: 1800, streak: 8, level: 8, isPremium: false },
    { username: 'AtomicHabitFan', xp: 1250, streak: 5, level: 6, isPremium: true },
    { username: 'EQExplorer', xp: 820, streak: 4, level: 4, isPremium: false },
    { username: 'DeepWorker_99', xp: 410, streak: 2, level: 2, isPremium: false }
  ];

  // Merge lists and de-duplicate by username
  const mergedMap: Record<string, typeof defaultCompetitors[0]> = {};
  defaultCompetitors.forEach(c => mergedMap[c.username] = c);
  list.forEach(c => {
    mergedMap[c.username] = c;
  });

  const sortedLeaderboard = Object.values(mergedMap).sort((a, b) => b.xp - a.xp);
  res.json(sortedLeaderboard);
});

// 4. Premium Subscription Upgrade API
app.post('/api/subscription/upgrade', (req: express.Request, res: express.Response) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = db.users[normalizedEmail];
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  user.subscription = 'premium';
  // Reward premium bonus XP and unlock the badge
  user.xp += 300;
  if (!user.badges.includes('badge_premium')) {
    user.badges.push('badge_premium');
  }
  
  saveDB();
  res.json({ success: true, profile: user });
});

// 5. Generate Custom Personality Flashcards using Gemini AI
app.post('/api/ai/generate-card', async (req: express.Request, res: express.Response) => {
  const { email, topic, category } = req.body;
  if (!email) {
    res.status(401).json({ error: 'Authorization required.' });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = db.users[normalizedEmail];
  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  // Double check custom generation permissions or free allowance
  if (user.subscription !== 'premium' && user.customCards.length >= 2) {
    res.status(403).json({
      error: 'Upgrade required. Free accounts are limited to 2 custom AI cards. Unlock Premium for unlimited generations.'
    });
    return;
  }

  if (!topic || topic.trim() === '') {
    res.status(400).json({ error: 'Topic cannot be empty.' });
    return;
  }

  try {
    const ai = getAiClient();
    const prompt = `Create a personality development or personal growth flashcard about the specific topic: "${topic}".
Categorize this card as one of: Mindset, EQ, Habits, Focus, Leadership, Communication. Set category appropriately based on the topic.
Respond in strict JSON matching the schema below:
{
  "category": "Mindset" | "EQ" | "Habits" | "Focus" | "Leadership" | "Communication",
  "title": "A short engaging card title (maximum 4 words)",
  "frontQuote": "A highly motivational quote relevant to the topic (include attribution if possible)",
  "concept": "A clear, insightful scientific or psychological explanation of the concept (2-3 sentences)",
  "takeaways": [
    "A practical, punchy takeaway or core insight",
    "Another actionable takeaway or core insight",
    "A third actionable takeaway or core insight"
  ],
  "actionStep": "One concrete, direct daily action step the learner can perform today to practice this."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, description: 'Must be one of the specified categories.' },
            title: { type: Type.STRING },
            frontQuote: { type: Type.STRING },
            concept: { type: Type.STRING },
            takeaways: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Exactly 3 actionable bullet points.'
            },
            actionStep: { type: Type.STRING, description: 'A single immediate micro-action.' }
          },
          required: ['category', 'title', 'frontQuote', 'concept', 'takeaways', 'actionStep']
        }
      }
    });

    const cardData = JSON.parse(response.text?.trim() || '{}');
    const newCard = {
      id: `ai_${Date.now()}`,
      category: cardData.category || category || 'Custom',
      title: cardData.title || topic,
      frontQuote: cardData.frontQuote || '"Growth begins at the end of your comfort zone."',
      concept: cardData.concept || 'Understanding new challenges and expanding horizons.',
      takeaways: cardData.takeaways || ['Embrace novelty', 'Learn through action', 'Iterate daily'],
      actionStep: cardData.actionStep || 'Spend 5 minutes doing something unfamiliar today.',
      readCount: 0,
      isAiGenerated: true
    };

    // Save newly generated card into user record
    user.customCards.push(newCard);
    user.xp += 150; // Give XP for active learning card generation
    if (!user.badges.includes('badge_custom_gen')) {
      user.badges.push('badge_custom_gen');
    }
    saveDB();

    res.json({ success: true, card: newCard, profile: user });
  } catch (error: any) {
    console.error('Gemini card generation error:', error);
    res.status(500).json({
      error: 'Failed to generate flashcard. If your API key is invalid, please update it in AI Studio secrets.',
      details: error.message
    });
  }
});

// 6. Interactive Personal Growth Coaching AI Chat Route (Premium feature)
app.post('/api/ai/coach', async (req: express.Request, res: express.Response) => {
  const { email, message, history } = req.body;

  if (!email) {
    res.status(401).json({ error: 'Authorization required.' });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = db.users[normalizedEmail];
  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  if (user.subscription !== 'premium') {
    res.status(403).json({
      error: 'Upgrade required. Chatting with the AI Growth Coach is a Premium Feature.'
    });
    return;
  }

  try {
    const ai = getAiClient();
    
    // Construct instructions context with user stats
    const systemInstruction = `You are a highly empathetic, actionable, and professional AI Growth & Personality Coach.
The user is learning personality development through flashcards.
User Profile context:
- Name: ${user.username}
- Current Streak: ${user.currentStreak} days
- Total XP: ${user.xp}
- Level: ${user.level}

Use active listening, validate the user's challenges, provide concrete strategies from emotional intelligence, cognitive reframing, and James Clear's habit theory. Keep your response concise, readable with markdown, and highly conversational. End with a motivational question or a micro-challenge.`;

    // Map history to Gemini format
    const contents = [];
    if (history && Array.isArray(history)) {
      for (const h of history) {
        contents.push({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content }]
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.8
      }
    });

    res.json({
      success: true,
      reply: response.text || "I'm reflecting on what you said. Let's focus on taking a small daily action step."
    });
  } catch (error: any) {
    console.error('Gemini Coaching error:', error);
    res.status(500).json({
      error: 'Coaching session failed to respond. Please check your Gemini API key configurations.',
      details: error.message
    });
  }
});

// Setup dev server or static hosting
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Running Express server in DEVELOPMENT mode with Vite middleware');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Running Express server in PRODUCTION mode serving dist/');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express server running on http://localhost:${PORT}`);
  });
}

startServer();
