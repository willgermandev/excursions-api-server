import mongoose from "mongoose";
import express from "express";
import { User } from "../models/user.js";
import { auth } from "../middleware/auth.js";
import { payload } from "../middleware/payload.js";

export const router = new express.Router();

// NOTE: An array of permitted fields on the `User Schema` that can be modified through a request body payload (i.e, Create/Update, etc).
const permittedUserFields = [
    'userName',
    'firstName',
    'lastName',
    'email',
    'password',
];

// ----------------------- //
// #region User Management //
// ----------------------- //

/**
 *  Create User
 *  [docs link]
 */
router.post('/user', payload(permittedUserFields), async (req, res) => {
    try {
        const user = new User(req.payload);
        await user.save();

        const token = await user.generateAuthToken();

        return res.status(201).send({ user, token });
    } catch (error) {
        console.log(error);

        /**
         *  11000 is MongoDB's DuplicateKey error code.
         *  https://www.mongodb.com/docs/manual/reference/error-codes/
         */
        if (error.code === 11000) {
            return res.status(400).send("Unable to create a new user.");
        }

        return res.status(500).send("Server encountered an unexpected error. Please try again.");
    }
});

/**
 *  Get User
 *  [docs link]
 */
router.get("/user", auth, async (req, res) => {
    try {
        const user = req.user;
        return res.status(200).send({ user });
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server encountered an unexpected error. Please try again.");
    }
});

/**
 *  Get User By Id
 *  [docs link]
 */
router.get('/user/:userId', auth, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.userId)) {
            return res.status(400).send("Invalid Id");
        }

        const user = await User.findOne(
            { _id: req.params.userId },
            {
                _id: 1,
                userName: 1,
                firstName: 1,
                lastName: 1,
                email: 1,
            }
        );

        if (!user) {
            return res.status(404).send("Requested resource not found.");
        }

        return res.status(200).send({ user });
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server encountered an unexpected error. Please try again.");
    }
});

/**
 *  Get Users By Keywords
 *  [docs link]
 */
router.get('/users', auth, async (req, res) => {
    try {
        // NOTE: req.query.keywords may need to be better handled (i.e., destructured) to be better used as a search tool.

        // TODO: Update keywords to be a delimited list of terms that are searched on individually and return results (add only unique items to new list that is returned as endpoint response).
        let filter = {};
        if (req.query.keywords) {
            filter = {
                $or: [
                    { userName: { $regex: req.query.keywords, $options: 'i' } },
                    { firstName: { $regex: req.query.keywords, $options: 'i' } },
                    { lastName: { $regex: req.query.keywords, $options: 'i' } }
                ]
            };
        }

        const users = await User.find(
            filter,
            {
                _id: 1,
                userName: 1,
                firstName: 1,
                lastName: 1,
                email: 1,
            }
        )
            .skip(parseInt(req.query.start))
            .limit(parseInt(req.query.limit));

        if (!users) {
            res.status(404).send("Requested resource not found.");
        }

        return res.status(200).send({ users });
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server encountered an unexpected error. Please try again.");
    }
});

/**
 *  Update User
 *  [docs link]
 */
router.patch('/user', auth, payload(permittedUserFields), async (req, res) => {
    try {
        const user = req.user;

        const props = Object.keys(req.payload);
        props.forEach((prop) => user[prop] = req.payload[prop]);

        await user.save();

        return res.status(200).send({ user });
    } catch (error) {
        console.log(error);

        /**
         *  11000 is MongoDB's DuplicateKey error code.
         *  https://www.mongodb.com/docs/manual/reference/error-codes/
         */
        if (error.code === 11000) {
            return res.status(400).send("Unable to update user.");
        }

        // TODO: Check different types of MongoDB Error codes and determine when to send a res.status(500) versus a res.status(400)
        return res.status(400).send("Unable to update user.");

        // return res.status(500).send("Server encountered an unexpected error. Please try again.");
    }
});

/**
 *  Delete User
 *  [docs link]
 */
router.delete('/user', auth, async (req, res) => {
    try {
        await User.deleteOne(
            { _id: req.user._id }
        );

        return res.status(204).send();
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server encountered an unexpected error. Please try again.");
    }
});

// ----------------------- //
// #endregion              //
// ----------------------- //

// --------------------------- //
// #region User Authentication //
// --------------------------- //

/**
 *  Sign In
 *  [docs link]
 */
router.post('/user/sign-in', payload(permittedUserFields), async (req, res) => {
    try {
        const user = await User.findByCredentials(
            req.payload.email,
            req.payload.password
        );

        const token = await user.generateAuthToken();

        return res.status(200).send({ user, token });
    } catch (error) {
        // TODO: Update to return a 400 request when invalid credentials are given and still accept a 500.
        console.log(error);
        return res.status(400).send("Unable to authenticate user.");
        // return res.status(500).send("Server encountered an unexpected error. Please try again.");
    }
});

/**
 *  Sign Out
 *  [docs link]
 */
router.post("/user/sign-out", auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;
        });
        await req.user.save();

        return res.status(204).send();
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server encountered an unexpected error. Please try again.");
    }
});

// --------------------------- //
// #endregion                  //
// --------------------------- //