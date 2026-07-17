import { Flashcard, Badge, Milestone } from '../types';

export const STATIC_FLASHCARDS: Flashcard[] = [
  {
    id: 'mindset_1',
    category: 'Mindset',
    title: 'The Growth Mindset',
    frontQuote: '"In a growth mindset, challenges are exciting rather than threatening." — Carol Dweck',
    concept: 'Intelligence and abilities can be developed through dedication, hard work, and learning. Failure is not a permanent state but an invitation to grow.',
    takeaways: [
      'Reframe "I can\'t do this" to "I can\'t do this YET."',
      'Embrace critique as constructive feedback rather than a personal attack.',
      'Celebrate effort and strategies rather than innate talent.'
    ],
    actionStep: 'Identify one task you avoided because it felt "too hard." Spend 15 minutes today working on it, purely focusing on the learning process.',
    readCount: 0
  },
  {
    id: 'mindset_2',
    category: 'Mindset',
    title: 'Cognitive Reframing',
    frontQuote: '"The primary cause of unhappiness is never the situation but your thoughts about it." — Eckhart Tolle',
    concept: 'A psychological technique to identify and dispute irrational or maladaptive thoughts. It empowers you to view situations from a more positive and productive lens.',
    takeaways: [
      'Notice negative self-talk when obstacles arise.',
      'Ask: "Is there another, more constructive way to look at this?"',
      'Focus on factors within your direct control.'
    ],
    actionStep: 'Think of a recent disappointment. Write down three unexpected benefits or lessons that came from it.',
    readCount: 0
  },
  {
    id: 'eq_1',
    category: 'EQ',
    title: 'The Emotional Pause',
    frontQuote: '"Between stimulus and response there is a space. In that space is our power to choose our response." — Viktor Frankl',
    concept: 'Emotional intelligence starts with self-regulation. Taking a deliberate pause prevents impulsive emotional reactions and enables thoughtful, values-driven actions.',
    takeaways: [
      'The "6-Second Rule": When triggered, wait 6 seconds before responding to let cognitive centers override emotional responses.',
      'Physiologically calm your nervous system with a deep diaphragmatic exhale.',
      'Identify the raw emotion without judgment (e.g., "I am feeling defensive").'
    ],
    actionStep: 'The next time you receive a frustrating email or text, close it, take three deep breaths, and wait at least 5 minutes before replying.',
    readCount: 0
  },
  {
    id: 'eq_2',
    category: 'EQ',
    title: 'Active Listening',
    frontQuote: '"Most people do not listen with the intent to understand; they listen with the intent to reply." — Stephen Covey',
    concept: 'Active listening is the cornerstone of EQ and empathy. It involves fully focusing on the speaker, understanding their message, and reflecting back what you heard before responding.',
    takeaways: [
      'Silence your inner monologue and stop preparing your rebuttal.',
      'Maintain comfortable eye contact and nodding to show presence.',
      'Summarize and validate: "It sounds like you felt frustrated when..."'
    ],
    actionStep: 'In your next conversation, ask two clarifying questions before sharing your own opinion or advice.',
    readCount: 0
  },
  {
    id: 'habits_1',
    category: 'Habits',
    title: 'Atomic Habits & Identity',
    frontQuote: '"Every action you take is a vote for the type of person you wish to become." — James Clear',
    concept: 'True habit change does not stem from goals, but from identity. By shifting your self-belief first, small 1% actions accumulate into compounding lifestyle shifts.',
    takeaways: [
      'Focus on systems and processes rather than raw results.',
      'Stack new habits onto existing cues (e.g., "After pouring my coffee, I will meditate").',
      'Make habits obvious, attractive, easy, and satisfying.'
    ],
    actionStep: 'Choose a habit you want to build. Anchor it to an established daily routine using "After [Established Habit], I will [New Habit]."',
    readCount: 0
  },
  {
    id: 'habits_2',
    category: 'Habits',
    title: 'The 2-Minute Rule',
    frontQuote: '"When you start a new habit, it should take less than two minutes to do." — James Clear',
    concept: 'Procrastination usually feeds on the perceived effort of starting. Scaling a habit down to 2 minutes removes cognitive friction and establishes the routine of showing up.',
    takeaways: [
      'Scale "Read 30 pages" down to "Read 1 page."',
      'Scale "Run 5 miles" down to "Put on my running shoes."',
      'Optimize for the beginning, not the end.'
    ],
    actionStep: 'Take a habit you have been putting off and complete a 2-minute version of it right now.',
    readCount: 0
  },
  {
    id: 'focus_1',
    category: 'Focus',
    title: 'Deep Work & Attention Residue',
    frontQuote: '"To produce at your peak level you need to work for extended periods with full concentration." — Cal Newport',
    concept: 'Whenever you switch tasks, a portion of your attention remains glued to the previous task (attention residue). Multi-tasking degrades cognitive efficiency and depth.',
    takeaways: [
      'Eliminate all external triggers: close tabs, mute notifications, hide your phone.',
      'Schedule concrete "Deep Work blocks" of 90 minutes in your calendar.',
      'Batch administrative "shallow work" tasks together.'
    ],
    actionStep: 'Turn on Do Not Disturb and close all browser tabs except this one. Complete your next task with 100% single-pointed focus.',
    readCount: 0
  },
  {
    id: 'focus_2',
    category: 'Focus',
    title: 'The Pomodoro Technique',
    frontQuote: '"Focus on being productive instead of busy." — Tim Ferriss',
    concept: 'A structured time-management system that leverages cyclical high-intensity focus sprints paired with short, restorative cognitive breaks to maintain mental energy.',
    takeaways: [
      'Set a timer for 25 minutes of single-minded focus.',
      'Take a 5-minute physical break (stretch, drink water; do not check social media!).',
      'Every 4 cycles, reward yourself with a longer 20-30 minute break.'
    ],
    actionStep: 'Use the in-app Pomodoro timer to guide your learning session for today.',
    readCount: 0
  },
  {
    id: 'leadership_1',
    category: 'Leadership',
    title: 'Radical Candor',
    frontQuote: '"Care personally. Challenge directly." — Kim Scott',
    concept: 'Effective leadership balances empathy with direct accountability. Providing honest, timely feedback while genuinely caring for the person builds deep trust and operational excellence.',
    takeaways: [
      'Avoid "Ruinous Empathy" (not telling the truth to spare temporary feelings).',
      'Avoid "Obnoxious Aggression" (criticizing without demonstrating care).',
      'Deliver guidance promptly, private for criticism, public for praise.'
    ],
    actionStep: 'Think of feedback you have been holding back. Reframe it so it clearly expresses both high standards and personal support, and schedule a talk.',
    readCount: 0
  },
  {
    id: 'communication_1',
    category: 'Communication',
    title: 'The Pyramid Principle',
    frontQuote: '"To communicate clearly, present your conclusion first, then support it." — Barbara Minto',
    concept: 'A structured communication framework where you state the core takeaway or answer first, followed by logical category groupings, and then supporting details. This respects your audience\'s cognitive bandwidth.',
    takeaways: [
      'Bottom Line Up Front (BLUF): State the recommendation immediately.',
      'Group arguments into 3 distinct logical categories.',
      'Deepen the explanation with concrete supporting data underneath.'
    ],
    actionStep: 'When you write your next email, rewrite the opening sentence to state your exact request or conclusion directly.',
    readCount: 0
  }
];

