import './db/mongoose.js';

import express from "express";
import cors from "cors";

import { router as userRouter } from "./routers/users.js";
import { router as npsRouter } from "./routers/nps.js";
import { router as excursionRouter } from "./routers/excursions.js";
import { router as tripRouter } from "./routers/trips.js";
import { router as friendRouter } from "./routers/friends.js";

const app = express();
app.use(express.json());

app.use(cors());

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(userRouter);
app.use(npsRouter);
app.use(excursionRouter);
app.use(tripRouter);
app.use(friendRouter);

const port = process.env.PORT;
app.listen(port, () => {
    console.log('API service is up on port ' + port);
});