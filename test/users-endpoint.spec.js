const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')
const supertest = require('supertest')

describe.only('Users Endpoint', function () {
    let db

    const {
        testUsers,
        testThings,
        testReviews,
    } = helpers.makeThingsFixtures()

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    before('cleanup', () => helpers.cleanTables(db))

    afterEach('cleanup', () => helpers.cleanTables(db))

    // beforeEach('insert things', () =>
    //     helpers.seedThingsTables(
    //         db,
    //         testUsers,
    //         testThings,
    //         testReviews,
    //     )
    // )

    describe('POST /api/users', () => {
        context('user validation', () => {
            beforeEach(() =>
                helpers.seedUsers(db, testUsers)
            )
            const requiredFields = ['user_name', 'password', 'full_name'];
            requiredFields.forEach(field => {
                it(`responds 400 if ${field} is missing`, () => {
                    const registerAttemptBody = {
                        user_name: 'test user_name',
                        password: 'test password',
                        full_name: 'test full_name'
                    }
                    delete registerAttemptBody[field]
                    return supertest(app)
                        .post('/api/users')
                        .send(registerAttemptBody)
                        .expect(400, { error: `Missing ${field} in request body` })
                })
            })

            it(`responds 400 if 'user_name' already exists`, () => {
                const duplicateUser = {
                    user_name: testUsers[0].user_name,
                    password: '11AAaabb!!',
                    full_name: 'John Doe'
                }
                return supertest(app)
                    .post('/api/users')
                    .send(duplicateUser)
                    .expect(400, { error: `User name already exists` })
            })

            it(`responds 400 if password not complex enough`, () => {
                
            })
        })
    })
})