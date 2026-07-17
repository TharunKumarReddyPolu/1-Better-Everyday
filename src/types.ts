export interface UserProfile {
  username: string;
  email: string;
  currentStreak: number;
  highestStreak: number;
  lastActiveDate: string | null;
  level: number;
  xp: number;
  subscription: 'free' | 'premium';
  badges: string[]; // List of badge IDs unlocked
  milestones: string[]; // List of milestone IDs reached
  notificationsEnabled: boolean;
  notificationTime: string; // e.g. "09:00"
}

export interface Flashcard {
  id: string;
  category: 'Mindset' | 'EQ' | 'Habits' | 'Focus' | 'Leadership' | 'Communication' | 'Custom';
  title: string;
  frontQuote: string;
  concept: string;
  takeaways: string[];
  actionStep: string;
  rating?: number; // 1-5 rating given by user
  readCount: number;
  lastReadDate?: string;
  isAiGenerated?: boolean;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  xpReward: number;
}

export interface Milestone {
  id: string;
  title: string;
  requirement: string;
  xpRequired: number;
  unlocked: boolean;
}

export interface LeaderboardEntry {
  username: string;
  xp: number;
  streak: number;
  level: number;
  isPremium: boolean;
  isCurrentUser?: boolean;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  xpEarned: number;
  cardsRead: number;
}

export interface SyncData {
  profile: UserProfile;
  dailyLogs: DailyLog[];
  ratings: Record<string, number>; // cardId -> rating
  readHistory: Record<string, string>; // cardId -> lastReadDate
  customCards: Flashcard[];
}
