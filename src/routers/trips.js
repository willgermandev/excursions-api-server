import mongoose from "mongoose";
import express from "express";
import { Trip } from "../models/trip.js";
import { User } from "../models/user.js";
import { auth } from "../middleware/auth.js";
import { payload } from "../middleware/payload.js";

export const router = new express.Router();

// NOTE: An array of permitted fields on the `Trip Schema` that can be modified through a request body payload (i.e, Create/Update, etc).
const permittedTripFields = [
    'name',
    'description',
    'park',
    'campground',
    'activities',
    'thingstodo',
    'startDate',
    'endDate',
];

// ----------------------- //
// #region Trip Management //
// ----------------------- //

/**
 *  Create Trip
 *  [docs link]
 */
router.post('/trip', auth, payload(permittedTripFields), async (req, res) => {
    try {
        req.payload.host = req.user._id;

        let trip = new Trip(req.payload);
        await trip.save();

        // NOTE: The NPS API could be leveraged here to return additional data without having the client make multiple requests to the web server (i.e., park, campground, etc).

        const host = await User.findOne(
            { _id: trip.host },
            {
                _id: 1,
                userName: 1,
                firstName: 1,
                lastName: 1,
                email: 1,
            }
        );

        if (host) {
            trip.host = host;
        }

        return res.status(201).send({ trip });
    } catch (error) {
        console.log(error);
        return res.status(400).send("Unable to create new trip.");
    }
});

/**
 *  Get Trips By User
 *  [docs link]
 */
router.get('/trips', auth, async (req, res) => {
    try {
        const filter = { host: req.user._id };

        const pipeline = Trip.aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: "users",
                    foreignField: "_id",
                    localField: "host",
                    as: "host",
                }
            },
            {
                $project: {
                    "_id": 1,
                    "name": 1,
                    "description": 1,
                    "park": 1,
                    "campground": 1,
                    "activities": 1,
                    "thingstodo": 1,
                    "startDate": 1,
                    "endDate": 1,

                    "host._id": 1,
                    "host.userName": 1,
                    "host.firstName": 1,
                    "host.lastName": 1,
                    "host.email": 1,
                }
            }
        ]);

        const trips = await pipeline.exec();

        if (!trips) {
            return res.status(404).send("Requested resource not found.");
        }

        const total = trips.length;

        return res.status(200).send({ total, trips });
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server encountered an unexpected error. Please try again.");
    }
});

/**
 *  Get Trip By Id
 *  [docs link]
 */
router.get('/trip/:tripId', auth, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.tripId)) {
            return res.status(400).send("Invalid Id.");
        }

        const trip = await Trip.findById({ _id: req.params.tripId });

        if (!trip) {
            return res.status(404).send("Requested resource not found.");
        }

        if (!trip.host.equals(req.user._id)) {
            return res.status(403).send("Forbidden.");
        }

        const host = await User.findById(
            { _id: trip.host },
            {
                _id: 1,
                userName: 1,
                firstName: 1,
                lastName: 1,
                email: 1,
            }
        );

        if (host) {
            trip.host = host;
        }

        return res.status(200).send({ trip });
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server encountered an unexpected error. Please try again.");
    }
});

/**
 *  Update Trip By Id
 *  [docs link]
 */
router.patch('/trip/:tripId', auth, payload(permittedTripFields), async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.tripId)) {
            return res.status(400).send("Invalid Id.");
        }

        const trip = await Trip.findById({ _id: req.params.tripId });

        if (!trip) {
            return res.status(404).send("Requested resource not found.");
        }

        if (!trip.host.equals(req.user._id)) {
            return res.status(403).send("Forbidden");
        }

        const props = Object.keys(req.payload);
        props.forEach((prop) => trip[prop] = req.payload[prop]);

        await trip.save();

        const host = await User.findById(
            { _id: trip.host },
            {
                _id: 1,
                userName: 1,
                firstName: 1,
                lastName: 1,
                email: 1,
            }
        );

        if (host) {
            trip.host = host;
        }

        return res.status(200).send({ trip });
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server encountered an unexpected error. Please try again.");
    }
});

/**
 *  Delete Trip By Id
 *  [docs link]
 */
router.delete('/trip/:tripId', auth, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.tripId)) {
            return res.status(400).send("Invalid Id.");
        }

        const trip = await Trip.findById({ _id: req.params.tripId });

        if (!trip) {
            return res.status(404).send("Requested resource not found.");
        }

        if (!trip.host.equals(req.user._id)) {
            return res.status(403).send("Forbidden.");
        }

        await trip.deleteOne();

        return res.status(204).send();
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server encountered an unexpected error. Please try again.");
    }
});

// ----------------------- //
// #endregion              //
// ----------------------- //