import mongoose from "mongoose";
import express from "express";
import { Excursion } from "../models/excursion.js";
import { ExcursionInvite } from "../models/excursionInvite.js";
import { User } from "../models/user.js";
import { auth } from "../middleware/auth.js";
import { payload } from "../middleware/payload.js";

export const router = new express.Router();

// NOTE: An array of permitted fields on the `Excursion Schema` that can be modified through a request body payload (i.e, Create/Update, etc).
const permittedExcursionFields = [
    'name',
    'description',
    'trips',
    'isPublic',
    'isComplete',
];

// ---------------------------- //
// #region Excursion Management //
// ---------------------------- //

/**
 *  Create Excursion
 *  [docs link]
 */
router.post('/excursion', auth, payload(permittedExcursionFields), async (req, res) => {
    try {
        req.payload.host = req.user._id;

        let excursion = new Excursion(req.payload);
        await excursion.save();

        const filter = { _id: excursion._id };

        const pipeline = Excursion.aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: "trips",
                    foreignField: '_id',
                    localField: "trips",
                    as: "trips"
                }
            },
            {
                $lookup: {
                    from: "users",
                    foreignField: "_id",
                    localField: "host",
                    as: "host",
                }
            },
            {
                $lookup: {
                    from: "users",
                    foreignField: "_id",
                    localField: "participants",
                    as: "participants",
                }
            },
            {
                $project: {
                    "name": 1,
                    "description": 1,
                    "isPublic": 1,
                    "isComplete": 1,
                    "createdAt": 1,
                    "updatedAt": 1,

                    "trips._id": 1,
                    "trips.name": 1,
                    "trips.description": 1,
                    "trips.park": 1,
                    "trips.campground": 1,
                    "trips.activities": 1,
                    "trips.thingstodo": 1,
                    "trips.startDate": 1,
                    "trips.endDate": 1,

                    "host._id": 1,
                    "host.userName": 1,
                    "host.firstName": 1,
                    "host.lastName": 1,
                    "host.email": 1,

                    "participants._id": 1,
                    "participants.userName": 1,
                    "participants.firstName": 1,
                    "participants.lastName": 1,
                    "participants.email": 1,
                }
            }
        ]);

        excursion = await pipeline.exec();

        return res.status(201).send({ excursion });
    } catch (error) {
        console.log(error);

        /**
         *  11000 is MongoDB's DuplicateKey error code.
         *  https://www.mongodb.com/docs/manual/reference/error-codes/
         */
        if (error.code === 11000) {
            return res.status(400).send("Unable to create new excursion.");
        }

        return res.status(500).send("Server encountered an unexpected error. Please try again.");
    }
});

/**
 *  Get Excursions By User
 *  [docs link]
 */
router.get('/excursions', auth, async (req, res) => {
    try {
        const filter = {
            $or: [
                { host: req.user._id },
                // NOTE: This should work in place of the previously over complicated query.
                { participants: req.user._id, }
                // participants: {
                //     // NOTE: Used to be $all instead of $in
                //     $in: [req.user._id]
                // }
            ]
        };

        const pipeline = Excursion.aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: "trips",
                    foreignField: '_id',
                    localField: "trips",
                    as: "trips"
                }
            },
            {
                $lookup: {
                    from: "users",
                    foreignField: "_id",
                    localField: "host",
                    as: "host",
                }
            },
            {
                $lookup: {
                    from: "users",
                    foreignField: "_id",
                    localField: "participants",
                    as: "participants",
                }
            },
            {
                $project: {
                    "name": 1,
                    "description": 1,
                    "isPublic": 1,
                    "isComplete": 1,
                    "createdAt": 1,
                    "updatedAt": 1,

                    "trips._id": 1,
                    "trips.name": 1,
                    "trips.description": 1,
                    "trips.park": 1,
                    "trips.campground": 1,
                    "trips.activities": 1,
                    "trips.thingstodo": 1,
                    "trips.startDate": 1,
                    "trips.endDate": 1,

                    "host._id": 1,
                    "host.userName": 1,
                    "host.firstName": 1,
                    "host.lastName": 1,
                    "host.email": 1,

                    "participants._id": 1,
                    "participants.userName": 1,
                    "participants.firstName": 1,
                    "participants.lastName": 1,
                    "participants.email": 1,
                }
            }
        ]);

        const excursions = await pipeline.exec();

        if (!excursions) {
            return res.status(404).send("Requested resource not found.");
        }

        const total = excursions.length;

        return res.status(200).send({ total, excursions });
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server encountered an unexpected error. Please try again.");
    }
});

