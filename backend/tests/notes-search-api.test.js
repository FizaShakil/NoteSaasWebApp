import { expect } from 'chai';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { getTestPrismaClient, createTestUser, createTestNote } from './setup.js';

describe('Notes Search API Tests', () => {
  let prisma;
  let testUser1, testUser2;
  let authToken1, authToken2;

  before(() => {
    prisma = getTestPrismaClient();
    console.log('\nStarting Notes Search API Tests...\n');
  });

  beforeEach(async () => {
    // Create two test users for isolation testing
    testUser1 = await createTestUser({
      name: 'Search User 1',
      email: 'search1@example.com'
    });

    testUser2 = await createTestUser({
      name: 'Search User 2',
      email: 'search2@example.com'
    });

    // Generate auth tokens
    authToken1 = jwt.sign(
      { id: testUser1.id, email: testUser1.email },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );

    authToken2 = jwt.sign(
      { id: testUser2.id, email: testUser2.email },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );

    // Create diverse test notes for User 1
    await createTestNote(testUser1.id, {
      title: 'JavaScript Tutorial',
      content: 'Learn JavaScript programming language fundamentals including variables, functions, and objects'
    });

    await createTestNote(testUser1.id, {
      title: 'React Components Guide',
      content: 'Building user interfaces with React components, hooks, and state management'
    });

    await createTestNote(testUser1.id, {
      title: 'Database Design Principles',
      content: 'PostgreSQL database design, normalization, and query optimization techniques'
    });

    await createTestNote(testUser1.id, {
      title: 'API Development Best Practices',
      content: 'RESTful API design patterns, authentication, and error handling in Node.js'
    });

    await createTestNote(testUser1.id, {
      title: 'CSS Styling Techniques',
      content: 'Modern CSS features including flexbox, grid, and responsive design principles'
    });

    // Create notes for User 2 (should not appear in User 1's search results)
    await createTestNote(testUser2.id, {
      title: 'JavaScript Advanced Topics',
      content: 'Advanced JavaScript concepts like closures, prototypes, and async programming'
    });

    await createTestNote(testUser2.id, {
      title: 'React Performance Optimization',
      content: 'Optimizing React applications for better performance and user experience'
    });
  });

  describe('GET /api/v1/notes/search - Search Notes', () => {
    it('✓ Should search notes by title and return relevant results', async () => {
      console.log('   Testing search by title: "JavaScript"...');

      const response = await request(app)
        .get('/api/v1/notes/search?query=JavaScript')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message', 'Search results fetched successfully');
      expect(response.body.data).to.be.an('array');
      expect(response.body.data).to.have.length(1); // Only User 1's JavaScript note

      const searchResult = response.body.data[0];
      expect(searchResult).to.have.property('title', 'JavaScript Tutorial');
      expect(searchResult).to.have.property('userId', testUser1.id);
      expect(searchResult).to.have.property('id');
      expect(searchResult).to.have.property('content');
      expect(searchResult).to.have.property('createdAt');
      expect(searchResult).to.have.property('updatedAt');

      console.log(`   ✓ Found ${response.body.data.length} note(s) matching "JavaScript"`);
      console.log(`   Result: "${searchResult.title}"`);
    });

    it('✓ Should search notes by content and return relevant results', async () => {
      console.log('   Testing search by content: "React"...');

      const response = await request(app)
        .get('/api/v1/notes/search?query=React')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body.data).to.be.an('array');
      expect(response.body.data).to.have.length(1); // Only User 1's React note

      const searchResult = response.body.data[0];
      expect(searchResult).to.have.property('title', 'React Components Guide');
      expect(searchResult).to.have.property('userId', testUser1.id);

      console.log(`   ✓ Found ${response.body.data.length} note(s) matching "React" in content`);
      console.log(`   Result: "${searchResult.title}"`);
    });

    it('✓ Should perform case-insensitive search', async () => {
      console.log('   Testing case-insensitive search: "DATABASE"...');

      const response = await request(app)
        .get('/api/v1/notes/search?query=DATABASE')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body.data).to.be.an('array');
      expect(response.body.data).to.have.length(1);

      const searchResult = response.body.data[0];
      expect(searchResult).to.have.property('title', 'Database Design Principles');

      console.log('   ✓ Case-insensitive search working correctly');
    });

    it('✓ Should search in both title and content fields', async () => {
      console.log('   Testing search across title and content: "design"...');

      const response = await request(app)
        .get('/api/v1/notes/search?query=design')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body.data).to.be.an('array');
      expect(response.body.data).to.have.length(3); // Database Design + CSS design + API design

      const titles = response.body.data.map(note => note.title);
      expect(titles).to.include('Database Design Principles');
      expect(titles).to.include('CSS Styling Techniques');
      expect(titles).to.include('API Development Best Practices');

      // Verify all results belong to the authenticated user
      response.body.data.forEach(note => {
        expect(note).to.have.property('userId', testUser1.id);
      });

      console.log(`   ✓ Found ${response.body.data.length} notes matching "design" in title/content`);
      console.log(`   Results: ${titles.join(', ')}`);
    });

    it('✓ Should return results ordered by most recent first', async () => {
      console.log('   Testing search result ordering...');

      const response = await request(app)
        .get('/api/v1/notes/search?query=a') // Search for 'a' to get multiple results
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.data).to.be.an('array');
      
      if (response.body.data.length > 1) {
        // Verify results are ordered by updatedAt descending
        for (let i = 0; i < response.body.data.length - 1; i++) {
          const currentDate = new Date(response.body.data[i].updatedAt);
          const nextDate = new Date(response.body.data[i + 1].updatedAt);
          expect(currentDate.getTime()).to.be.greaterThanOrEqual(nextDate.getTime());
        }
        console.log('   ✓ Search results properly ordered by most recent first');
      } else {
        console.log('   Single result returned, ordering test skipped');
      }
    });

    it('✓ Should only return notes belonging to authenticated user', async () => {
      console.log('   Testing user isolation in search results...');

      // User 1 searches for "JavaScript" (both users have JavaScript notes)
      const user1Response = await request(app)
        .get('/api/v1/notes/search?query=JavaScript')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      // User 2 searches for "JavaScript"
      const user2Response = await request(app)
        .get('/api/v1/notes/search?query=JavaScript')
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(200);

      // Both should get results, but different ones
      expect(user1Response.body.data).to.have.length(1);
      expect(user2Response.body.data).to.have.length(1);

      // Verify User 1 only gets their own notes
      expect(user1Response.body.data[0]).to.have.property('userId', testUser1.id);
      expect(user1Response.body.data[0]).to.have.property('title', 'JavaScript Tutorial');

      // Verify User 2 only gets their own notes
      expect(user2Response.body.data[0]).to.have.property('userId', testUser2.id);
      expect(user2Response.body.data[0]).to.have.property('title', 'JavaScript Advanced Topics');

      console.log('   ✓ User isolation working - each user only sees their own notes');
      console.log(`   User 1 found: "${user1Response.body.data[0].title}"`);
      console.log(`   User 2 found: "${user2Response.body.data[0].title}"`);
    });

    it('✓ Should return empty array when no notes match query', async () => {
      console.log('   Testing search with no matching results...');

      const response = await request(app)
        .get('/api/v1/notes/search?query=nonexistentterm12345')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message', 'Search results fetched successfully');
      expect(response.body.data).to.be.an('array');
      expect(response.body.data).to.have.length(0);

      console.log('   ✓ Empty array returned for non-matching query');
    });

    it('✓ Should handle special characters in search query', async () => {
      // Create a note with special characters
      await createTestNote(testUser1.id, {
        title: 'Special Characters & Symbols',
        content: 'Testing search with special chars: @#$%^&*()_+-=[]{}|;:,.<>?'
      });

      console.log('   Testing search with special characters...');

      const response = await request(app)
        .get('/api/v1/notes/search?query=Special Characters')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body.data).to.be.an('array');
      expect(response.body.data).to.have.length(1);
      expect(response.body.data[0]).to.have.property('title', 'Special Characters & Symbols');

      console.log('   ✓ Special characters in search handled correctly');
    });

    it('✓ Should handle URL encoded search queries', async () => {
      console.log('   Testing URL encoded search query...');

      const response = await request(app)
        .get('/api/v1/notes/search?query=API%20Development') // URL encoded "API Development"
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body.data).to.be.an('array');
      expect(response.body.data).to.have.length(1);
      expect(response.body.data[0]).to.have.property('title', 'API Development Best Practices');

      console.log('   ✓ URL encoded search query handled correctly');
    });

    it('Should return error for empty search query', async () => {
      console.log('   Testing search with empty query...');

      const response = await request(app)
        .get('/api/v1/notes/search?query=')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(400);

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message', 'Search query is required');

      console.log('   ✓ Empty query properly rejected');
    });

    it('Should return error when query parameter is missing', async () => {
      console.log('   Testing search without query parameter...');

      const response = await request(app)
        .get('/api/v1/notes/search')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(400);

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message', 'Search query is required');

      console.log('   ✓ Missing query parameter properly handled');
    });

    it('Should require authentication for search', async () => {
      console.log('   Testing search without authentication...');

      const response = await request(app)
        .get('/api/v1/notes/search?query=test')
        .expect(401);

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message', 'Access token not provided');

      console.log('   ✓ Authentication requirement properly enforced for search');
    });

    it('Should reject invalid authentication token', async () => {
      console.log('   Testing search with invalid token...');

      const response = await request(app)
        .get('/api/v1/notes/search?query=test')
        .set('Authorization', 'Bearer invalid-token-here')
        .expect(403);

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message', 'Invalid or expired token');

      console.log('   ✓ Invalid token properly rejected for search');
    });
  });

  describe('GET /api/v1/notes/get-total-notes - Total Notes Count', () => {
    it('✓ Should return correct total notes count for user', async () => {
      console.log('   Testing total notes count...');

      const response = await request(app)
        .get('/api/v1/notes/get-total-notes')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message', 'Total notes count fetched successfully');
      expect(response.body.data).to.have.property('totalNotes');
      expect(response.body.data.totalNotes).to.be.a('number');
      expect(response.body.data.totalNotes).to.be.greaterThan(0);

      // Verify count matches actual notes in database
      const actualCount = await prisma.note.count({
        where: { userId: testUser1.id }
      });
      expect(response.body.data.totalNotes).to.equal(actualCount);

      console.log(`   ✓ Total notes count: ${response.body.data.totalNotes}`);
      console.log('   ✓ Count matches database records');
    });

    it('✓ Should return 0 for user with no notes', async () => {
      // Create a new user with no notes
      const emptyUser = await createTestUser({
        name: 'Empty User',
        email: 'empty.search@example.com'
      });

      const emptyUserToken = jwt.sign(
        { id: emptyUser.id, email: emptyUser.email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
      );

      console.log('   Testing total notes count for user with no notes...');

      const response = await request(app)
        .get('/api/v1/notes/get-total-notes')
        .set('Authorization', `Bearer ${emptyUserToken}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body.data).to.have.property('totalNotes', 0);

      console.log('   ✓ Zero count returned for user with no notes');
    });
  });

  after(() => {
    console.log('\n✓ Notes Search API Tests Completed!\n');
    console.log('Search Test Summary:');
    console.log('   • Title-based search ✓');
    console.log('   • Content-based search ✓');
    console.log('   • Case-insensitive search ✓');
    console.log('   • Multi-field search ✓');
    console.log('   • User isolation ✓');
    console.log('   • Special characters handling ✓');
    console.log('   • URL encoding support ✓');
    console.log('   • Error handling ✓');
    console.log('   • Authentication checks ✓');
  });
});