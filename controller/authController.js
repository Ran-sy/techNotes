const User = require('../models/userModel')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const asyncHandler = require('express-async-handler')
require('dotenv').config()

const login = asyncHandler(async (req, res)=>{
    // GENERATE SECRET FOR TOKEN USING require('crypto').randomBytes(64).toString('hex')
    const { username, password } = req.body
    if( !username || !password )
        return res.status(400).json({ message: 'All fields are required' })
    
    const user = await User.findOne({ username }).exec()

    if( !user || !user.active )
        return res.status(401).json({ message: 'Unauthorized' })
    
    const match = await bcrypt.compare( password, user.password )
    if( !match )
        return res.status(401).json({ message: 'Unauthorized' })

    const accessToken = jwt.sign(
        { user: { username: user.username, roles: user.roles } },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '15m'}
    )
    const refreshToken = jwt.sign(
        { user: { username: user.username } },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d'}
    )

    res.cookie('jwt', refreshToken, {
        httpOnly: true, //only from the web
        secure: true, //https
        sameSite: 'none', //able to access form another site
        maxAge: 7 * 24 * 60 * 60 * 1000 //7d
    })

    res.json({ accessToken })
})

const refresh = (req, res) =>{
    const cookies = req.cookies
    if( !cookies?.jwt )
        return res.status(401).json({ message: 'Unauthorized'})

    const refreshToken = cookies.jwt

    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        asyncHandler(async (req, res)=>{
            if( err )
                return res.status(403).json({ message: 'Forbidden' })
            
            const user = await User.findOne({ username: decoded.user }).exec()
            if( !user )
                return res.status(401).json({ message: 'Unauthorized' })
            
            const accessToken = jwt.sign(
                { user: user.username, roles: user.roles },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '15m' }
            )

            res.json({ accessToken })
        })
    )
}

const logout = (req, res) => {
    const cookies = req.cookies
    if( !cookies?.jwt )
        return res.sendStatus(204)
    res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true})
    res.json({ message: 'Cookie cleared'})
}

module.exports = {
    login, refresh, logout
}