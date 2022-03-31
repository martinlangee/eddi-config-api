const { ReasonPhrases, StatusCodes } = require("http-status-codes");
const express = require("express");
const users = express.Router({ mergeParams: true });
const pool = require("../db");
const { tryCatch, addParamQuery } = require("../utils");

users.use(express.json()); // => req.body

// '/users' Routes ------

// TODO: error handling and create better responses

users.route('')
    // get all users
    .get((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const queryStr =
                `SELECT id, first_name, last_name, email, created, status
                 FROM Users;`;
            res.status(StatusCodes.OK).json(await pool.query(queryStr));
        })
    })
    // create user
    // TODO: check if user-email already present => send error
    .post((req, res) => {
        tryCatch(req, res, async(req, res) => {
            console.log(req.body);
            const { first_name, last_name, email, pwd_hash, status } = req.body;
            const queryStr =
                `INSERT INTO Users
                   (first_name, last_name, email, pwd_hash, created, status)
                 VALUES
                   ('${first_name}', '${last_name}', '${email}', '${pwd_hash}', to_timestamp(${Date.now()} / 1000), '${status}');`;
            res.status(StatusCodes.CREATED).json(await pool.query(queryStr));
        })
    });

users.route('/:id')
    // get single user
    .get((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const { id } = req.params;
            const queryStr =
                `SELECT id, first_name, last_name, email, created, status
                 FROM Users
                 WHERE id = ${id};`
            res.status(StatusCodes.OK).json(await pool.query(queryStr));

        });
    })
    // update user
    .put((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const { id } = req.params;
            const queryStr =
                'UPDATE Users SET ' +
                addParamQuery('first_name', req.body, first = true) +
                addParamQuery('last_name', req.body) +
                addParamQuery('email', req.body) +
                addParamQuery('pwd_hash', req.body) +
                addParamQuery('status', req.body) +
                ` WHERE id = ${id};`
            res.status(StatusCodes.ACCEPTED).json(await pool.query(queryStr));
        })
    })
    // delete user
    // todo: check if user has projects or vidgets => delete them too
    .delete((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const { id } = req.params;
            const success = await pool.query(
                `DELETE FROM Users 
                 WHERE id = ${id};`).rowCount > 0;
            res.status(success ? StatusCodes.OK : StatusCodes.NOT_FOUND)
                .json({
                    message: (success ? `User ${id} deleted` : `User ${id} not found`),
                    user_id: id
                });
        })
    });

module.exports = users;