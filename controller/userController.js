const User = require('../models/userModel')
const Note = require('../models/noteModel')
const asyncHandler = require('express-async-handler')
const bcrypt = require('bcrypt')

const getAllUsers = asyncHandler(async (req, res)=>{
    const users = await User.find().select('-password').lean() 

    if(!users?.length) return res.status(404).json({message: 'No users found'})

    res.json(usersWithUser)
})

const createNewUser = asyncHandler(async (req, res)=>{
    const { username, password, roles } = req.body
    if(!username || !password) 
        return res.status(400).json({message: 'All fields are required'})

    const duplicate = await User.findOne({ username }).collation({ locale: 'en', strength: 2}).lean().exec()
    if( duplicate )
        return res.status(409).json({ message: 'Duplicated username'})

    const hashedPwd = await bcrypt.hash(password, 10)

    const userObject = (!Array.isArray(roles) || !roles.length)
        ? { username, password: hashedPwd }
        : { username, password: hashedPwd, roles}
    const newUser = await User.create(userObject)

    if(newUser)
        return res.status(201).json({ message: `New user '${username}' was created` })
    else
        return res.status(400).json({ message: 'Invalid user data received' })
})

const updateUser = asyncHandler(async (req, res)=>{
    const { id, username, password, roles, active } = req.body

    if( !id || !username || !Array.isArray(roles) || !roles.length || typeof active !== 'boolean' )
        return res.status(400).json({ message: 'All fields except password are required' })

    const user = await User.findById(id).exec()
    if( !user )
        return res.status(400).json({ message: 'User is not found'})

    const dublicate = await User.findOne({ username }).collation({ local: 'en', strength: 2 })

    if( dublicate && dublicate?.id.toString() !== id )
        return res.status(409).json({ message: 'Duplicate user username' })

    user.username = username; user.roles = roles; user.active = active;

    if( password )
        user.password = await bcrypt.hash(password, 10)

    const updatedUser = await user.save()

    res.json({ message: `User '${updatedUser.username}' was updated` })
})

const deleteUser = asyncHandler(async (req, res)=>{
    const { id } = req.body

    if( !id ) 
        return res.status(400).json({ message: 'User ID is required' })
    
    const note = await Note.findOne({ user: id }).lean().exec()
    if(note)
        return res.status(400).json({ message: 'User has assigned notes' })

    const user = User.findById( id ).exec()

    if( !user )
        res.status(400).json({ message: `User is not found`})

    const result = await user.deleteOne()
    const reply =  `User "${result.title}" with ID ${result._id} was deleted`

    res.json(reply) 
})

module.exports = {
    getAllUsers, createNewUser, updateUser, deleteUser
}