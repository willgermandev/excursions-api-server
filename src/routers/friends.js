import mongoose from "mongoose";
import express, { request } from "express";
import { FriendRequest } from "../models/friendRequest.js";
import { User } from "../models/user.js";
import { auth } from "../middleware/auth.js";
import { payload } from "../middleware/payload.js";

export const router = new express.Router();

// NOTE: An array of permitted fields on the `FriendRequest Schema` that can be modified through a request body payload (i.e, Create/Update, etc).
const permittedFriendRequestFields = [
    'receiver',
    'isAccepted',
];

// ----------------------- //
// #region Friend Requests //
// ----------------------- //

/**
 *  Create Friend Request
 *  [docs link]
 */
router.post('/friends/requests/:userId', auth, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.userId)) {
            return res.status(400).send("Invalid Id.");
        }

        const receiver = await User.findById({ _id: req.params.userId });

        if (!receiver) {
            return res.status(404).send("Requested resource not found.");
        }

        if (req.user.friends.includes(receiver._id)) {
            return res.status(409).send("Unable to create friend request.");
        }

        let request = await FriendRequest.exists(
            {
                $and: [
                    { sender: req.user._id },
                    { receiver: receiver._id },
                ]
            },
        );

        if (request) {
            return res.status(409).send("Unable to create friend request.");
        }

        request = new FriendRequest({
            "sender": req.user._id,
            "receiver": receiver._id
        });

        await request.save();

        const filter = { _id: request._id };

        const pipeline = FriendRequest.aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: "users",
                    foreignField: "_id",
                    localField: "sender",
                    as: "sender"
                }
            },
            {
                $lookup: {
                    from: "users",
                    foreignField: "_id",
                    localField: "receiver",
                    as: "receiver"
                }
            },
            {
                $project: {
                    "_id": 1,
                    "isAccepted": 1,

                    "sender._id": 1,
                    "sender.userName": 1,
                    "sender.firstName": 1,
                    "sender.lastName": 1,
                    "sender.email": 1,

                    "receiver._id": 1,
                    "receiver.userName": 1,
                    "receiver.firstName": 1,
                    "receiver.lastName": 1,
                    "receiver.email": 1,
                }
            }
        ]);

        request = await pipeline.exec();

        return res.status(201).send({ request });
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server encountered an unexpected error. Please try again.");
    }
});

/**
 *  Get Friend Requests By User
 *  [docs link]
 */
router.get('/friends/requests', auth, async (req, res) => {
    try {
        const filter = { _id: { $in: [...req.user.friendRequests] } };

        const pipeline = FriendRequest.aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: "users",
                    foreignField: "_id",
                    localField: "sender",
                    as: "sender"
                }
            },
            {
                $lookup: {
                    from: "users",
                    foreignField: "_id",
                    localField: "receiver",
                    as: "receiver"
                }
            },
            {
                $project: {
                    "_id": 1,
                    "isAccepted": 1,

                    "sender._id": 1,
                    "sender.userName": 1,
                    "sender.firstName": 1,
                    "sender.lastName": 1,
                    "sender.email": 1,

                    "receiver._id": 1,
                    "receiver.userName": 1,
                    "receiver.firstName": 1,
                    "receiver.lastName": 1,
                    "receiver.email": 1,
                }
            },
        ]);

        const requests = await pipeline.exec();

        if (!requests) {
            return res.status(404).send("Requested resource not found.");
        }

        const total = requests.length;

        return res.status(200).send({ total, requests });
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server encountered an unexpected error. Please try again.");
    }
});

/**
 *  Update Friend Request By Id
 *  [docs link]
 */
router.patch('/friends/requests/:requestId', auth, payload(permittedFriendRequestFields), async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.requestId)) {
            return res.status(400).send("Invalid Id");
        }

        let request = await FriendRequest.findById({ _id: req.params.requestId });

        if (!request) {
            return res.status(404).send("Requested resource not found.");
        }

        if (!request.receiver.equals(req.user._id)) {
            return res.status(403).send("Forbidden.");
        }

        const props = Object.keys(req.payload);
        props.forEach((prop) => request[prop] = req.payload[prop]);

        await request.save();

        if (req.payload.isAccepted) {
            await User.updateOne(
                { _id: request.sender },
                { $push: { friends: request.receiver } }
            );

            await User.updateOne(
                { _id: request.receiver },
                { $push: { friends: request.sender } }
            );
        }

        await request.deleteOne();

        return res.status(204).send();
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server encountered an unexpected error. Please try again.");
    }
});

/**
 *  Delete Friend Request
 *  [docs link]
 */
router.delete('/friends/requests/:requestId', auth, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.requestId)) {
            return res.status(400).send("Invalid Id.");
        }

        const request = await FriendRequest.findById({ _id: req.params.requestId });

        if (!request) {
            return res.status(404).send("Requested resource not found.");
        }

        if (!request.sender.equals(req.user._id)) {
            return res.status(403).send("Forbidden.");
        }

        await request.deleteOne();

        return res.status(204).send();
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server encountered an unexpected error. Please try again.");
    }
});

// ----------------------- //
// #endregion              //
// ----------------------- //

// ------------------------- //
// #region Friend Management //
// ------------------------- //

/**
 *  Get Friends By User
 *  [docs link]
 */
router.get('/friends', auth, async (req, res) => {
    try {
        const friends = await User.find(
            { _id: { $in: [...req.user.friends] } },
            {
                _id: 1,
                userName: 1,
                firstName: 1,
                lastName: 1,
                email: 1,
            }
        );

        if (!friends) {
            return res.status(404).send("Requested resource not found.");
        }

        const total = friends.length;

        return res.status(200).send({ total, friends });
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server encountered an unexpected error. Please try again.");
    }
});

/**
 *  Delete Friend
 *  [docs link]
 */
router.delete('/friends/:userId', auth, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.userId)) {
            return res.status(400).send("Invalid Id.");
        }

        if (!req.user.friends.includes(req.params.userId)) {
            return res.status(404).send("Requested resource not found.");
        }

        await User.updateOne(
            { _id: req.user._id },
            { $pull: { friends: req.params.userId } }
        );

        await User.updateOne(
            { _id: req.params.userId },
            { $pull: { friends: req.user._id } }
        );

        return res.status(204).send();
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server encountered an unexpected error. Please try again.");
    }
});

// ------------------------- //
// #endregion                //
// ------------------------- //