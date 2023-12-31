const allowedOrigins = require('./allowedOrigins')

const corsOptions = {
    origin: (origin, callback)=>{
        if(allowedOrigins.indexOf(origin) !== -1 || !origin)
            callback(null, true)
        else
            callback(new Error('Not Allowed by cors'))
    },
    credentials: true, //to show in res (cookies, ...ect)
}

module.exports = corsOptions