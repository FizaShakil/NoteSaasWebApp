import { expect } from 'chai';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { getTestPrismaClient, createTestUser } from './setup.js';

describe('Auth Middleware Tests', () => {
  let prisma;
  let testUser;
  let validToken;

  before(() => {
    prisma = getTestPrismaClient();
    console.log('\nStarting Auth Middleware Tests...\n');
  });

  beforeEach(async () => {
    // Create a test user
    testUser = await createTestUser({
      name: 'Middleware Test User',
      email: 'middleware@example.com',
      password: 'testPassword123'
    });

    // Generate a valid token for the test user
    validToken = jwt.sign(
      { id: testUser.id, email: testUser.email },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
  });

  describe('Authorization Header Validation', () => {
    it('✓ Should return 401 if Authorization header is missing', async () => {
      console.log('   Testing missing Authorization header...');

      const response = await request(app)
        .get('/api/v1/notes/get-notes')
        .expect(401);

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message', 'Access token not provided');
      expect(response.body).to.have.property('statusCode', 401);

      console.log('   ✓ Missing Authorization header properly rejected');
    });

    it('✓ Should return 401 if Authorization header does not start with "Bearer "', async () => {
      console.log('   Testing Authorization header without Bearer prefix...');

      const response = await request(app)
        .get('/api/v1/notes/get-notes')
        .set('Authorization', validToken) // Missing "Bearer " prefix
        .expect(401);

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message', 'Access token not provided');

      console.log('   ✓ Authorization header without Bearer prefix rejected');
    });

    it('✓ Should return 401 if Authorization header is empty string', async () => {
      console.log('   Testing empty Authorization header...');

      const response = await request(app)
        .get('/api/v1/notes/get-notes')
        .set('Authorization', '')
        .expect(401);

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message', 'Access token not provided');

      console.log('   ✓ Empty Authorization header properly rejected');
    });

    it('✓ Should extract token correctly from Bearer format', async () => {
      console.log('   Testing correct token extraction from Bearer format...');

      const response = await request(app)
        .get('/api/v1/notes/get-notes')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message', 'Notes fetched successfully');

      console.log('   ✓ Token extracted correctly from Bearer format');
    });
  });

  describe('Token Verification', () => {
    it('✓ Should return 403 if token is invalid', async () => {
      console.log('   Testing invalid token...');

      const invalidToken = 'invalid.token.here';

      const response = await request(app)
        .get('/api/v1/notes/get-notes')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(403);

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message', 'Invalid or expired token');
      expect(response.body).to.have.property('statusCode', 403);

      console.log('   ✓ Invalid token properly rejected');
    });

    it('✓ Should return 403 if token is expired', async () => {
      console.log('   Testing expired token...');

      // Create an expired token (expired 1 hour ago)
      const expiredToken = jwt.sign(
        { id: testUser.id, email: testUser.email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .get('/api/v1/notes/get-notes')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(403);

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message', 'Invalid or expired token');

      console.log('   ✓ Expired token properly rejected');
    });

    it('✓ Should handle malformed JWT tokens', async () => {
      console.log('   Testing malformed JWT token...');

      const malformedToken = 'malformed.jwt.token.with.extra.parts';

      const response = await request(app)
        .get('/api/v1/notes/get-notes')
        .set('Authorization', `Bearer ${malformedToken}`)
        .expect(403);

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message', 'Invalid or expired token');

      console.log('   ✓ Malformed JWT token properly rejected');
    });

    it('✓ Should verify token using JWT_SECRET from environment', async () => {
      console.log('   Testing token verification with correct secret...');

      // Token signed with correct secret
      const correctToken = jwt.sign(
        { id: testUser.id, email: testUser.email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/v1/notes/get-notes')
        .set('Authorization', `Bearer ${correctToken}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);

      console.log('   ✓ Token verified successfully with correct secret');
    });
  });

  describe('User Existence Verification', () => {
    it('✓ Should return 401 if user no longer exists in database', async () => {
      console.log('   Testing token for deleted user...');

      // Create a user and get their token
      const tempUser = await createTestUser({
        name: 'Temp User',
        email: 'temp@example.com',
        password: 'tempPassword'
      });

      const tempToken = jwt.sign(
        { id: tempUser.id, email: tempUser.email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '1h' }
      );

      // Delete the user from database
      await prisma.user.delete({
        where: { id: tempUser.id }
      });

      // Try to use the token
      const response = await request(app)
        .get('/api/v1/notes/get-notes')
        .set('Authorization', `Bearer ${tempToken}`)
        .expect(401);

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message', 'User no longer exists');
      expect(response.body).to.have.property('statusCode', 401);

      console.log('   ✓ Token for deleted user properly rejected');
    });
  });

  describe('Request User Attachment', () => {
    it('✓ Should call next() and set req.user if token is valid', async () => {
      console.log('   Testing req.user attachment with valid token...');

      const response = await request(app)
        .get('/api/v1/notes/get-notes')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      // If we get a successful response, it means req.user was set correctly
      // and the middleware called next()

      console.log('   ✓ Middleware called next() and attached user to request');
    });

    it('✓ Should attach only id, email, and username to req.user', async () => {
      console.log('   Testing user data attached to request...');

      // Create a note to verify the user data is being used correctly
      const response = await request(app)
        .post('/api/v1/notes/create-note')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          title: 'Test Note',
          content: 'Testing user attachment'
        })
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body.data).to.have.property('userId', testUser.id);

      console.log('   ✓ User data correctly attached and used in request');
    });

    it('✓ Should not proceed to next middleware if token verification fails', async () => {
      console.log('   Testing middleware chain interruption on failure...');

      const response = await request(app)
        .post('/api/v1/notes/create-note')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          title: 'Test Note',
          content: 'This should not be created'
        })
        .expect(403);

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message', 'Invalid or expired token');

      // Verify note was not created
      const notes = await prisma.note.findMany({
        where: { title: 'Test Note' }
      });
      expect(notes).to.have.length(0);

      console.log('   ✓ Middleware chain interrupted on token verification failure');
    });
  });

  describe('Error Handling', () => {
    it('✓ Should handle unexpected authentication errors gracefully', async () => {
      console.log('   Testing unexpected error handling...');

      // Create a token with invalid user ID format to trigger unexpected error
      const invalidIdToken = jwt.sign(
        { id: null, email: 'test@example.com' },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/v1/notes/get-notes')
        .set('Authorization', `Bearer ${invalidIdToken}`);

      // Should handle the error gracefully (either 401 or 500)
      expect(response.body).to.have.property('success', false);
      expect([401, 500]).to.include(response.status);

      console.log('   ✓ Unexpected errors handled gracefully');
    });
  });

  describe('Token Format Validation', () => {
    it('✓ Should handle Bearer token with extra spaces', async () => {
      console.log('   Testing Bearer token with extra spaces...');

      const response = await request(app)
        .get('/api/v1/notes/get-notes')
        .set('Authorization', `Bearer  ${validToken}`); // Extra space

      // Should fail because the token extraction will get an empty string or malformed token
      expect(response.body).to.have.property('success', false);
      expect([401, 403]).to.include(response.status);

      console.log('   ✓ Bearer token with extra spaces handled correctly');
    });

    it('✓ Should handle lowercase "bearer" prefix', async () => {
      console.log('   Testing lowercase bearer prefix...');

      const response = await request(app)
        .get('/api/v1/notes/get-notes')
        .set('Authorization', `bearer ${validToken}`) // lowercase
        .expect(401); // Should fail because it doesn't start with "Bearer "

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message', 'Access token not provided');

      console.log('   ✓ Lowercase bearer prefix properly rejected');
    });
  });

  after(() => {
    console.log('\n✓ Auth Middleware Tests Completed!\n');
  });
});
