const express = require("express");
const app = express();
const usersRouter = require("./routes/users");
const widgetsRouter = require("./routes/widgets");

// Routes ------
app.use('/users', usersRouter);
app.use('/widgets', widgetsRouter);

const PORT = 3010;
app.listen(PORT, () => {
    console.log(`server is listening on port ${PORT}`);
})