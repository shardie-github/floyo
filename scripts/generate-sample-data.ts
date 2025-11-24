/**
 * Sample Data Generator
 * 
 * Generates realistic sample events, patterns, and insights for testing and demos.
 * Usage: npm run generate-sample-data -- --userId <user-id> --events 100
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface GenerateOptions {
  userId: string;
  eventCount?: number;
  daysBack?: number;
}

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

function generateFilePath(extension: string): string {
  const directories = [
    'src', 'frontend', 'backend', 'components', 'utils',
    'lib', 'api', 'hooks', 'types', 'tests', 'docs'
  ];
  
  const dir = randomChoice(directories);
  const fileName = `file_${randomInt(1, 1000)}${extension}`;
  
  return `/${dir}/${fileName}`;
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

async function generateEvents(userId: string, count: number, daysBack: number) {
  console.log(`Generating ${count} events for user ${userId}...`);
  
  const events = [];
  for (let i = 0; i < count; i++) {
    const extension = randomChoice(FILE_EXTENSIONS);
    const filePath = generateFilePath(extension);
    const tool = randomChoice(TOOLS);
    const operation = randomChoice(OPERATIONS);
    const timestamp = generateTimestamp(daysBack);
    
    events.push({
      userId,
      filePath,
      eventType: operation,
      tool,
      timestamp,
      metadata: {
        extension,
        size: randomInt(100, 100000),
        lines: randomInt(10, 1000),
      }
    });
  }
  
  // Insert events using Prisma
  console.log(`Inserting ${events.length} events...`);
  
  const createdEvents = [];
  for (const eventData of events) {
    try {
      const event = await prisma.event.create({
        data: {
          userId: eventData.userId,
          filePath: eventData.filePath,
          eventType: eventData.eventType,
          tool: eventData.tool,
          timestamp: eventData.timestamp,
          metadata: eventData.metadata,
        },
      });
      createdEvents.push(event);
    } catch (error) {
      console.error(`Failed to create event:`, error);
    }
  }
  
  console.log(`✓ Inserted ${createdEvents.length} events`);
  return createdEvents;
}

async function generatePatterns(userId: string, events: any[]) {
  console.log('Generating patterns from events...');
  
  // Group events by extension
  const extensionCounts: Record<string, number> = {};
  const extensionTools: Record<string, Set<string>> = {};
  
  events.forEach(event => {
    const ext = event.metadata.extension;
    extensionCounts[ext] = (extensionCounts[ext] || 0) + 1;
    
    if (!extensionTools[ext]) {
      extensionTools[ext] = new Set();
    }
    extensionTools[ext].add(event.tool);
  });
  
  // Create patterns
  const patterns = Object.entries(extensionCounts).map(([ext, count]) => ({
    userId,
    fileExtension: ext,
    count,
    tools: Array.from(extensionTools[ext] || []),
    lastUsed: new Date(),
  }));
  
  // Insert patterns using Prisma
  const createdPatterns = [];
  for (const patternData of patterns) {
    try {
      const pattern = await prisma.pattern.upsert({
        where: {
          userId_fileExtension: {
            userId: patternData.userId,
            fileExtension: patternData.fileExtension,
          },
        },
        update: {
          count: { increment: patternData.count },
          lastUsed: patternData.lastUsed,
          tools: patternData.tools,
        },
        create: {
          userId: patternData.userId,
          fileExtension: patternData.fileExtension,
          count: patternData.count,
          tools: patternData.tools,
          lastUsed: patternData.lastUsed,
        },
      });
      createdPatterns.push(pattern);
    } catch (error) {
      console.error(`Failed to create pattern for ${patternData.fileExtension}:`, error);
    }
  }
  
  console.log(`✓ Created/updated ${createdPatterns.length} patterns`);
  return createdPatterns;
}

async function generateInsights(userId: string, patterns: any[]) {
  console.log('Generating insights from patterns...');
  
  const insights = [];
  
  // Find most used extension
  const topPattern = patterns.sort((a, b) => b.count - a.count)[0];
  if (topPattern) {
    insights.push({
      userId,
      type: 'pattern',
      title: `Most Used File Type: ${topPattern.fileExtension}`,
      description: `You've used ${topPattern.fileExtension} files ${topPattern.count} times.`,
      recommendation: `Consider creating templates or snippets for ${topPattern.fileExtension} files.`,
      priority: 'high',
    });
  }
  
  // Find tool diversity
  const allTools = new Set<string>();
  patterns.forEach(p => p.tools.forEach((t: string) => allTools.add(t)));
  
  if (allTools.size > 3) {
    insights.push({
      userId,
      type: 'tool_diversity',
      title: 'High Tool Diversity',
      description: `You're using ${allTools.size} different tools.`,
      recommendation: 'Consider consolidating tools to reduce context switching.',
      priority: 'medium',
    });
  }
  
  console.log(`Generated ${insights.length} insights`);
  return insights;
}

async function main() {
  const args = process.argv.slice(2);
  
  let userId: string | undefined;
  let eventCount = 100;
  let daysBack = 30;
  
  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--userId' && args[i + 1]) {
      userId = args[i + 1];
      i++;
    } else if (args[i] === '--events' && args[i + 1]) {
      eventCount = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--daysBack' && args[i + 1]) {
      daysBack = parseInt(args[i + 1], 10);
      i++;
    }
  }
  
  if (!userId) {
    console.error('Error: --userId is required');
    console.log('Usage: npm run generate-sample-data -- --userId <user-id> [--events <count>] [--daysBack <days>]');
    process.exit(1);
  }
  
  try {
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      console.error(`Error: User ${userId} not found`);
      process.exit(1);
    }
    
    console.log(`Generating sample data for user: ${user.email}`);
    console.log(`Events: ${eventCount}, Days back: ${daysBack}`);
    
    // Generate events
    const events = await generateEvents(userId, eventCount, daysBack);
    
    // Generate patterns
    const patterns = await generatePatterns(userId, events);
    
    // Generate insights
    const insights = await generateInsights(userId, patterns);
    
    console.log('\n✅ Sample data generation complete!');
    console.log(`- Events: ${events.length}`);
    console.log(`- Patterns: ${patterns.length}`);
    console.log(`- Insights: ${insights.length}`);
    
  } catch (error) {
    console.error('Error generating sample data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { generateEvents, generatePatterns, generateInsights };
