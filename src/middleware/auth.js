import jwt from "jsonwebtoken";
import { User } from "../models/user.js";

export const auth = async (req, res, next) => {
    try {
        let token = req.header('Authorization');
        token = token.replace('Bearer ', '');

        const decoded = jwt.verify(token, process.env.JSON_WEB_TOKEN_SECRET);

        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });

        if (!user) {
            return res.status(400).send("Bad Request");
        }

        req.token = token;
        req.user = user;

        next();
    } catch (error) {
        console.log(error);
        return res.status(401).send("Authentication required. Please provide a valid access token.");
    }
};