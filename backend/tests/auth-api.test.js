import { expect } from 'chai';
import request from 'supertest';
import app from '../src/app.js';
import { getTestPrismaClient, createTestUser } from './setup.js';

describe('Authentication API Tests', () => {
  let prisma;

  before(() => {
    prisma = getTestPrismaClient();
    console.log('\nStarting Authentication API Tests...\n');
  });

  describe('POST /api/v1/users/signup - User Registration', () => {
    it('✓ Should register a new user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'securePassword123'
      };

      console.log('   Testing user registration with valid data...');

      const response = await request(app)
        .post('/api/v1/users/signup')
        .send(userData)
        .expect(201);

      // Verify response structure
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message', 'User registered successfully');
      expect(response.body).to.have.property('statusCode', 201);

      // Verify user was created in database
      const createdUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      expect(createdUser).to.not.be.null;
      expect(createdUser.name).to.equal(userData.name);
      expect(createdUser.email).to.equal(userData.email);
      expect(createdUser.password).to.not.equal(userData.password); // Should be hashed

      console.log('   ✓ User registration successful - User created in database');
    });

    it('Should handle duplicate email registration', async () => {
      const userData = {
        name: 'Jane Smith',
        email: 'duplicate@example.com',
        password: 'password123'
      };

      console.log('   Testing duplicate email handling...');

      // Create user first
      await createTestUser({
        name: 'Existing User',
        email: userData.email,
        password: 'existingPassword'
      });

      // Try to register with same email
      const response = await request(app)
        .post('/api/v1/users/signup')
        .send(userData)
        .expect(400);

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message', 'User already exists');
      expect(response.body).to.have.property('statusCode', 400);

      console.log('   ✓ Duplicate email properly rejected');
    });

    it('Should validate required fields', async () => {
      console.log('   Testing required field validation...');

      const response = await request(app)
        .post('/api/v1/users/signup')
        .send({
          name: 'Test User'
          // Missing email and password
        })
        .expect(400);

      expect(response.body).to.have.property('success', false);

      console.log('   ✓ Required field validation working');
    });
  });

  describe('POST /api/v1/users/login - User Login', () => {
    let testUser;
    let capturedTokens = {};

    beforeEach(async () => {
      // Create a test user for login tests
      const userData = {
        name: 'Login Test User',
        email: 'login.test@example.com',
        password: 'loginPassword123'
      };

      // Register user first
      await request(app)
        .post('/api/v1/users/signup')
        .send(userData);

      testUser = userData;
    });

    it('✓ Should login with correct credentials and return tokens', async () => {
      console.log('   Testing login with correct credentials...');

      const response = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      // Verify response structure
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message', 'User logged in successfully');
      expect(response.body).to.have.property('statusCode', 200);

      // Verify tokens are returned
      expect(response.body.data).to.have.property('accessToken');
      expect(response.body.data).to.have.property('refreshToken');
      expect(response.body.data).to.have.property('user');

      // Verify user data
      expect(response.body.data.user).to.have.property('email', testUser.email);
      expect(response.body.data.user).to.not.have.property('password'); // Should not return password

      // Capture tokens for subsequent tests
      capturedTokens.accessToken = response.body.data.accessToken;
      capturedTokens.refreshToken = response.body.data.refreshToken;
      capturedTokens.userId = response.body.data.user.id;

      // Verify tokens are valid JWT format
      expect(capturedTokens.accessToken).to.match(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
      expect(capturedTokens.refreshToken).to.match(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);

      console.log('   ✓ Login successful - Tokens captured for subsequent tests');
      console.log(`   Access Token: ${capturedTokens.accessToken.substring(0, 20)}...`);
      console.log(`   Refresh Token: ${capturedTokens.refreshToken.substring(0, 20)}...`);

      // Store tokens globally for other test files
      global.testTokens = capturedTokens;
    });

    it('Should reject incorrect email', async () => {
      console.log('   Testing login with incorrect email...');

      const response = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password
        })
        .expect(401);

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message', 'Incorrect username or password');

      console.log('   ✓ Incorrect email properly rejected');
    });

    it('Should reject incorrect password', async () => {
      console.log('   Testing login with incorrect password...');

      const response = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: testUser.email,
          password: 'wrongPassword'
        })
        .expect(401);

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message', 'Incorrect username or password');

      console.log('   ✓ Incorrect password properly rejected');
    });

    it('Should validate required login fields', async () => {
      console.log('   Testing login field validation...');

      const response = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: testUser.email
          // Missing password
        })
        .expect(400);

      expect(response.body).to.have.property('success', false);

      console.log('   ✓ Login field validation working');
    });
  });

  describe('POST /api/v1/users/logout - User Logout', () => {
    let testUser;
    let authToken;

    beforeEach(async () => {
      // Create and login a user
      const userData = {
        name: 'Logout Test User',
        email: 'logout.test@example.com',
        password: 'logoutPassword123'
      };

      // Register user
      await request(app)
        .post('/api/v1/users/signup')
        .send(userData);

      // Login to get token
      const loginResponse = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: userData.email,
          password: userData.password
        });

      authToken = loginResponse.body.data.accessToken;
      testUser = loginResponse.body.data.user;
    });

    it('✓ Should logout user and clear refresh token from database', async () => {
      console.log('   Testing user logout...');

      // Verify user has refresh token before logout
      const userBeforeLogout = await prisma.user.findUnique({
        where: { id: testUser.id }
      });
      expect(userBeforeLogout.refreshToken).to.not.be.null;

      // Logout user
      const response = await request(app)
        .post('/api/v1/users/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message', 'User Logged out successfully!');

      // Verify refresh token was cleared from database
      const userAfterLogout = await prisma.user.findUnique({
        where: { id: testUser.id }
      });
      expect(userAfterLogout.refreshToken).to.be.null;

      console.log('   ✓ Logout successful - Refresh token cleared from database');
    });

    it('Should require authentication for logout', async () => {
      console.log('   Testing logout without authentication...');

      const response = await request(app)
        .post('/api/v1/users/logout')
        .expect(401);

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message', 'Access token not provided');

      console.log('   ✓ Logout properly requires authentication');
    });

    it('Should reject invalid token for logout', async () => {
      console.log('   Testing logout with invalid token...');

      const response = await request(app)
        .post('/api/v1/users/logout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message', 'Invalid or expired token');

      console.log('   ✓ Invalid token properly rejected for logout');
    });
  });

  after(() => {
    console.log('\n✓ Authentication API Tests Completed!\n');
  });
});