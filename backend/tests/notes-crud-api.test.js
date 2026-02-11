import { expect } from 'chai';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { getTestPrismaClient, createTestUser, createTestNote } from './setup.js';

describe('Notes CRUD API Tests', () => {
  let prisma;
  let testUser1, testUser2;
  let authToken1, authToken2;
  let testNote1, testNote2;

  before(() => {
    prisma = getTestPrismaClient();
    console.log('\nStarting Notes CRUD API Tests...\n');
  });

  beforeEach(async () => {
    // Create two test users for isolation testing
    testUser1 = await createTestUser({
      name: 'Notes User 1',
      email: 'notes1@example.com'
    });

    testUser2 = await createTestUser({
      name: 'Notes User 2',
      email: 'notes2@example.com'
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

    // Create test notes for each user
    testNote1 = await createTestNote(testUser1.id, {
      title: 'User 1 Note',
      content: 'This note belongs to user 1'
    });

    testNote2 = await createTestNote(testUser2.id, {
      title: 'User 2 Note',
      content: 'This note belongs to user 2'
    });
  });

  describe('POST /api/v1/notes/create-note - Create Note', () => {
    it('✓ Should create a new note and save to PostgreSQL', async () => {
      const noteData = {
        title: 'My New Note',
        content: 'This is the content of my new note with <strong>HTML</strong> formatting'
      };

      console.log('   Testing note creation...');

      const response = await request(app)
        .post('/api/v1/notes/create-note')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(noteData)
        .expect(200);

      // Verify response structure
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message', 'Note created successfully');
      expect(response.body.data).to.have.property('id');
      expect(response.body.data).to.have.property('title', noteData.title);
      expect(response.body.data).to.have.property('content', noteData.content);
      expect(response.body.data).to.have.property('userId', testUser1.id);
      expect(response.body.data).to.have.property('createdAt');
      expect(response.body.data).to.have.property('updatedAt');

      // Verify note was saved in PostgreSQL
      const savedNote = await prisma.note.findUnique({
        where: { id: response.body.data.id }
      });

      expect(savedNote).to.not.be.null;
      expect(savedNote.title).to.equal(noteData.title);
      expect(savedNote.content).to.equal(noteData.content);
      expect(savedNote.userId).to.equal(testUser1.id);

      console.log('   ✓ Note created successfully and saved to PostgreSQL');
      console.log(`   Note ID: ${response.body.data.id}`);
    });

    it('✓ Should create note without title (title optional)', async () => {
      const noteData = {
        content: 'This note has no title but should still be created'
      };

      console.log('   Testing note creation without title...');

      const response = await request(app)
        .post('/api/v1/notes/create-note')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(noteData)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body.data).to.have.property('content', noteData.content);
      expect(response.body.data.title).to.be.null;

      console.log('   ✓ Note created without title successfully');
    });

    it('Should require content for note creation', async () => {
      console.log('   Testing note creation without content...');

      const response = await request(app)
        .post('/api/v1/notes/create-note')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          title: 'Note without content'
        })
        .expect(400);

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message', 'Note content is required');

      console.log('   ✓ Content requirement properly enforced');
    });

    it('Should require authentication for note creation', async () => {
      console.log('   Testing note creation without authentication...');

      const response = await request(app)
        .post('/api/v1/notes/create-note')
        .send({
          title: 'Unauthorized Note',
          content: 'This should not be created'
        })
        .expect(401);

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message', 'Access token not provided');

      console.log('   ✓ Authentication requirement properly enforced');
    });
  });

  describe('GET /api/v1/notes/get-notes - Fetch All Notes', () => {
    it('✓ Should fetch all notes for the logged-in user only', async () => {
      console.log('   Testing fetch all notes for user...');

      const response = await request(app)
        .get('/api/v1/notes/get-notes')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message', 'Notes fetched successfully');
      expect(response.body.data).to.be.an('array');

      // Should only return notes belonging to user 1
      const userNotes = response.body.data;
      expect(userNotes).to.have.length.greaterThan(0);
      
      userNotes.forEach(note => {
        expect(note).to.have.property('userId', testUser1.id);
        expect(note).to.have.property('id');
        expect(note).to.have.property('title');
        expect(note).to.have.property('content');
        expect(note).to.have.property('createdAt');
        expect(note).to.have.property('updatedAt');
      });

      console.log(`   ✓ Fetched ${userNotes.length} notes for user 1`);
      console.log('   ✓ User isolation verified - only user\'s own notes returned');
    });

    it('✓ Should return empty array when user has no notes', async () => {
      // Create a new user with no notes
      const newUser = await createTestUser({
        name: 'Empty User',
        email: 'empty@example.com'
      });

      const emptyUserToken = jwt.sign(
        { id: newUser.id, email: newUser.email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
      );

      console.log('   Testing fetch notes for user with no notes...');

      const response = await request(app)
        .get('/api/v1/notes/get-notes')
        .set('Authorization', `Bearer ${emptyUserToken}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body.data).to.be.an('array');
      expect(response.body.data).to.have.length(0);

      console.log('   ✓ Empty array returned for user with no notes');
    });

    it('Should require authentication', async () => {
      console.log('   Testing fetch notes without authentication...');

      const response = await request(app)
        .get('/api/v1/notes/get-notes')
        .expect(401);

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message', 'Access token not provided');

      console.log('   ✓ Authentication requirement properly enforced');
    });
  });

  describe('GET /api/v1/notes/get-note/:id - Fetch Single Note', () => {
    it('✓ Should fetch a single note by ID for the owner', async () => {
      console.log('   Testing fetch single note by owner...');

      const response = await request(app)
        .get(`/api/v1/notes/get-note/${testNote1.id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message', 'Note fetched successfully!');
      expect(response.body.data).to.have.property('id', testNote1.id);
      expect(response.body.data).to.have.property('title', testNote1.title);
      expect(response.body.data).to.have.property('content', testNote1.content);
      expect(response.body.data).to.have.property('userId', testUser1.id);

      console.log(`   ✓ Successfully fetched note: ${testNote1.title}`);
    });

    it('Should not allow user to access another user\'s note', async () => {
      console.log('   Testing access control - user trying to access another user\'s note...');

      const response = await request(app)
        .get(`/api/v1/notes/get-note/${testNote2.id}`)
        .set('Authorization', `Bearer ${authToken1}`) // User 1 trying to access User 2's note
        .expect(404);

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message', 'Note not found');

      console.log('   ✓ Access control working - user cannot access other user\'s notes');
    });

    it('Should return error for non-existent note ID', async () => {
      console.log('   Testing fetch non-existent note...');

      const response = await request(app)
        .get('/api/v1/notes/get-note/non-existent-id')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(404);

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message', 'Note not found');

      console.log('   ✓ Non-existent note properly handled');
    });
  });

  describe('PATCH /api/v1/notes/edit-note - Update Note', () => {
    it('✓ Should update note title and content for owner', async () => {
      const updateData = {
        id: testNote1.id,
        title: 'Updated Note Title',
        content: 'This is the updated content with <em>new formatting</em>'
      };

      console.log('   Testing note update by owner...');

      const response = await request(app)
        .patch('/api/v1/notes/edit-note')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(updateData)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message', 'Note updated successfully!');
      expect(response.body.data).to.have.property('id', testNote1.id);
      expect(response.body.data).to.have.property('title', updateData.title);
      expect(response.body.data).to.have.property('content', updateData.content);
      expect(response.body.data).to.have.property('userId', testUser1.id);

      // Verify update in database
      const updatedNote = await prisma.note.findUnique({
        where: { id: testNote1.id }
      });

      expect(updatedNote.title).to.equal(updateData.title);
      expect(updatedNote.content).to.equal(updateData.content);

      console.log('   ✓ Note updated successfully in database');
    });

    it('✓ Should update only content (title optional)', async () => {
      const updateData = {
        id: testNote1.id,
        content: 'Updated content only, title remains the same'
      };

      console.log('   Testing content-only update...');

      const response = await request(app)
        .patch('/api/v1/notes/edit-note')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(updateData)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body.data).to.have.property('content', updateData.content);

      console.log('   ✓ Content-only update successful');
    });

    it('Should not allow user to update another user\'s note', async () => {
      const updateData = {
        id: testNote2.id, // User 2's note
        title: 'Hacked Title',
        content: 'This should not be allowed'
      };

      console.log('   Testing access control - user trying to update another user\'s note...');

      const response = await request(app)
        .patch('/api/v1/notes/edit-note')
        .set('Authorization', `Bearer ${authToken1}`) // User 1 trying to update User 2's note
        .send(updateData)
        .expect(400);

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message', 'Note does not exist or you are not authorized');

      // Verify original note unchanged
      const originalNote = await prisma.note.findUnique({
        where: { id: testNote2.id }
      });
      expect(originalNote.title).to.equal(testNote2.title);
      expect(originalNote.content).to.equal(testNote2.content);

      console.log('   ✓ Access control working - user cannot update other user\'s notes');
    });

    it('Should require note ID for update', async () => {
      console.log('   Testing update without note ID...');

      const response = await request(app)
        .patch('/api/v1/notes/edit-note')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          title: 'No ID provided',
          content: 'This should fail'
        })
        .expect(400);

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message', 'Note ID is required');

      console.log('   ✓ Note ID requirement properly enforced');
    });
  });

  describe('DELETE /api/v1/notes/delete-note/:id - Delete Note', () => {
    it('✓ Should delete note for owner', async () => {
      // Create a note specifically for deletion test
      const noteToDelete = await createTestNote(testUser1.id, {
        title: 'Note to Delete',
        content: 'This note will be deleted'
      });

      console.log('   Testing note deletion by owner...');

      const response = await request(app)
        .delete(`/api/v1/notes/delete-note/${noteToDelete.id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message', 'Note Deleted Successfully');
      expect(response.body.data).to.have.property('id', noteToDelete.id);

      // Verify note was deleted from database
      const deletedNote = await prisma.note.findUnique({
        where: { id: noteToDelete.id }
      });
      expect(deletedNote).to.be.null;

      console.log('   ✓ Note successfully deleted from database');
    });

    it('Should not allow user to delete another user\'s note', async () => {
      console.log('   Testing access control - user trying to delete another user\'s note...');

      const response = await request(app)
        .delete(`/api/v1/notes/delete-note/${testNote2.id}`)
        .set('Authorization', `Bearer ${authToken1}`) // User 1 trying to delete User 2's note
        .expect(400);

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message', 'Note ID not found');

      // Verify note still exists
      const stillExistsNote = await prisma.note.findUnique({
        where: { id: testNote2.id }
      });
      expect(stillExistsNote).to.not.be.null;

      console.log('   ✓ Access control working - user cannot delete other user\'s notes');
    });

    it('Should return error for non-existent note ID', async () => {
      console.log('   Testing deletion of non-existent note...');

      const response = await request(app)
        .delete('/api/v1/notes/delete-note/non-existent-id')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(400);

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message', 'Note ID not found');

      console.log('   ✓ Non-existent note deletion properly handled');
    });

    it('Should require authentication for deletion', async () => {
      console.log('   Testing deletion without authentication...');

      const response = await request(app)
        .delete(`/api/v1/notes/delete-note/${testNote1.id}`)
        .expect(401);

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message', 'Access token not provided');

      console.log('   ✓ Authentication requirement properly enforced for deletion');
    });
  });

  after(() => {
    console.log('\n✓ Notes CRUD API Tests Completed!\n');
  });
});