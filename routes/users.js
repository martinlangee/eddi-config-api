const { StatusCodes } = require("http-status-codes");
const express = require("express");
const usersRouter = express.Router({ mergeParams: true });
const { pool, TUSERS, TSCREENSWIDGETS } = require("../db");
const { tryCatch, addParamQuery } = require("../utils");

usersRouter.use(express.json()); // => req.body

// '/users' Routes ------

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
    // TODO: check if user_name or email already present => send error
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
                    to_timestamp(${Date.now()} / 1000), 
                    '${status}',
                    '${status}',
                    'NULL'         
                    'false',
                    'false')
                 RETURNING id;`; // TODO: save image data (from Base64?)
            console.log({ queryStr });
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
                .json({
                    message: (success ? `User ${userId} deleted` : `User ${userId} not found`),
                    user_id: userId
                });
        })
    });

module.exports = { usersRouter };