import {ApiResponse } from '../utils/ApiResponse.js'
import {ApiError } from '../utils/ApiError.js'
import {asyncHandler } from '../utils/asyncHandler.js'
import prisma from '../config/prisma.js'
import logger from '../config/logger.js'

//create notes
const createNote = asyncHandler(async (req, res) => {
  const { title, content } = req.body;

  if (!content) {
    throw new ApiError(400, 'Note content is required');
  }

  // Get logged-in user id
  const userId = req.user.id;

  // Create note
  const note = await prisma.note.create({
    data: {
      title,
      content,
      userId,
    },
  });

  if (!note) {
    throw new ApiError(401, 'Failed to create note');
  }

  logger.info(
    {
      userId: req.user.id,
      noteId: note.id,
    },
    'Note created successfully'
  );

  // 4. Response
  return res.status(200).json(
    new ApiResponse(200, note, 'Note created successfully')
  );
});


//edit notes
const editNote = asyncHandler(async (req, res) => {
  const note = req.body;
  const userId = req.user.id;

  // Validation
  if (!note.id) {
    throw new ApiError(400, "Note ID is required");
  }

  // Check if note exists and belongs to logged-in user
  const existingNote = await prisma.note.findFirst({
    where: {
      id: note.id,
      userId: userId
    }
  });

  if (!existingNote) {
    throw new ApiError(400, "Note does not exist or you are not authorized");
  }

  // Update note
  const updatedNote = await prisma.note.update({
    where: {
      id: note.id
    },
    data: {
      title: note.title,
      content: note.content
    }
  });

  if (!updatedNote) {
    throw new ApiError(400, "Failed to update note");
  }

  logger.info(
    {
      userId: req.user.id,
      noteId: updatedNote.id,
    },
    'Note updated successfully'
  );

  return res.status(200).json(
    new ApiResponse(200, updatedNote, "Note updated successfully!")
  );
});


//get all notes
const getNotes = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const notes = await prisma.note.findMany({
    where: {
      userId: userId
    },
    select: {
      id: true,
      title: true,
      content: true,
      userId: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });

  if (!notes) {
    throw new ApiError(500, "Error fetching notes")
  }

  logger.info(
    {
      userId: req.user.id,
    },
    'Notes fetched successfully'
  );

  return res.status(200).json(
    new ApiResponse(200, notes, "Notes fetched successfully")
  );
});


//get single note
const getSingleNote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const note = await prisma.note.findFirst({
    where: {
      id: id,
      userId: userId
    }
  });

  if (!note) {
    throw new ApiError(404, "Note not found");
  }

  logger.info(
    {
      userId: req.user.id,
      noteId: note.id,
    },
    'Single note fetched successfully'
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, note, "Note fetched successfully!")
    );
});


//delete notes
const deleteNote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Check if note exists & belongs to user
  const note = await prisma.note.findFirst({
    where: {
      id: id,
      userId: userId
    }
  });

  if (!note) {
    throw new ApiError(400, "Note ID not found");
  }

  // Delete note
  await prisma.note.delete({
    where: {
      id: id
    }
  });

  logger.info(
    {
      userId: req.user.id,
      noteId: note.id,
    },
    'Note deleted successfully'
  );

  return res.status(200).json(
    new ApiResponse(200, note, "Note Deleted Successfully")
  );
});

const searchNotes = asyncHandler(async (req, res) => {
  const userId = req.user.id
  const { query } = req.query

  if (!query || query.trim() === '') {
    throw new ApiError(400, 'Search query is required')
  }

  const notes = await prisma.note.findMany({
    where: {
      userId,
      OR: [
        {
          title: {
            contains: query,
            mode: 'insensitive'
          }
        },
        {
          content: {
            contains: query,
            mode: 'insensitive'
          }
        }
      ]
    },
    orderBy: {
      updatedAt: 'desc'
    }
  })

    logger.info(
    {
      userId: req.user.id,
      query: req.query,
    },
    'Query fetched successfully'
  );

  return res.status(200).json(
    new ApiResponse(200, notes, 'Search results fetched successfully')
  )
})

// Get total notes count for user
const getTotalNotes = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const totalNotes = await prisma.note.count({
    where: {
      userId: userId
    }
  });

  logger.info(
    {
      userId: req.user.id,
      totalNotes: totalNotes,
    },
    'Total notes count fetched successfully'
  );

  return res.status(200).json(
    new ApiResponse(200, { totalNotes }, 'Total notes count fetched successfully')
  );
});

export {createNote, editNote, getNotes, getSingleNote, deleteNote, searchNotes, getTotalNotes}