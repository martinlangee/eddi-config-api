const { StatusCodes } = require("http-status-codes");
const express = require("express");
const screensWidgets = express.Router();
const pool = require("../db");
const { tryCatch, getParamQuery, DATETIME_DISPLAY_FORMAT, formatDateTime } = require("../utils");

screensWidgets.use(express.json()); // => req.body

// '/screenswidgets' Routes ------

screensWidgets.route('/:screenId')
    // get all widgets on the specified screen
    .get((req, res, next) => {
        tryCatch(req, res, async(req, res) => {
            const { screenId } = req.params;
            const queryStr =
                `SELECT screen_id, widget_id, x_pos, y_pos, screens_widgets.size_x, screens_widgets.size_y, widgets.user_id, widgets.name, widgets.thumbnail, widgets.public
                     FROM screens_widgets
                     JOIN widgets
                       ON widget_id = widgets.id
                     WHERE screen_id = ${screenId};`;
            console.log({ screenId, queryStr });
            res.status(StatusCodes.OK).json((await pool.query(queryStr)).rows);
        })
    })
    // update screen-widgets on screen of '/<screenId>'
    // assuming: array of screens_widgets data in the request-body
    .put((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const { screenId } = req.params;
            let response = [];
            for (const screenWidget of req.body) {
                const { widget_id, x_pos, y_pos, size_x, size_y } = screenWidget;
                const queryStr =
                    'UPDATE screens_widgets SET ' +
                    getParamQuery('screen_id', screenId, isFirst = true) +
                    getParamQuery('widget_id', widget_id) +
                    getParamQuery('x_pos', x_pos) +
                    getParamQuery('y_pos', y_pos) +
                    getParamQuery('size_x', size_x) +
                    getParamQuery('size_y', size_y) +
                    ` WHERE screen_id = ${screenId} AND widget_id = ${widget_id};`
                console.log({ screenId, queryStr });
                response.push(await pool.query(queryStr));
            };
            res.status(StatusCodes.ACCEPTED).json(response);
        });
    })
    // create new screen-widget on screen of '/<screenId>'
    .post((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const { screenId } = req.params;
            const { widget_id, x_pos, y_pos, size_x, size_y } = req.body;
            const queryStr =
                `INSERT INTO screens_widgets SET
                   (screen_id, widget_id, x_pos, y_pos, size_x, size_y)
                 VALUES +
                   ('${screenId}',
                    '${widget_id}',
                    '${x_pos}',
                    '${y_pos}',
                    '${size_x}',
                    '${size_y}')`;
            console.log({ screenId, queryStr });
            res.status(StatusCodes.CREATED).json(await pool.query(queryStr));
        })
    });

module.exports = screensWidgets;