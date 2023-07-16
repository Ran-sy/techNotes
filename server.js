require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const dbConn = require("./config/dbConn");
const {logger} = require('./middleware/logger')
const errHandler = require('./middleware/errorHandle')
const corsOptions = require('./config/corsOptions')
const noteRoute = require('./routes/noteRoutes')
const userRoute = require('./routes/userRoutes')

mongoose.set('strictQuery', true);
const PORT = process.env.PORT || 5000;
dbConn();
app.use(logger)
app.use(express.json())
app.use(cookieParser())

app.use(cors(corsOptions))

app.use("/", express.static(path.join(__dirname, "public")));
app.use("/", require("./routes/rout"));
app.use("/notes", noteRoute)
app.use("/user", userRoute)

app.all("*", (req, res) => {
  res.status(404);
  if (req.accepts("html")) {
    res.sendFile(path.join(__dirname, "views", "404.html"));
  } else if (req.accepts("json")) {
    res.send({ message: "404 page not found" });
  } else {
    res.type("text").send("404 page not found");
  }
});

app.use(errHandler)
mongoose.connection.once("open", () => {
  console.log("Connected to DB");
  app.listen(PORT, () => console.log(`Running on port ${PORT}`));
});
