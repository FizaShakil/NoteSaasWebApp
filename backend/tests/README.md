# Testing Setup

This directory contains comprehensive unit tests for the Node.js backend using Mocha, Chai, and Supertest.

## Setup

### Prerequisites
- PostgreSQL database server running
- Test database created: `note_taking_webapp_test`

### Environment Configuration
The tests use a separate test database to avoid polluting production data:
- Test environment variables are in `.env.test`
- Test database: `note_taking_webapp_test`

## Running Tests

### Run All Tests (Recommended)
```bash
npm run test:all
```
This runs all test suites in order with comprehensive reporting.

### Run Individual Test Suites
```bash
# Authentication tests only
npm run test:auth

# Auth middleware tests only
npm run test:middleware

# Notes CRUD tests only
npm run test:notes

# Search functionality tests only
npm run test:search
```

### Run All Tests (Basic)
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Setup Test Environment
```bash
npm run test:setup
```

## Test Structure

```
tests/
├── setup.js                      # Database setup and cleanup
├── run-all-tests.js              # Comprehensive test runner
├── auth-api.test.js              # Authentication API tests
├── auth-middleware.test.js       # Auth middleware tests
├── notes-crud-api.test.js        # Notes CRUD API tests
├── notes-search-api.test.js      # Search functionality tests
└── README.md                     # This file
```

## Test Configuration

### Mocha Configuration (`.mocharc.json`)
- Timeout: 15 seconds
- Recursive test discovery
- Automatic exit after tests
- Uses `tests/setup.js` for global setup

### Database Setup (`tests/setup.js`)
- Creates fresh test database before tests
- Cleans up data after each test
- Provides helper functions for creating test data
- Handles Prisma client lifecycle

## Test Coverage

### Authentication API Tests (`auth-api.test.js`)
- **POST /api/v1/users/signup**
  - ✓ Successful user registration
  - ✓ Duplicate email handling
  - ✓ Required field validation
- **POST /api/v1/users/login**
  - ✓ Login with correct credentials (captures tokens)
  - ✓ Incorrect email/password
  - ✓ Missing required fields
- **POST /api/v1/users/logout**
  - ✓ Successful logout with token cleanup
  - ✓ Authentication required
  - ✓ Invalid token handling

### Auth Middleware Tests (`auth-middleware.test.js`)
- **Authorization Header Validation**
  - ✓ Missing Authorization header
  - ✓ Authorization header without Bearer prefix
  - ✓ Empty Authorization header
  - ✓ Correct token extraction from Bearer format
- **Token Verification**
  - ✓ Invalid token rejection
  - ✓ Expired token rejection
  - ✓ Malformed JWT token handling
  - ✓ Token verification with JWT_SECRET
- **User Existence Verification**
  - ✓ Token for deleted user rejection
- **Request User Attachment**
  - ✓ Setting req.user with valid token
  - ✓ Attaching only id, email to req.user
  - ✓ Middleware chain interruption on failure
- **Error Handling**
  - ✓ Unexpected authentication errors
- **Token Format Validation**
  - ✓ Bearer token with extra spaces
  - ✓ Lowercase bearer prefix

### Notes CRUD API Tests (`notes-crud-api.test.js`)
- **POST /api/v1/notes/create-note**
  - ✓ Create note and save to PostgreSQL
  - ✓ Create note without title (optional)
  - ✓ Content requirement validation
  - ✓ Authentication required
- **GET /api/v1/notes/get-notes**
  - ✓ Fetch all notes for logged-in user only
  - ✓ Empty array for users with no notes
  - ✓ Authentication required
- **GET /api/v1/notes/get-note/:id**
  - ✓ Fetch single note by owner
  - ✓ Access control (can't access other user's notes)
  - ✓ Non-existent note handling
- **PATCH /api/v1/notes/edit-note**
  - ✓ Update note title and content by owner
  - ✓ Content-only updates
  - ✓ Access control (can't update other user's notes)
  - ✓ Note ID requirement
- **DELETE /api/v1/notes/delete-note/:id**
  - ✓ Delete note by owner
  - ✓ Access control (can't delete other user's notes)
  - ✓ Non-existent note handling
  - ✓ Authentication required

### Search API Tests (`notes-search-api.test.js`)
- **GET /api/v1/notes/search?query=...**
  - ✓ Search by title
  - ✓ Search by content
  - ✓ Case-insensitive search
  - ✓ Multi-field search (title + content)
  - ✓ Result ordering (most recent first)
  - ✓ User isolation (only own notes)
  - ✓ Empty results handling
  - ✓ Special characters support
  - ✓ URL encoding support
  - ✓ Empty query validation
  - ✓ Missing query parameter
  - ✓ Authentication required
- **GET /api/v1/notes/get-total-notes**
  - ✓ Correct total count
  - ✓ Zero count for empty users

## Security & Access Control Testing

All tests verify:
- **User Isolation**: Users can only access their own data
- **Authentication**: Protected routes require valid tokens
- **Authorization**: Users cannot modify other users' data
- **Input Validation**: Required fields and data formats
- **Error Handling**: Proper error messages and status codes

## Test Features

### Clear Console Output
- Descriptive test names with tick marks
- Progress indicators during test execution
- Detailed success/failure messages
- Comprehensive final report

### Token Management
- Captures tokens from login tests
- Uses Bearer tokens for protected routes
- Tests token validation and expiration

### Database Verification
- Verifies data persistence in PostgreSQL
- Checks data integrity after operations
- Confirms proper cleanup between tests

## Running Tests

### Example Output
```
Starting Comprehensive API Test Suite
==========================================

Setting up test environment...
Test database connection successful

============================================================
AUTHENTICATION API TESTS
Testing user registration, login, logout, and token management
============================================================

Authentication API Tests
  POST /api/v1/users/signup - User Registration
    ✓ Should register a new user successfully
    ✓ Should handle duplicate email registration
    ✓ Should validate required fields

  POST /api/v1/users/login - User Login
    ✓ Should login with correct credentials and return tokens
    ✓ Should reject incorrect email
    ✓ Should reject incorrect password

  POST /api/v1/users/logout - User Logout
    ✓ Should logout user and clear refresh token from database
    ✓ Should require authentication for logout

Authentication API Tests - ALL TESTS PASSED
```

## Troubleshooting

### Database Issues
1. Ensure PostgreSQL is running
2. Create test database: `createdb -h localhost -U postgres note_taking_webapp_test`
3. Check credentials in `.env.test`

### Test Failures
1. Check if test database is accessible
2. Verify environment variables
3. Ensure no other processes are using test database

## Success Criteria

When all tests pass, you'll see:
```
ALL TEST SUITES PASSED! Your APIs are working correctly.

Test Coverage Summary:
   • User Registration & Validation ✓
   • User Login & Token Management ✓
   • User Logout & Token Cleanup ✓
   • Note Creation & Validation ✓
   • Note Reading & Access Control ✓
   • Note Updating & Authorization ✓
   • Note Deletion & Security ✓
   • Note Search & Filtering ✓
   • User Isolation & Data Privacy ✓
   • Error Handling & Edge Cases ✓
   • Authentication & Authorization ✓
```

This confirms that all your APIs are working correctly and securely!