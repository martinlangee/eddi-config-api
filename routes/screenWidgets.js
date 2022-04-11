const { StatusCodes } = require("http-status-codes");
const express = require("express");
const screenWidgetsRouter = express.Router();
const Db = require("../db");
const { tryCatch } = require("../utils");

const insertNewScreenWidget = async(screen_id, widget_id, user_id, x_pos, y_pos, size_x, size_y) => {
    const queryStr =
        `INSERT INTO ${Db.TSCREENSWIDGETS}
          (screen_id, widget_id, user_id, x_pos, y_pos, size_x, size_y) 
         VALUES
          (${screen_id}, ${widget_id}, ${user_id}, ${x_pos}, ${y_pos},  ${size_x}, ${size_y})`;
    console.log('INSERT', { screen_id, queryStr });
    return await Db.pool().query(queryStr);
}

const deleteScreenWidgets = async(screenId) => {
    const queryStr =
        `DELETE FROM ${Db.TSCREENSWIDGETS}
         WHERE screen_id = ${screenId};`;
    console.log({ screenId, queryStr });
    return await Db.pool().query(queryStr);
}

screenWidgetsRouter.use(express.json()); // => req.body

// '/screenswidgets' Routes ------

screenWidgetsRouter.route('')
    // get all screen widgets
    .get((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const { screenId } = req.params;
            const queryStr =
                `SELECT screen_id, widget_id, x_pos, y_pos, ${Db.TSCREENSWIDGETS}.size_x, ${Db.TSCREENSWIDGETS}.size_y, ${Db.TWIDGETS}.user_id as user_id, ${Db.TWIDGETS}.name, ${Db.TWIDGETS}.thumbnail, ${Db.TWIDGETS}.public
                     FROM ${Db.TSCREENSWIDGETS}
                     JOIN ${Db.TWIDGETS}
                       ON widget_id = ${Db.TWIDGETS}.id;`;
            console.log({ screenId, queryStr });
            res.status(StatusCodes.OK).json((await Db.pool().query(queryStr)).rows);
        })
    })
screenWidgetsRouter.route('/:screenId')
    // get all widgets on the specified screen
    .get((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const { screenId } = req.params;
            const queryStr =
                `SELECT screen_id, widget_id, x_pos, y_pos, ${Db.TSCREENSWIDGETS}.size_x, ${Db.TSCREENSWIDGETS}.size_y, ${Db.TWIDGETS}.user_id as user_id, ${Db.TWIDGETS}.name, ${Db.TWIDGETS}.thumbnail, ${Db.TWIDGETS}.public
                     FROM ${Db.TSCREENSWIDGETS}
                     JOIN ${Db.TWIDGETS}
                       ON widget_id = ${Db.TWIDGETS}.id
                     WHERE screen_id = ${screenId}
                     ORDER BY ${Db.TWIDGETS}.name;`;
            console.log({ screenId, queryStr });
            res.status(StatusCodes.OK).json((await Db.pool().query(queryStr)).rows);
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