const express = require('express')
const userRouter = express.Router()
const jsonBodyParser = express.json()
const UserService = require('./users-service')

userRouter
    .post('/', jsonBodyParser, (req, res, next) => {
        const { full_name, nick_name, user_name, password } = req.body
        for (const field of Object.keys({ full_name, user_name, password })) {
            if (!req.body[field]) {
                return res.status(400).json({ error: `Missing ${field} in request body` })
            }
        }
        // for (const field of ['full_name','password','user_name']) {
        //     if (!req.body[field]) {
        //         return res.status(400).json({ error: `Missing ${field} in request body` })
        //     }
        // }
        UserService.hasUserWithUserName(
            req.app.get("db"),
            user_name
        )
            .then(hasUser => {
                if (hasUser)
                    return res.status(400).json({ error: `User name already exists` })
            })
        // return res.status(400).json(req.body)
    })

module.exports = userRouter