/**
 *  Get Excursion By Id
 *  [docs link]
 */
router.get('/excursion/:excursionId', auth, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.excursionId)) {
            return res.status(400).send("Invalid Id");
        }

        let excursion = await Excursion.findById({ _id: req.params.excursionId });

        if (!excursion) {
            return res.status(404).send("Requested resource not found.");
        }

        if (!excursion.isPublic) {
            if (!excursion.host.equals(req.user._id) && !excursion.participants.includes(req.user._id)) {
                return res.status(403).send("Forbidden.");
            }
        }

        const filter = { _id: excursion._id };

        const pipeline = Excursion.aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: "trips",
                    foreignField: "_id",
                    localField: "trips",
                    as: "trips"
                }
            },
            {
                $lookup: {
                    from: "users",
                    foreignField: "_id",
                    localField: "host",
                    as: "host",
                }
            },
            {
                $lookup: {
                    from: "users",
                    foreignField: "_id",
                    localField: "participants",
                    as: "participants",
                }
            },
            {
                $project: {
                    "name": 1,
                    "description": 1,
                    "isPublic": 1,
                    "isComplete": 1,
                    "createdAt": 1,
                    "updatedAt": 1,

                    "trips._id": 1,
                    "trips.name": 1,
                    "trips.description": 1,
                    "trips.park": 1,
                    "trips.campground": 1,
                    "trips.activities": 1,
                    "trips.thingstodo": 1,
                    "trips.startDate": 1,
                    "trips.endDate": 1,

                    "host._id": 1,
                    "host.userName": 1,
                    "host.firstName": 1,
                    "host.lastName": 1,
                    "host.email": 1,

                    "participants._id": 1,
                    "participants.userName": 1,
                    "participants.firstName": 1,
                    "participants.lastName": 1,
                    "participants.email": 1,
                }
            }
        ]);

        excursion = await pipeline.exec();

        return res.status(200).send({ excursion });
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server encountered an unexpected error. Please try again.");
    }
});

/**
 *  Update Excursion By Id
 *  [docs link]
 */
router.patch('/excursion/:excursionId', auth, payload(permittedExcursionFields), async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.excursionId)) {
            return res.status(400).send("Invalid Id");
        }

        let excursion = await Excursion.findById({ _id: req.params.excursionId });

        if (!excursion) {
            return res.status(404).send("Requested resource not found.");
        }

        if (!excursion.host.equals(req.user._id)) {
            return res.status(403).send("Forbidden");
        }

        const props = Object.keys(req.payload);
        props.forEach((prop) => excursion[prop] = req.payload[prop]);

        await excursion.save();

        const filter = { _id: excursion._id };

        const pipeline = Excursion.aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: "trips",
                    foreignField: "_id",
                    localField: "trips",
                    as: "trips"
                }
            },
            {
                $lookup: {
                    from: "users",
                    foreignField: "_id",
                    localField: "host",
                    as: "host",
                }
            },
            {
                $lookup: {
                    from: "users",
                    foreignField: "_id",
                    localField: "participants",
                    as: "participants",
                }
            },
            {
                $project: {
                    "name": 1,
                    "description": 1,
                    "isPublic": 1,
                    "isComplete": 1,
                    "createdAt": 1,
                    "updatedAt": 1,

                    "trips._id": 1,
                    "trips.name": 1,
                    "trips.description": 1,
                    "trips.park": 1,
                    "trips.campground": 1,
                    "trips.activities": 1,
                    "trips.thingstodo": 1,
                    "trips.startDate": 1,
                    "trips.endDate": 1,

                    "host._id": 1,
                    "host.userName": 1,
                    "host.firstName": 1,
                    "host.lastName": 1,
                    "host.email": 1,

                    "participants._id": 1,
                    "participants.userName": 1,
                    "participants.firstName": 1,
                    "participants.lastName": 1,
                    "participants.email": 1,
                }
            }
        ]);

        excursion = await pipeline.exec();

        return res.status(200).send({ excursion });
    } catch (error) {
        // TODO: Explore errors from MongoDB (i.e., 11000) that may occur when updating the document. Handle those accordingly. (i.e., duplicate trip key).

        console.log(error);
        return res.status(500).send("Server encountered an unexpected error. Please try again.");
    }
});