export const BADGES: Badge[] = [
  {
    id: 'badge_first_card',
    title: 'First Step',
    description: 'Read and rated your first personality flashcard.',
    icon: 'BookOpen',
    xpReward: 50
  },
  {
    id: 'badge_streak_3',
    title: 'Consistency Spark',
    description: 'Achieved a 3-day reading streak.',
    icon: 'Flame',
    xpReward: 100
  },
  {
    id: 'badge_streak_7',
    title: 'Mindset Warrior',
    description: 'Achieved a 7-day reading streak.',
    icon: 'Award',
    xpReward: 250
  },
  {
    id: 'badge_all_categories',
    title: 'Omnivore',
    description: 'Read at least one card in every personality category.',
    icon: 'Compass',
    xpReward: 200
  },
  {
    id: 'badge_custom_gen',
    title: 'AI Innovator',
    description: 'Generated a personalized flashcard using the AI Coach.',
    icon: 'Sparkles',
    xpReward: 150
  },
  {
    id: 'badge_premium',
    title: 'Elevated Mindset',
    description: 'Unlocked Premium status for infinite growth and custom coaching.',
    icon: 'Zap',
    xpReward: 300
  }
];

export const MILESTONES: Milestone[] = [
  {
    id: 'milestone_level_2',
    title: 'Growth Apprentice',
    requirement: 'Reach Level 2 (150 XP)',
    xpRequired: 150,
    unlocked: false
  },
  {
    id: 'milestone_level_5',
    title: 'Mindset Scholar',
    requirement: 'Reach Level 5 (600 XP)',
    xpRequired: 600,
    unlocked: false
  },
  {
    id: 'milestone_level_10',
    title: 'Personality Alchemist',
    requirement: 'Reach Level 10 (1500 XP)',
    xpRequired: 1500,
    unlocked: false
  }
];
