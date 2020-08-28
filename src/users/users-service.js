const xss = require('xss')

const regExValidatePassword = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&])[\S]+/

const UserService = {

    hasUserWithUserName(db, user_name) {
        return db('thingful_users')
            .where({ user_name })
            .first()
            .then(user => !!user)
    },

    validatePassword(password) {
        if (password.length < 8) {
            return 'password must be longer than 8 characters'
        }
        if (password.length > 72) {
            return 'password must be less than 72 characters'
        }
        if (password.startsWith(' ') || password.endsWith(' ')) {
            return 'password may not start with or end with a space'
        }
        if (!regExValidatePassword.test(password)) {
            return 'password must contain at least one upper-case, lower-case, number, and special character'
        }
    },

    hashPassword(password) {
        return bcrypt.hash(password, 12)
    },

    insertUser(db, newUser) {
        return db.insert(newUser)
            .into('thingful_users')
            .returning('*')
            .then(([user]) => user)

    },

    serializeUser(user) {
        return {
            id: xss(user.id),
            user_name: xss(user.user_name),
            full_name: xss(user.full_name),
            nick_name: xss(user.nick_name),
            date_created: new Date(user.date_created),
        }
    }
}

module.exports = UserService