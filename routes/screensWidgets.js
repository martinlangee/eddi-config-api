const { StatusCodes } = require("http-status-codes");
const express = require("express");
const screensWidgets = express.Router();
const { pool } = require("../db");
const { tryCatch, getParamQuery, DATETIME_DISPLAY_FORMAT, formatDateTime } = require("../utils");

const TABLE_NAME = 'screens_widgets';

screensWidgets.use(express.json()); // => req.body

const insertNewScreenWidget = async(screen_id, widget_id, x_pos, y_pos, size_x, size_y) => {
    const queryStr =
        `INSERT INTO ${TABLE_NAME}
          (screen_id, widget_id, x_pos, y_pos, size_x, size_y) 
         VALUES
          (${screen_id},  ${widget_id},  ${x_pos}, ${y_pos},  ${size_x}, ${size_y})`;
    console.log('INSERT', { screen_id, queryStr });
    return await pool.query(queryStr);
}

const deleteScreenWidgets = async(screenId) => {
    const queryStr =
        `DELETE FROM ${TABLE_NAME}
         WHERE screen_id = ${screenId};`;
    console.log({ queryStr });
    return await pool.query(queryStr);
}

// '/screenswidgets' Routes ------

screensWidgets.route('/:screenId')
    // get all widgets on the specified screen
    .get((req, res, next) => {
        tryCatch(req, res, async(req, res) => {
            const { screenId } = req.params;
            const queryStr =
                `SELECT screen_id, widget_id, x_pos, y_pos, screens_widgets.size_x, screens_widgets.size_y, widgets.user_id, widgets.name, widgets.thumbnail, widgets.public
                     FROM ${TABLE_NAME}
                     JOIN widgets
                       ON widget_id = widgets.id
                     WHERE screen_id = ${screenId};`;
            console.log({ screenId, queryStr });
            res.status(StatusCodes.OK).json((await pool.query(queryStr)).rows);
        })
    })
    // set new screen-widgets on screen of '/<screenId>'
    // assuming: array of screens_widgets data in the request-body
    .post((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const { screenId } = req.params;

            // first delete the widget config of the screenId...
            await deleteScreenWidgets(screenId);

            // then insert again all passed widgets
            let responses = [];
            for (const screenWidget of req.body) {
                const { widget_id, x_pos, y_pos, size_x, size_y } = screenWidget;
                responses.push(await insertNewScreenWidget(screenId, widget_id, x_pos, y_pos, size_x, size_y));
            };
            res.status(StatusCodes.ACCEPTED).json(responses);
        });
    })

module.exports = screensWidgets;