/**
 *  Delete Excursion By Id
 *  [docs link]
 */
router.delete('/excursion/:excursionId', auth, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.excursionId)) {
            return res.status(400).send("Invalid Id");
        }

        let excursion = await Excursion.findById({ _id: req.params.excursionId });

        if (!excursion) {
            return res.status(404).send("Requested resource not found.");
        }

        if (!excursion.host.equals(req.user._id)) {
            return res.status(403).send("Forbidden.");
        }

        await excursion.deleteOne();

        return res.status(204).send();
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server encountered an unexpected error. Please try again.");
    }
});

// ---------------------------- //
// #endregion                   //
// ---------------------------- //

// NOTE: An array of permitted fields on the `ExcursionInvite Schema` that can be modified through a request body payload (i.e, Create/Update, etc).
const permittedExcursionInviteFields = [
    'receiver',
    'isAccepted',
];

// ------------------------- //
// #region Excursion Invites //
// ------------------------- //

/**
 *  Create Excursion Invite
 *  [docs link]
 */
router.post('/share/excursion/:excursionId', auth, payload(permittedExcursionInviteFields), async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.excursionId)) {
            return res.status(400).send("Invalid Id");
        }

        let excursion = await Excursion.findById({ _id: req.params.excursionId });

        if (!excursion) {
            return res.status(404).send("Requested resource not found.");
        }

        if (!req.user.friends.includes(req.payload.receiver)) {
            return res.status(403).send("Forbidden.");
        }

        let invite = await ExcursionInvite.findOne(
            {
                $and: [
                    { sender: req.user._id },
                    { receiver: req.payload.receiver }
                ]
            }
        );

        if (invite) {
            return res.status(409).send("Requested resource already exists.");
        }

        invite = new ExcursionInvite({
            "sender": req.user._id,
            "receiver": req.payload.receiver,
            "excursion": req.params.excursionId,
        });
        await invite.save();

        let filter = { _id: invite._id };

        const pipeline = ExcursionInvite.aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: "users",
                    foreignField: "_id",
                    localField: "sender",
                    pipeline: [
                        {
                            $project: {
                                "_id": 1,
                                "userName": 1,
                                "firstName": 1,
                                "lastName": 1,
                                "email": 1,
                            }
                        }
                    ],
                    as: "sender",
                }
            },
            { $unwind: "$sender" },
            {
                $lookup: {
                    from: "users",
                    foreignField: "_id",
                    localField: "receiver",
                    pipeline: [
                        {
                            $project: {
                                "_id": 1,
                                "userName": 1,
                                "firstName": 1,
                                "lastName": 1,
                                "email": 1,
                            }
                        }
                    ],
                    as: "receiver",
                }
            },
            { $unwind: "$receiver" },
            {
                $lookup: {
                    from: "excursions",
                    foreignField: "_id",
                    localField: "excursion",
                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                foreignField: "_id",
                                localField: "host",
                                as: "host"
                            }
                        },
                        { $unwind: "$host" },
                        {
                            $lookup: {
                                from: "users",
                                foreignField: "_id",
                                localField: "participants",
                                as: "participants"
                            }
                        },
                        {
                            $lookup: {
                                from: "trips",
                                foreignField: "_id",
                                localField: "trips",
                                pipeline: [
                                    {
                                        $lookup: {
                                            from: "users",
                                            foreignField: "_id",
                                            localField: "host",
                                            as: "host"
                                        }
                                    },
                                    { $unwind: "$host" },
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
                                ],
                                as: "trips"
                            }
                        },
                        {
                            $project: {
                                "_id": 1,
                                "name": 1,
                                "description": 1,
                                "trips": 1,

                                "host._id": 1,
                                "host.userName": 1,
                                "host.firstName": 1,
                                "host.lastName": 1,
                                "host.email": 1,

                                "participants._id": 1,
                                "participants.userName": 1,
                                "participants.firstName": 1,
                                "participants.lastName": 1,
                                "participants.email": 1,
                            }
                        }
                    ],
                    as: "excursion",
                }
            },
            { $unwind: "$excursion" },
            {
                $project: {
                    "_id": 1,
                    "sender": 1,
                    "receiver": 1,
                    "excursion": 1,
                    "isAccepted": 1,
                }
            }
        ]);

        invite = await pipeline.exec();

        return res.status(201).send({ invite });
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server encountered an unexpected error. Please try again.");
    }
});

