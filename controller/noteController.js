const Note = require('../models/noteModel')
const User = require('../models/userModel')
const asyncHandler = require('express-async-handler')

const getAllNotes = asyncHandler(async (req, res)=>{
    //.lean() to return only the necessary field as an object not document
    //.exec() to return type promise not vornable
    const notes = await Note.find().lean() 

    if(!notes?.length) return res.status(404).json({message: 'No notes found'})

    const notesWithUser = await Promise.all(notes.map(async (note)=>{
        const user = await User.findById(note.user).lean().exec()
        return { ...note, username: user.username }
    }))

    res.json(notesWithUser)
})

const createNewNote = asyncHandler(async (req, res)=>{
    const { user, title, text } = req.body
    if(!user || !title || !text) 
        return res.status(400).json({message: 'All fields are required'})

    const duplicate = await Note.findOne({ title }).collation({ locale: 'en', strength: 2}).lean().exec()
    if( duplicate )
        return res.status(409).json({ message: 'Duplicated note title'})

    const noteObject = { user, title, text }
    const newNote = await Note.create(noteObject)

    console.log(newNote)

    if(newNote)
        return res.status(201).json({ message: 'New note created' })
    else
        return res.status(400).json({ message: 'Invalid note data received' })
})

const updateNote = asyncHandler(async (req, res)=>{
    const { id, user, title, text, completed } = req.body

    if( !id || !user || !title || !text || typeof completed !== 'boolean' )
        return res.status(400).json({ message: 'All fields are required' })

    const note = await Note.findById(id).exec()
    if( !note )
        return res.status(400).json({ message: 'Note is not found'})

    const dublicate = await Note.findOne({ title }).collation({ local: 'en', strength: 2 })

    if( dublicate && dublicate?.id.toString() !== id )
        return res.status(409).json({ message: 'Duplicate note title' })

    note.user = user; note.title = title; note.text = text; note.completed = completed;

    const updatedNote = await note.save()

    res.json({ message: `Note: '${updatedNote.title}' was updated` })
})

const deleteNote = asyncHandler(async (req, res)=>{
    const { id } = req.body

    if( !id ) 
        return res.status(400).json({ message: 'Note ID is required' })

    const note = Note.findById( id ).exec()

    if( !note )
        return res.status(400).json({ message: `Note is not found`})

    const result = await note.deleteOne()
    const reply =  `Note "${result.title}" with ID ${result._id} was deleted`

    res.json(reply) 
})

module.exports = {
    getAllNotes, createNewNote, updateNote, deleteNote
}