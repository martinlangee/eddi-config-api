const { StatusCodes } = require("http-status-codes");
const express = require("express");
const screenWidgetsRouter = express.Router();
const { pool, TWIDGETS, TSCREENSWIDGETS } = require("../db");
const { tryCatch } = require("../utils");

const insertNewScreenWidget = async(screen_id, widget_id, user_id, x_pos, y_pos, size_x, size_y) => {
    const queryStr =
        `INSERT INTO ${TSCREENSWIDGETS}
          (screen_id, widget_id, user_id, x_pos, y_pos, size_x, size_y) 
         VALUES
          (${screen_id}, ${widget_id}, ${user_id}, ${x_pos}, ${y_pos},  ${size_x}, ${size_y})`;
    console.log('INSERT', { screen_id, queryStr });
    return await pool.query(queryStr);
}

const deleteScreenWidgets = async(screenId) => {
    const queryStr =
        `DELETE FROM ${TSCREENSWIDGETS}
         WHERE screen_id = ${screenId};`;
    console.log({ screenId, queryStr });
    return await pool.query(queryStr);
}

screenWidgetsRouter.use(express.json()); // => req.body

// '/screenswidgets' Routes ------

screenWidgetsRouter.route('/:screenId')
    // get all widgets on the specified screen
    .get((req, res, next) => {
        tryCatch(req, res, async(req, res) => {
            const { screenId } = req.params;
            const queryStr =
                `SELECT screen_id, widget_id, x_pos, y_pos, ${TSCREENSWIDGETS}.size_x, ${TSCREENSWIDGETS}.size_y, ${TWIDGETS}.user_id as user_id, ${TWIDGETS}.name, ${TWIDGETS}.thumbnail, ${TWIDGETS}.public
                     FROM ${TSCREENSWIDGETS}
                     JOIN ${TWIDGETS}
                       ON widget_id = ${TWIDGETS}.id
                     WHERE screen_id = ${screenId}
                     ORDER BY ${TWIDGETS}.name;`;
            console.log({ screenId, queryStr });
            res.status(StatusCodes.OK).json((await pool.query(queryStr)).rows);
        })
    })
    // set new screen-widgets on screen of '/<screenId>'
    // assuming: array of screens_widgets data in the request-body
    .post((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const { screenId } = req.params;

            // first delete the screen-widget config on the screen with id=screenId
            await deleteScreenWidgets(screenId);

            // then insert again all passed widgets
            let responses = [];
            for (const screenWidget of req.body) {
                const { widget_id, user_id, x_pos, y_pos, size_x, size_y } = screenWidget;
                responses.push(await insertNewScreenWidget(screenId, widget_id, user_id, x_pos, y_pos, size_x, size_y));
            };
            res.status(StatusCodes.ACCEPTED).json(responses);
        });
    })

module.exports = { screenWidgetsRouter, deleteScreenWidgets };