/**
 *  Get Excursion Invites By User
 *  [docs link]
 */
router.get('/share/excursions', auth, async (req, res) => {
    try {
        const filter = {
            _id: {
                $in: [
                    ...req.user.excursionInvites
                ],
            }
        };

        const pipeline = ExcursionInvite.aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: "users",
                    foreignField: "_id",
                    localField: "sender",
                    pipeline: [
                        {
                            $project: {
                                "_id": 1,
                                "userName": 1,
                                "firstName": 1,
                                "lastName": 1,
                                "email": 1,
                            }
                        }
                    ],
                    as: "sender",
                }
            },
            { $unwind: "$sender" },
            {
                $lookup: {
                    from: "users",
                    foreignField: "_id",
                    localField: "receiver",
                    pipeline: [
                        {
                            $project: {
                                "_id": 1,
                                "userName": 1,
                                "firstName": 1,
                                "lastName": 1,
                                "email": 1,
                            }
                        }
                    ],
                    as: "receiver",
                }
            },
            { $unwind: "$receiver" },
            {
                $lookup: {
                    from: "excursions",
                    foreignField: "_id",
                    localField: "excursion",
                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                foreignField: "_id",
                                localField: "host",
                                as: "host"
                            }
                        },
                        { $unwind: "$host" },
                        {
                            $lookup: {
                                from: "users",
                                foreignField: "_id",
                                localField: "participants",
                                as: "participants"
                            }
                        },
                        {
                            $lookup: {
                                from: "trips",
                                foreignField: "_id",
                                localField: "trips",
                                pipeline: [
                                    {
                                        $lookup: {
                                            from: "users",
                                            foreignField: "_id",
                                            localField: "host",
                                            as: "host"
                                        }
                                    },
                                    { $unwind: "$host" },
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
                                ],
                                as: "trips"
                            }
                        },
                        {
                            $project: {
                                "_id": 1,
                                "name": 1,
                                "description": 1,
                                "trips": 1,

                                "host._id": 1,
                                "host.userName": 1,
                                "host.firstName": 1,
                                "host.lastName": 1,
                                "host.email": 1,

                                "participants._id": 1,
                                "participants.userName": 1,
                                "participants.firstName": 1,
                                "participants.lastName": 1,
                                "participants.email": 1,
                            }
                        }
                    ],
                    as: "excursion",
                }
            },
            { $unwind: "$excursion" },
            {
                $project: {
                    "_id": 1,
                    "sender": 1,
                    "receiver": 1,
                    "excursion": 1,
                    "isAccepted": 1,
                }
            }
        ]);

        const invites = await pipeline.exec();

        if (!invites) {
            return res.status(404).send("Requested resource not found.");
        }

        const total = invites.length;

        return res.status(200).send({ total, invites });
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server encountered an unexpected error. Please try again.");
    }
});

