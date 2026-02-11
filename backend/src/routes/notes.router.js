import {Router} from 'express'
import {createNote, editNote, getNotes, getSingleNote, deleteNote, searchNotes, getTotalNotes} from '../controllers/notes.controller.js'
import authenticateToken from '../middlewares/auth.middleware.js'

const notesRouter = Router()

// All notes routes require authentication
notesRouter.post('/create-note', authenticateToken, createNote)
notesRouter.patch('/edit-note', authenticateToken, editNote)
notesRouter.get('/get-notes', authenticateToken, getNotes)
notesRouter.get('/get-note/:id', authenticateToken, getSingleNote)
notesRouter.get('/get-total-notes', authenticateToken, getTotalNotes)
notesRouter.delete('/delete-note/:id', authenticateToken, deleteNote)
notesRouter.get('/search', authenticateToken, searchNotes)


export default notesRouter