const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')
const supertest = require('supertest')
const bcrypt = require('bcryptjs')
const { expect } = require('chai')

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
                const invalidPassUser = {
                    user_name: `newUser1`,
                    password: '11AAaabb',
                    full_name: 'John Doe'
                }

                return supertest(app)
                    .post('/api/users')
                    .send(invalidPassUser)
                    .expect(400, { error: `password must contain at least one upper-case, lower-case, number, and special character` })
            })

            it(`responds 400 when password starts with spaces`, () => {
                const invalidUser = {
                    user_name: `newUser1`,
                    password: ' 11AAaabb!!',
                    full_name: 'John Doe'
                }

                return supertest(app)
                    .post('/api/users')
                    .send(invalidUser)
                    .expect(400, { error: 'password may not start with or end with a space' })
            })

            it(`responds 400 when password ends with spaces`, () => {
                const invalidUser = {
                    user_name: `newUser1`,
                    password: '11AAaabb!! ',
                    full_name: 'John Doe'
                }

                return supertest(app)
                    .post('/api/users')
                    .send(invalidUser)
                    .expect(400, { error: 'password may not start with or end with a space' })
            })

            it(`responds 400 when password is not longer than 8 characters`, () => {
                const invalidUser = {
                    user_name: `newUser1`,
                    password: '11AAa!',
                    full_name: 'John Doe'
                }

                return supertest(app)
                    .post('/api/users')
                    .send(invalidUser)
                    .expect(400, { error: 'password must be longer than 8 characters' })
            })

            it(`responds 400 when password is not longer than 72 characters`, () => {
                const invalidUser = {
                    user_name: `newUser1`,
                    password: '1'.repeat(73),
                    full_name: 'John Doe'
                }

                return supertest(app)
                    .post('/api/users')
                    .send(invalidUser)
                    .expect(400, { error: 'password must be less than 72 characters' })
            })
        })

        context('happy path', () => {
            it(`responds 201 when user is correctly serialized`, () => {
                const validUser = {
                    user_name: `newUser1`,
                    password: '11AAaabb!!',
                    full_name: 'John Doe'
                }

                return supertest(app)
                    .post('/api/users')
                    .send(validUser)
                    .expect(201)
                    .expect(res => {
                        expect(res.body).to.have.property('id')
                        expect(res.body.user_name).to.eql(validUser.user_name)
                        expect(res.body.full_name).to.eql(validUser.full_name)
                        expect(res.body.nickname).to.eql('')
                        expect(res.body).to.not.have.property('password')
                        expect(res.headers.location).to.eql(`/api/users/${res.body.id}`)
                        // const expectedDate = new Date().toLocaleString('en', { timeZone: 'UTC' })
                        // const newDate = new Date(res.body.date_created).toLocaleString()
                        // expect(newDate).to.eql(expectedDate)
                    })
                    .expect(res =>
                        db.from('thingful_users')
                            .select('*')
                            .where({ id: res.body.id })
                            .first()
                            .then(row => {
                                expect(row.user_name).to.eql(validUser.user_name)
                                expect(row.full_name).to.eql(validUser.full_name)
                                expect(row.nickname).to.eql(null)
                                // const expectedDate = new Date().toLocaleString('en', { timeZone: 'UTC' })
                                // const newDate = new Date(res.body.date_created).toLocaleString()
                                // expect(newDate).to.eql(expectedDate)

                                return bcrypt.compare(validUser.password, row.password)
                            })
                            .then(compareMatch => {
                                expect(compareMatch).to.be.true
                            })
                    )
            })
        })
    })
})