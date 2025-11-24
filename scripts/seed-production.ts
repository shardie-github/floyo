#!/usr/bin/env tsx
/**
 * Production Seed Data Generator
 * 
 * Generates comprehensive seed data for production demos and testing.
 * Creates users, events, patterns, subscriptions, and sample NPS submissions.
 * 
 * Usage: npm run seed:production
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const FILE_EXTENSIONS = [
  '.ts', '.tsx', '.js', '.jsx', '.py', '.md', '.json',
  '.css', '.html', '.sql', '.yml', '.yaml', '.sh'
];

const TOOLS = [
  'vscode', 'vim', 'emacs', 'intellij', 'sublime', 'atom',
  'git', 'docker', 'kubectl', 'npm', 'yarn', 'pip'
];

const OPERATIONS = ['created', 'modified', 'accessed', 'deleted'];

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateTimestamp(daysBack: number): Date {
  const now = new Date();
  const daysAgo = randomInt(0, daysBack);
  const hoursAgo = randomInt(0, 23);
  const minutesAgo = randomInt(0, 59);
  
  const timestamp = new Date(now);
  timestamp.setDate(timestamp.getDate() - daysAgo);
  timestamp.setHours(timestamp.getHours() - hoursAgo);
  timestamp.setMinutes(timestamp.getMinutes() - minutesAgo);
  
  return timestamp;
}

function generateFilePath(extension: string): string {
  const directories = [
    'src', 'frontend', 'backend', 'components', 'utils',
    'lib', 'api', 'hooks', 'types', 'tests', 'docs'
  ];
  
  const dir = randomChoice(directories);
  const fileName = `file_${randomInt(1, 1000)}${extension}`;
  
  return `/${dir}/${fileName}`;
}

async function createDemoUsers() {
  console.log('👤 Creating demo users...\n');
  
  const demoUsers = [
    {
      email: 'demo@floyo.dev',
      name: 'Demo User',
      emailVerified: true,
    },
    {
      email: 'demo-pro@floyo.dev',
      name: 'Demo Pro User',
      emailVerified: true,
    },
    {
      email: 'demo-enterprise@floyo.dev',
      name: 'Demo Enterprise User',
      emailVerified: true,
    },
  ];

  const createdUsers = [];
  
  for (const userData of demoUsers) {
    try {
      // Check if user exists
      const existing = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existing) {
        console.log(`  ✓ User already exists: ${userData.email}`);
        createdUsers.push(existing);
      } else {
        const user = await prisma.user.create({
          data: userData,
        });
        console.log(`  ✓ Created user: ${userData.email} (${user.id})`);
        createdUsers.push(user);
      }
    } catch (error) {
      console.error(`  ✗ Failed to create user ${userData.email}:`, error);
    }
  }

  return createdUsers;
}

async function createSubscriptions(users: any[]) {
  console.log('\n💳 Creating subscriptions...\n');
  
  const subscriptions = [];
  
  // Pro subscription for second user
  if (users[1]) {
    try {
      const existing = await prisma.subscription.findUnique({
        where: { userId: users[1].id },
      });

      if (!existing) {
        const sub = await prisma.subscription.create({
          data: {
            userId: users[1].id,
            plan: 'pro',
            status: 'active',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
        console.log(`  ✓ Created Pro subscription for ${users[1].email}`);
        subscriptions.push(sub);
      } else {
        console.log(`  ✓ Pro subscription already exists for ${users[1].email}`);
        subscriptions.push(existing);
      }
    } catch (error) {
      console.error(`  ✗ Failed to create Pro subscription:`, error);
    }
  }

  // Enterprise subscription for third user
  if (users[2]) {
    try {
      const existing = await prisma.subscription.findUnique({
        where: { userId: users[2].id },
      });

      if (!existing) {
        const sub = await prisma.subscription.create({
          data: {
            userId: users[2].id,
            plan: 'enterprise',
            status: 'active',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
        console.log(`  ✓ Created Enterprise subscription for ${users[2].email}`);
        subscriptions.push(sub);
      } else {
        console.log(`  ✓ Enterprise subscription already exists for ${users[2].email}`);
        subscriptions.push(existing);
      }
    } catch (error) {
      console.error(`  ✗ Failed to create Enterprise subscription:`, error);
    }
  }

  return subscriptions;
}

async function generateEvents(userId: string, count: number, daysBack: number) {
  console.log(`\n📊 Creating ${count} events for user ${userId}...`);
  
  const events = [];
  
  for (let i = 0; i < count; i++) {
    const extension = randomChoice(FILE_EXTENSIONS);
    const filePath = generateFilePath(extension);
    const tool = randomChoice(TOOLS);
    const operation = randomChoice(OPERATIONS);
    const timestamp = generateTimestamp(daysBack);
    
    try {
      const event = await prisma.event.create({
        data: {
          userId,
          filePath,
          eventType: operation,
          tool,
          timestamp,
          metadata: {
            extension,
            size: randomInt(100, 100000),
            lines: randomInt(10, 1000),
          },
        },
      });
      events.push(event);
    } catch (error) {
      console.error(`  ✗ Failed to create event ${i + 1}:`, error);
    }
  }
  
  console.log(`  ✓ Created ${events.length} events`);
  return events;
}

async function createPatterns(userId: string, events: any[]) {
  console.log(`\n🔍 Creating patterns from events...`);
  
  // Group events by extension
  const extensionCounts: Record<string, number> = {};
  const extensionTools: Record<string, Set<string>> = {};
  
  events.forEach(event => {
    const metadata = event.metadata as any;
    const ext = metadata?.extension || '.txt';
    extensionCounts[ext] = (extensionCounts[ext] || 0) + 1;
    
    if (!extensionTools[ext]) {
      extensionTools[ext] = new Set();
    }
    if (event.tool) {
      extensionTools[ext].add(event.tool);
    }
  });
  
  const patterns = [];
  
  for (const [ext, count] of Object.entries(extensionCounts)) {
    try {
      const pattern = await prisma.pattern.upsert({
        where: {
          userId_fileExtension: {
            userId,
            fileExtension: ext,
          },
        },
        update: {
          count: { increment: count },
          lastUsed: new Date(),
          tools: Array.from(extensionTools[ext] || []),
        },
        create: {
          userId,
          fileExtension: ext,
          count,
          tools: Array.from(extensionTools[ext] || []),
          lastUsed: new Date(),
        },
      });
      patterns.push(pattern);
    } catch (error) {
      console.error(`  ✗ Failed to create pattern for ${ext}:`, error);
    }
  }
  
  console.log(`  ✓ Created/updated ${patterns.length} patterns`);
  return patterns;
}

async function createNPSSubmissions(users: any[]) {
  console.log(`\n⭐ Creating NPS submissions...`);
  
  const submissions = [];
  const npsScores = [
    // Promoters (9-10)
    ...Array(15).fill(null).map(() => ({ score: randomInt(9, 10), category: 'promoter' as const })),
    // Passives (7-8)
    ...Array(5).fill(null).map(() => ({ score: randomInt(7, 8), category: 'passive' as const })),
    // Detractors (0-6)
    ...Array(3).fill(null).map(() => ({ score: randomInt(0, 6), category: 'detractor' as const })),
  ];

  const feedbacks = {
    promoter: [
      'Love how Floyo automatically detects my patterns!',
      'The integration suggestions are spot-on.',
      'Saves me hours every week.',
      'Best developer tool I\'ve used.',
      'Highly recommend to all developers.',
    ],
    passive: [
      'It\'s okay, could use more features.',
      'Works well but needs improvement.',
      'Decent tool, will continue using.',
    ],
    detractor: [
      'Too many false positives.',
      'Needs better documentation.',
      'Performance could be better.',
    ],
  };

  for (const user of users) {
    // Create 1-3 submissions per user
    const submissionCount = randomInt(1, 3);
    
    for (let i = 0; i < submissionCount; i++) {
      const npsData = randomChoice(npsScores);
      const feedback = randomChoice(feedbacks[npsData.category]);
      const daysAgo = randomInt(0, 30);
      const submittedAt = new Date();
      submittedAt.setDate(submittedAt.getDate() - daysAgo);

      try {
        // Prisma model: NPSSubmission (Prisma generates camelCase: nPSSubmission)
        // Using type assertion for now - will work after prisma generate
        const submission = await (prisma as any).nPSSubmission.create({
          data: {
            userId: user.id,
            score: npsData.score,
            feedback,
            category: npsData.category,
            submittedAt,
          },
        });
        submissions.push(submission);
      } catch (error) {
        console.error(`  ✗ Failed to create NPS submission:`, error);
      }
    }
  }
  
  console.log(`  ✓ Created ${submissions.length} NPS submissions`);
  return submissions;
}

async function main() {
  console.log('🌱 Starting production seed data generation...\n');
  console.log('=' .repeat(60) + '\n');

  try {
    // 1. Create demo users
    const users = await createDemoUsers();
    
    if (users.length === 0) {
      console.error('❌ No users created. Exiting.');
      process.exit(1);
    }

    // 2. Create subscriptions
    await createSubscriptions(users);

    // 3. Create events for each user
    const allEvents = [];
    for (const user of users) {
      const eventCount = user.email.includes('enterprise') ? 500 :
                        user.email.includes('pro') ? 200 : 100;
      const events = await createEvents(user.id, eventCount, 30);
      allEvents.push(...events);
    }

    // 4. Create patterns from events
    for (const user of users) {
      const userEvents = allEvents.filter(e => e.userId === user.id);
      await createPatterns(user.id, userEvents);
    }

    // 5. Create NPS submissions
    await createNPSSubmissions(users);

    console.log('\n' + '=' .repeat(60));
    console.log('\n✅ Production seed data generation complete!\n');
    console.log('Summary:');
    console.log(`  - Users: ${users.length}`);
    console.log(`  - Events: ${allEvents.length}`);
    console.log(`  - NPS Submissions: Created`);
    console.log('\nDemo users created:');
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.id})`);
    });
    console.log('\nYou can now:');
    console.log('  1. Log in with demo@floyo.dev');
    console.log('  2. View patterns and insights');
    console.log('  3. Check NPS dashboard at /admin/nps');
    console.log('  4. Check revenue dashboard at /admin/revenue');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Error generating seed data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { createDemoUsers, createEvents, createPatterns, createNPSSubmissions };