/**
 *  Get Excursion Invite By Id
 *  [docs link]
 */
router.get('/share/excursions/:inviteId', auth, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.inviteId)) {
            return res.status(400).send("Invalid Id");
        }

        let invite = await ExcursionInvite.findById({ _id: req.params.inviteId });

        if (!invite) {
            return res.status(404).send("Requested resource not found.");
        }

        const filter = { _id: invite._id };

        const pipeline = ExcursionInvite.aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: "users",
                    foreignField: "_id",
                    localField: "sender",
                    pipeline: [
                        {
                            $project: {
                                "_id": 1,
                                "userName": 1,
                                "firstName": 1,
                                "lastName": 1,
                                "email": 1,
                            }
                        }
                    ],
                    as: "sender",
                }
            },
            { $unwind: "$sender" },
            {
                $lookup: {
                    from: "users",
                    foreignField: "_id",
                    localField: "receiver",
                    pipeline: [
                        {
                            $project: {
                                "_id": 1,
                                "userName": 1,
                                "firstName": 1,
                                "lastName": 1,
                                "email": 1,
                            }
                        }
                    ],
                    as: "receiver",
                }
            },
            { $unwind: "$receiver" },
            {
                $lookup: {
                    from: "excursions",
                    foreignField: "_id",
                    localField: "excursion",
                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                foreignField: "_id",
                                localField: "host",
                                as: "host"
                            }
                        },
                        { $unwind: "$host" },
                        {
                            $lookup: {
                                from: "users",
                                foreignField: "_id",
                                localField: "participants",
                                as: "participants"
                            }
                        },
                        {
                            $lookup: {
                                from: "trips",
                                foreignField: "_id",
                                localField: "trips",
                                pipeline: [
                                    {
                                        $lookup: {
                                            from: "users",
                                            foreignField: "_id",
                                            localField: "host",
                                            as: "host"
                                        }
                                    },
                                    { $unwind: "$host" },
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
                                ],
                                as: "trips"
                            }
                        },
                        {
                            $project: {
                                "_id": 1,
                                "name": 1,
                                "description": 1,
                                "trips": 1,

                                "host._id": 1,
                                "host.userName": 1,
                                "host.firstName": 1,
                                "host.lastName": 1,
                                "host.email": 1,

                                "participants._id": 1,
                                "participants.userName": 1,
                                "participants.firstName": 1,
                                "participants.lastName": 1,
                                "participants.email": 1,
                            }
                        }
                    ],
                    as: "excursion",
                }
            },
            { $unwind: "$excursion" },
            {
                $project: {
                    "_id": 1,
                    "sender": 1,
                    "receiver": 1,
                    "excursion": 1,
                    "isAccepted": 1,
                }
            }
        ]);

        invite = await pipeline.exec();

        if (!invite) {
            return res.status(404).send("Requested resource not found.");
        }

        return res.status(200).send({ invite });
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server encountered an unexpected error. Please try again.");
    }
});

/**
 *  Update Excursion Invite by Id
 *  [docs link]
 */
router.patch('/share/excursions/:inviteId', auth, payload(permittedExcursionInviteFields), async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.inviteId)) {
            return res.status(400).send("Invalid Id");
        }

        const invite = await ExcursionInvite.findById({ _id: req.params.inviteId });

        if (!invite) {
            return res.status(404).send("Requested resource not found.");
        }

        if (!invite.receiver.equals(req.user._id)) {
            return res.status(403).send("Forbidden");
        }

        // NOTE: Only 'isAccepted' can be modified using this endpoint.
        invite.isAccepted = req.payload.isAccepted;
        await invite.save();

        if (invite.isAccepted) {
            await User.updateOne(
                { _id: invite.receiver },
                { $push: { excursions: invite.excursion } }
            );

            await Excursion.updateOne(
                { _id: invite.excursion },
                { $push: { participants: invite.receiver } }
            );
        }

        // NOTE: Regardless of the value of `isAccepted` we will delete this invite.
        await invite.deleteOne();

        return res.status(204).send();
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server encountered an unexpected error. Please try again.");
    }
});

