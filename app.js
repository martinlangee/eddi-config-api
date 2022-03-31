const { StatusCodes } = require("http-status-codes");
const express = require("express");
const app = express();
const usersRouter = require("./routes/users");
const widgetsRouter = require("./routes/widgets");
const screensRouter = require("./routes/screens");

// Routes ------
app.use('/users', usersRouter);
app.use('/widgets', widgetsRouter);
app.use('/screens', screensRouter);

app.use((req, res) => {
    res.status(StatusCodes.NOT_FOUND).send("Resource not found");
})


const PORT = 3010;
app.listen(PORT, () => {
    console.log(`server is listening on port ${PORT}`);
})