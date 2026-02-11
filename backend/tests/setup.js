import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: './.env' });

// Set NODE_ENV to test if not already set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test';
}

let prisma;
let pool;

// Setup function to run before all tests
export const setupTestDatabase = async () => {
  try {
    // Create PostgreSQL connection pool for testing
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    
    // Initialize Prisma client for testing
    prisma = new PrismaClient({ 
      adapter,
      log: ['error']
    });

    // Connect to the database
    await prisma.$connect();
    
    // Push the schema to reset the database
    console.log('Pushing schema to test database...');
    execSync('npx prisma db push --force-reset', { 
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
    });
    
    console.log('Test database setup complete');
    return prisma;
  } catch (error) {
    console.error('Test database setup failed:', error);
    throw error;
  }
};

// Cleanup function to run after all tests
export const cleanupTestDatabase = async () => {
  try {
    if (prisma) {
      // Clean up all data from tables
      console.log('Cleaning up test database...');
      
      // Delete in order to respect foreign key constraints
      await prisma.note.deleteMany({});
      await prisma.user.deleteMany({});
      
      // Disconnect from the database
      await prisma.$disconnect();
      console.log('Test database cleanup complete');
    }
    
    if (pool) {
      // Close the connection pool
      await pool.end();
    }
  } catch (error) {
    console.error('Test database cleanup failed:', error);
    throw error;
  }
};

// Helper function to get a fresh Prisma instance for tests
export const getTestPrismaClient = () => {
  if (!prisma) {
    throw new Error('Test database not initialized. Call setupTestDatabase() first.');
  }
  return prisma;
};

// Helper function to create test user
export const createTestUser = async (userData = {}) => {
  const defaultUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: 'password'
    ...userData
  };

  return await prisma.user.create({
    data: defaultUser
  });
};

// Helper function to create test note
export const createTestNote = async (userId, noteData = {}) => {
  const defaultNote = {
    title: 'Test Note',
    content: 'This is a test note content',
    userId: userId,
    ...noteData
  };

  return await prisma.note.create({
    data: defaultNote
  });
};

// Global test hooks
export const mochaHooks = {
  async beforeAll() {
    await setupTestDatabase();
  },
  
  async afterAll() {
    await cleanupTestDatabase();
  },
  
  async beforeEach() {
    // Clean up data before each test
    await prisma.note.deleteMany({});
    await prisma.user.deleteMany({});
  }
};