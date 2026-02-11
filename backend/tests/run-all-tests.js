#!/usr/bin/env node

/**
 * Comprehensive Test Runner
 * 
 * This script runs all API tests in the correct order and provides
 * a comprehensive test report with clear console output.
 */

import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env' });

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';



console.log('Starting Comprehensive API Test Suite');
console.log('==========================================\n');

async function setupTestEnvironment() {
  console.log('Setting up test environment...');
  
  try {
    // Test database connection
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ 
      adapter,
      log: ['error']
    });

    await prisma.$connect();
    console.log('Test database connection successful');
    await prisma.$disconnect();
    await pool.end();

    return true;
  } catch (error) {
    console.error('Test environment setup failed:', error.message);
    console.log('\nPlease ensure:');
    console.log('1. PostgreSQL is running');
    console.log('2. Test database exists: note_taking_webapp_test');
    console.log('3. Database credentials in .env.test are correct');
    return false;
  }
}

async function runTestSuite(testName, testFile, description) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${testName.toUpperCase()}`);
  console.log(`${description}`);
  console.log(`${'='.repeat(60)}`);

  try {
    execSync(`mocha ${testFile} --timeout 15000 --exit --reporter spec`, {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'test' }
    });
    
    console.log(`\n${testName} - ALL TESTS PASSED`);
    return true;
  } catch (error) {
    console.log(`\n${testName} - SOME TESTS FAILED`);
    return false;
  }
}

async function runAllTests() {
  const startTime = Date.now();
  
  // Setup test environment
  const setupSuccess = await setupTestEnvironment();
  if (!setupSuccess) {
    process.exit(1);
  }

  console.log('\nRunning API Test Suites in Order...\n');

  const testSuites = [
    {
      name: 'Authentication API Tests',
      file: 'tests/auth-api.test.js',
      description: 'Testing user registration, login, logout, and token management'
    },
    {
      name: 'Notes CRUD API Tests',
      file: 'tests/notes-crud-api.test.js',
      description: 'Testing note creation, reading, updating, deletion, and access control'
    },
    {
      name: 'Notes Search API Tests',
      file: 'tests/notes-search-api.test.js',
      description: 'Testing note search functionality and total notes count'
    }
  ];

  let passedSuites = 0;
  let totalSuites = testSuites.length;

  for (const suite of testSuites) {
    const success = await runTestSuite(suite.name, suite.file, suite.description);
    if (success) {
      passedSuites++;
    }
  }

  // Final Report
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log('\n' + '='.repeat(80));
  console.log('FINAL TEST REPORT');
  console.log('='.repeat(80));
  console.log(`Total execution time: ${duration} seconds`);
  console.log(`Test suites passed: ${passedSuites}/${totalSuites}`);
  
  if (passedSuites === totalSuites) {
    console.log('ALL TEST SUITES PASSED! Your APIs are working correctly.');
    console.log('\nTest Coverage Summary:');
    console.log('   • User Registration & Validation ✓');
    console.log('   • User Login & Token Management ✓');
    console.log('   • User Logout & Token Cleanup ✓');
    console.log('   • Note Creation & Validation ✓');
    console.log('   • Note Reading & Access Control ✓');
    console.log('   • Note Updating & Authorization ✓');
    console.log('   • Note Deletion & Security ✓');
    console.log('   • Note Search & Filtering ✓');
    console.log('   • User Isolation & Data Privacy ✓');
    console.log('   • Error Handling & Edge Cases ✓');
    console.log('   • Authentication & Authorization ✓');
    
    process.exit(0);
  } else {
    console.log('Some test suites failed. Please check the output above for details.');
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\nTest execution interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n\nTest execution terminated');
  process.exit(1);
});

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(error => {
    console.error('\nUnexpected error during test execution:', error);
    process.exit(1);
  });
}