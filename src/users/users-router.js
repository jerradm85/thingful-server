const express = require('express')
const userRouter = express.Router()
const jsonBodyParser = express.json()
const path = require('path')
const UserService = require('./users-service')

userRouter
    .post('/', jsonBodyParser, (req, res, next) => {
        const { full_name, nick_name, user_name, password } = req.body
        for (const field of Object.keys({ full_name, user_name, password })) {
            if (!req.body[field]) {
                return res.status(400).json({ error: `Missing ${field} in request body` })
            }
        }

        const passwordError = UserService.validatePassword(password)

        if (passwordError) {
            return res.status(400).json({ error: passwordError })
        }

        UserService.hasUserWithUserName(
            req.app.get("db"),
            user_name
        )
            .then(hasUser => {
                if (hasUser)
                    return res.status(400).json({ error: `User name already exists` })

                return UserService.hashPassword(password)
                    .then(hashedPassword => {
                        const newUser = {
                            user_name,
                            password: hashedPassword,
                            full_name,
                            nick_name,
                            date_created: Date.now(),
                        }

                        return UserService.insertUser(req.app.get('db'), newUser)
                            .then(user => {
                                res.status(201)
                                    .location(path.posix.join(req.originalUrl, `/${user.id}`))
                                    .json(UserService.serializeUser(user))
                            })
                    })
            })
    })

module.exports = userRouter