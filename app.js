const { StatusCodes } = require("http-status-codes");
const express = require("express");
var cors = require('cors');
const app = express();

const usersRouter = require("./routes/users");
const widgetsRouter = require("./routes/widgets");
const screensRouter = require("./routes/screens");
const screenWidgetsRouter = require("./routes/screenWidgets");

app.use(cors());

// log every request
app.use((req, res, next) => {
    console.log(req.method, req.originalUrl);
    next();
});

// Routes ------
app.use('/usr', usersRouter);
app.use('/widget', widgetsRouter);
app.use('/screen', screensRouter);
app.use('/screenwidgets', screenWidgetsRouter);

// Error handling -----
app.get('*', function(req, res, next) {
    const error = new Error(
        `${req.ip} tried to ${req.method} ${req.originalUrl}`,
    );
    error.statusCode = StatusCodes.MOVED_PERMANENTLY;
    next(error);
});

app.use((error, req, res, next) => {
    if (!error.statusCode)
        error.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;

    // TODO: implement '404' redirect page
    // if (error.statusCode === StatusCodes.MOVED_PERMANENTLY) {
    //     return res.status(StatusCodes.MOVED_PERMANENTLY).redirect('/not-found');
    // }

    return res.status(error.statusCode).json({ error: error.toString() });
});

const PORT = 3010;
app.listen(PORT, () => {
    console.log(`server is listening on port ${PORT}`);
})