const { StatusCodes } = require("http-status-codes");
const express = require("express");
var bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const Db = require("../db");
const { tryCatch } = require("../utils");

const usersRouter = express.Router({ mergeParams: true });

usersRouter.use(express.json()); // => req.body

// '/user' Routes ------

usersRouter.route('')
    // get all users
    .get((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const queryStr =
                `SELECT id, user_name, first_name, last_name, email, created, status, level, image, see_public_widgets, see_public_screens
                 FROM ${Db.TUSERS};`;
            console.log({ queryStr });
            res.status(StatusCodes.OK).json((await Db.pool().query(queryStr)).rows);
        })
    })
    // create user
    .post((req, res) => {
        tryCatch(req, res, async(req, res) => {
            console.log(req.body);
            const { user_name, first_name, last_name, email, password, status, level, image } = req.body;
            const queryStr =
                `INSERT INTO ${Db.TUSERS}
                   (user_name, first_name, last_name, email, password, created, status, level, image, see_public_widgets, see_public_screens)
                 VALUES
                   ('${user_name}', 
                    '${first_name}', 
                    '${last_name}', 
                    '${email}',
                    '${password}', 
                    to_timestamp('${Db.formatDateTime(Date.now())}', ${DATETIME_DISPLAY_FORMAT}),
                    '${status}',
                    '${level}',
                    ''         
                    'false',
                    'false')
                 RETURNING id;`; // TODO: save image data (from Base64?)
            console.log({ queryStr });
            // TODO: check query result => send error
            res.status(StatusCodes.CREATED).json(await Db.pool().query(queryStr));
        })
    });

usersRouter.route('/:userId')
    // get single user
    .get((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const { userId } = req.params;
            const queryStr =
                `SELECT id, user_name, first_name, last_name, email, created, status, level, image, see_public_widgets, see_public_screens
                 FROM ${Db.TUSERS}
                 WHERE id = ${userId};`
            console.log({ userId, queryStr });
            result = await Db.pool().query(queryStr);
            res.status(StatusCodes.OK).json(result.rows);
        });
    })
    // update user
    .put((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const { userId } = req.params;
            let { dbField, value } = req.body;
            let queryStr = '';
            let successMessage = "";
            if (req.query.see_public_widgets) {
                queryStr =
                    `UPDATE ${Db.TUSERS} SET ` +
                    addParamQuery('see_public_widgets', req.query, isFirst = true) +
                    ` WHERE id = ${userId};`
            } else if (req.query.see_public_screens) {
                queryStr =
                    `UPDATE ${Db.TUSERS} SET ` +
                    addParamQuery('see_public_screens', req.query, isFirst = true) +
                    ` WHERE id = ${userId};`
            } else {
                // check duplicates where unique data are required (user_name and email)
                if (dbField === 'user_name') {
                    const resp = await Db.checkDuplicateUsername(userId, value);
                    if (!resp.result) {
                        console.log(resp);
                        return res.send(resp);
                    }
                }
                if (dbField === 'email') {
                    const resp = await Db.checkDuplicateEmail(userId, value);
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
                    `UPDATE ${Db.TUSERS} SET ` +
                    Db.getParamQuery(dbField, value, isFirst = true) +
                    ` WHERE id = ${userId};`
            }
            console.log(req.body, { userId, queryStr });
            const resp = await Db.pool().query(queryStr);
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
                `DELETE FROM ${Db.TSCREENSWIDGETS} 
                 WHERE user_id = ${userId};`
            console.log({ userId, queryStr });
            await Db.pool().query(queryStr);

            // delete all widgets of the user
            queryStr =
                `DELETE FROM ${TWIDGETS} 
                 WHERE user_id = ${userId};`
            console.log({ userId, queryStr });
            await Db.pool().query(queryStr);

            // delete user itself
            queryStr =
                `DELETE FROM ${Db.TUSERS} 
                 WHERE id = ${userId};`
            console.log({ userId, queryStr });
            const success = await Db.pool().query(queryStr).rowCount > 0;
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
            let resp = await Db.checkDuplicateUsername(-1, username);
            if (!resp.result)
                res.status(resp.status).send(resp);
            // then check for duplicate E-mail
            resp = await Db.checkDuplicateEmail(-1, email);
            if (!resp.result)
                res.status(resp.status).send(resp);
            // if unique register new user with the specified data
            return res.status(resp.status).send(await Db.insertUser(username, email, bcrypt.hashSync(password, 8)));
        })
    });

usersRouter.route('/login')
    .post((req, res) => {
        tryCatch(req, res, async(req, res) => {
            console.log(req.body);
            const { email, password } = req.body;
            // find user by E-mail
            const user = await Db.findUserByEmail(email);
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

            var token = jwt.sign({ id: user.id }, Db.SECRET, {
                expiresIn: 86400 // 24 hours
            });

            res.status(StatusCodes.ACCEPTED).send({ id: user.id, username: user.user_name, level: user.level, image: user.image, accessToken: token });
        })
    });

module.exports = { usersRouter };