/**
 *  Delete Excursion Invite
 *  [docs link]
 */
router.delete('/share/excursions/:inviteId', auth, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.inviteId)) {
            return res.status(400).send("Invalid Id.");
        }

        const invite = await ExcursionInvite.findById({ _id: req.params.inviteId });

        if (!invite) {
            return res.status(404).send("Requested resource not found.");
        }

        if (!invite.sender.equals(req.user._id)) {
            return res.status(403).send("Forbidden.");
        }

        await invite.deleteOne();

        return res.status(204).send();
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server encountered an unexpected error. Please try again.");
    }
});

// ------------------------- //
// #endregion                //
// ------------------------- //

// NOTE: An array of additional permitted fields on the `Excursion Schema` that can be modified through a request body payload (i.e, Create/Update, etc).
const permittedSharedExcursionFields = [
    'participant'
];

// ------------------------------------ //
// #region Shared Excursion Management  //
// ------------------------------------ //

/**
 *  Remove Participant By Id
 *  [docs link]
 */
router.delete('/excursion/participants/:excursionId', auth, payload(permittedSharedExcursionFields), async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.excursionId)) {
            return res.status(400).send("Invalid Id.");
        }

        let excursion = await Excursion.findById({ _id: req.params.excursionId });

        if (!excursion) {
            return res.status(404).send("Requested resource not found.");
        }

        const participant = await User.findById({ _id: req.payload.participant });

        if (!participant) {
            return res.status(404).send("Requested resource not found.");
        }

        if (excursion.host.equals(req.user._id)) {
            if (participant._id.equals(req.user._id)) {
                return res.status(403).send("Forbidden.");
            }

            await Excursion.updateOne(
                { _id: req.params.excursionId },
                { $pull: { participants: participant._id } }
            );

            await User.updateOne(
                { _id: participant._id },
                { $pull: { excursions: excursion._id } }
            );

            const filter = { _id: excursion._id };

            const pipeline = Excursion.aggregate([
                { $match: filter },
                {
                    $lookup: {
                        from: "trips",
                        foreignField: '_id',
                        localField: "trips",
                        as: "trips"
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        foreignField: "_id",
                        localField: "host",
                        as: "host",
                    }
                },
                { $unwind: "$host" },
                {
                    $lookup: {
                        from: "users",
                        foreignField: "_id",
                        localField: "participants",
                        as: "participants",
                    }
                },
                {
                    $project: {
                        "name": 1,
                        "description": 1,
                        "isComplete": 1,
                        "createdAt": 1,
                        "updatedAt": 1,

                        "trips._id": 1,
                        "trips.name": 1,
                        "trips.description": 1,
                        "trips.park": 1,
                        "trips.campground": 1,
                        "trips.activities": 1,
                        "trips.thingstodo": 1,
                        "trips.startDate": 1,
                        "trips.endDate": 1,

                        "host._id": 1,
                        "host.userName": 1,
                        "host.firstName": 1,
                        "host.lastName": 1,
                        "host.email": 1,

                        "participants._id": 1,
                        "participants.userName": 1,
                        "participants.firstName": 1,
                        "participants.lastName": 1,
                        "participants.email": 1,
                    }
                },
            ]);

            excursion = await pipeline.exec();

            return res.status(200).send({ excursion });
        } else {
            if (!participant._id.equals(req.user._id)) {
                return res.status(403).send("Forbidden.");
            }

            await Excursion.updateOne(
                { _id: req.params.excursionId },
                { $pull: { participants: req.user._id } }
            );

            await User.updateOne(
                { _id: req.user._id },
                { $pull: { excursions: excursion._id } }
            );

            return res.status(204).send();
        }
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server encountered an unexpected error. Please try again.");
    }
});

// ------------------------------------ //
// #endregion                           //
// ------------------------------------ //