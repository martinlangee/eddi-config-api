const { StatusCodes } = require("http-status-codes");
const express = require("express");
var bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const { pool, TUSERS, TSCREENSWIDGETS, SECRET, dbCheckDuplicateUsername, dbCheckDuplicateEmail, dbInsertUser, dbFindUserByEmail } = require("../db");
const { tryCatch, getParamQuery, DATETIME_DISPLAY_FORMAT } = require("../utils");

const usersRouter = express.Router({ mergeParams: true });

usersRouter.use(express.json()); // => req.body

// '/user' Routes ------

usersRouter.route('')
    // get all users
    .get((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const queryStr =
                `SELECT *
                 FROM ${TUSERS};`;
            console.log({ queryStr });
            res.status(StatusCodes.OK).json((await pool.query(queryStr)).rows);
        })
    })
    // create user
    .post((req, res) => {
        tryCatch(req, res, async(req, res) => {
            console.log(req.body);
            const { user_name, first_name, last_name, email, password, status, level, image } = req.body;
            const queryStr =
                `INSERT INTO ${TUSERS}
                   (user_name, first_name, last_name, email, password, created, status, level, image, see_public_widgets, see_public_screens)
                 VALUES
                   ('${user_name}', 
                    '${first_name}', 
                    '${last_name}', 
                    '${email}',
                    '${password}', 
                    to_timestamp('${formatDateTime(Date.now())}', ${DATETIME_DISPLAY_FORMAT}),
                    '${status}',
                    '${status}',
                    'NULL'         
                    'false',
                    'false')
                 RETURNING id;`; // TODO: save image data (from Base64?)
            console.log({ queryStr });
            // TODO: check query result => send error
            res.status(StatusCodes.CREATED).json(await pool.query(queryStr));
        })
    });

usersRouter.route('/:userId')
    // get single user
    .get((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const { userId } = req.params;
            const queryStr =
                `SELECT *
                 FROM ${TUSERS}
                 WHERE id = ${userId};`
            console.log({ userId, queryStr });
            res.status(StatusCodes.OK).json((await pool.query(queryStr)).rows);
        });
    })
    // update user
    .put((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const { userId } = req.params;
            let queryStr = '';
            let successMessage = "";
            if (req.query.see_public_widgets) {
                queryStr =
                    `UPDATE ${TUSERS} SET ` +
                    addParamQuery('see_public_widgets', req.query, isFirst = true) +
                    ` WHERE id = ${userId};`
            } else if (req.query.see_public_screens) {
                queryStr =
                    `UPDATE ${TUSERS} SET ` +
                    addParamQuery('see_public_screens', req.query, isFirst = true) +
                    ` WHERE id = ${userId};`
            } else {
                // check duplicates where unique data are required (user_name and email)
                let { dbField, value } = req.body;
                if (dbField === 'user_name') {
                    const resp = await dbCheckDuplicateUsername(userId, value);
                    if (!resp.result) {
                        console.log(resp);
                        return res.send(resp);
                    }
                }
                if (dbField === 'email') {
                    const resp = await dbCheckDuplicateEmail(userId, email);
                    if (!resp.result)
                        return res.send(resp);
                }
                // hash the password before it is written
                if (dbField === 'password') {
                    value = bcrypt.hashSync(value, 8)
                    successMessage = "Password changed";
                }
                // query other data fields
                queryStr =
                    `UPDATE ${TUSERS} SET ` +
                    getParamQuery(dbField, value, isFirst = true) +
                    ` WHERE id = ${userId};`
            }
            console.log(req.body, { userId, queryStr });
            const resp = await pool.query(queryStr);
            if (resp.rowCount === 1) {
                return res.send({ result: true, message: successMessage || `Parameter ${dbField} changed`, status: StatusCodes.ACCEPTED });
            } else {
                return res.send({ result: false, message: `Failed: ${dbField} could not be changed`, status: StatusCodes.BAD_REQUEST });
            }
        })
    })
    // delete user
    .delete((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const { userId } = req.params;

            // delete screen-widgets assigned to the user
            let queryStr =
                `DELETE FROM ${TSCREENSWIDGETS} 
                 WHERE user_id = ${userId};`
            console.log({ userId, queryStr });
            await pool.query(queryStr);

            // delete all widgets of the user
            queryStr =
                `DELETE FROM ${TWIDGETS} 
                 WHERE user_id = ${userId};`
            console.log({ userId, queryStr });
            await pool.query(queryStr);

            // delete user itself
            queryStr =
                `DELETE FROM ${TUSERS} 
                 WHERE id = ${userId};`
            console.log({ userId, queryStr });
            const success = await pool.query(queryStr).rowCount > 0;
            res.status(success ? StatusCodes.OK : StatusCodes.NOT_FOUND)
                .send({
                    message: (success ? `User ${userId} deleted` : `User ${userId} not found`),
                    user_id: userId
                });
        })
    });

usersRouter.route('/signup')
    .post((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const { username, email, password } = req.body;
            // first check for duplicate username
            let resp = await dbCheckDuplicateUsername(-1, username);
            if (!resp.result)
                res.status(resp.status).send(resp);
            // then check for duplicate E-mail
            resp = await dbCheckDuplicateEmail(-1, email);
            if (!resp.result)
                res.status(resp.status).send(resp);
            // if unique register new user with the specified data
            return res.status(resp.status).send(await dbInsertUser(username, email, bcrypt.hashSync(password, 8)));
        })
    });

usersRouter.route('/login')
    .post((req, res) => {
        tryCatch(req, res, async(req, res) => {
            console.log(req.body);
            const { email, password } = req.body;
            // find user by E-mail
            const user = await dbFindUserByEmail(email);
            console.log(user);
            if (!user.result) {
                return res.status(user.status).send(user);
            }
            // verify password hash
            var pwdValid = bcrypt.compareSync(
                password,
                user.password
            );

            if (!pwdValid) {
                return res.status(StatusCodes.UNAUTHORIZED).send({ accessToken: null, message: "Invalid password" });
            }

            var token = jwt.sign({ id: user.id }, SECRET, {
                expiresIn: 86400 // 24 hours
            });

            res.status(StatusCodes.ACCEPTED).send({ id: user.id, username: user.user_name, level: user.level, accessToken: token });
        })
    });

module.exports = { usersRouter };