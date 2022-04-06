const { StatusCodes } = require("http-status-codes");
const express = require("express");
var bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const { pool, TUSERS, TSCREENSWIDGETS, SECRET, dbCheckDuplicateUsernameOrEmail, dbCreateUser, dbFindUserByEmail } = require("../db");
const { tryCatch, addParamQuery, DATETIME_DISPLAY_FORMAT } = require("../utils");

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
            const { user_name, first_name, last_name, email, pwd_hash, status, level, image } = req.body;
            const queryStr =
                `INSERT INTO ${TUSERS}
                   (user_name, first_name, last_name, email, pwd_hash, created, status, level, image, see_public_widgets, see_public_screens)
                 VALUES
                   ('${user_name}', 
                    '${first_name}', 
                    '${last_name}', 
                    '${email}',
                    '${pwd_hash}', 
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
                queryStr =
                    `UPDATE ${TUSERS} SET ` +
                    addParamQuery('user_name', req.body, isFirst = true) +
                    addParamQuery('first_name', req.body) +
                    addParamQuery('last_name', req.body) +
                    addParamQuery('email', req.body) +
                    addParamQuery('pwd_hash', req.body) +
                    addParamQuery('status', req.body) +
                    addParamQuery('level', req.body) +
                    //addParamQuery('image', req.body) +     // TODO: handle data format of image
                    addParamQuery('see_public_widgets', req.body) +
                    addParamQuery('see_public_screens', req.body) +
                    ` WHERE id = ${userId};`
            }
            console.log({ userId, queryStr });
            res.status(StatusCodes.ACCEPTED).json(await pool.query(queryStr));
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
            const { user_name, email, pwd } = req.body;
            // first check for duplicate user data
            const resp = await dbCheckDuplicateUsernameOrEmail(user_name, email);
            if (resp.result) {
                // then create new user with the specified data
                return res.status(resp.status).send(await dbCreateUser(user_name, email, bcrypt.hashSync(pwd, 8)));
            } else {
                res.status(resp.status).send(resp);
            }
        })
    });

usersRouter.route('/login')
    .post((req, res) => {
        tryCatch(req, res, async(req, res) => {
            console.log(req.body);
            const { email, password } = req.body;
            // find user Email
            const user = await dbFindUserByEmail(email);
            console.log(user);
            if (!user.result) {
                return res.status(user.status).send(user);
            }
            // verify password hash
            var pwdValid = bcrypt.compareSync(
                password,
                user.pwd_hash
            );

            // TODO: check of old unhashed passwords -> remove this later ################################
            if (!pwdValid) {
                pwdValid = password === user.pwd_hash;
            }

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