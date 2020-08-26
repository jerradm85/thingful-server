const xss = require('xss')

const UserService = {

    hasUserWithUserName(db, user_name) {
        return db('thingful_users')
            .where({ user_name })
            .first()
            .then(user => !!user)
    }

}

module.exports = UserService