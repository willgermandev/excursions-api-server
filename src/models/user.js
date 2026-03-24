import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const Schema = mongoose.Schema;

const userSchema = new Schema({
    userName: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (validator.isEmpty(value)) {
                throw new Error('userName must not be empty.');
            }
        }
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (validator.isEmpty(value)) {
                throw new Error('firstName must not be empty.');
            }
        }
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (validator.isEmpty(value)) {
                throw new Error('lastName must not be empty.');
            }
        }
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid.');
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minLength: 8,
        validate(value) {
            const regex = new RegExp("[A-Za-z0-9]");

            if (!regex.test(value)) {
                throw new Error("password must contain at least one uppercase letter, lowercase letter, and number.");
            }
        }
    },
    trips: [{
        type: Schema.Types.ObjectId,
        ref: 'Trip',
        required: false,
    }],
    excursions: [{
        type: Schema.Types.ObjectId,
        ref: 'Excursion',
        required: false,
    }],
    excursionInvites: [{
        type: Schema.Types.ObjectId,
        ref: 'ExcursionInvite',
        required: false,
    }],
    friends: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false,
    }],
    friendRequests: [{
        type: Schema.Types.ObjectId,
        ref: 'FriendRequest',
        required: false,
    }],
    tokens: [{
        token: {
            type: String,
            required: false
        }
    }],
},
    { timestamps: true }
);

// --------------- //
// #region Methods //
// --------------- //

userSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();

    delete userObject.password;
    delete userObject.tokens;
    delete userObject.__v;

    return userObject;
};

userSchema.methods.generateAuthToken = async function () {
    const user = this;

    const token = jwt.sign({ _id: user._id.toString() }, process.env.JSON_WEB_TOKEN_SECRET);

    user.tokens = user.tokens.concat({ token });
    await user.save();

    return token;
};

// --------------- //
// #endregion      //
// --------------- //

// --------------- //
// #region Statics //
// --------------- //

// TODO: Update this to throw a particular error to be caught by the endpoint.
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email: email });

    if (!user) {
        throw new Error("Email or password is incorrect.");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw new Error("Email or password is incorrect.");
    }

    return user;
};

// --------------- //
// #endregion      //
// --------------- //

// ----------- //
// #region Pre //
// ----------- //

userSchema.pre('validate',
    { document: true, query: false },
    async function (next) {
        const user = this;

        // TODO: Write string checking function to match the percentage likeness between two strings. Use this hook to prevent users from creating  passwords that match or have too close likeness (>50%) to another field (userName, firstName, lastName, email).

        // NOTE: This method returns a boolean value that is determined by the likeness of 'string' to the current user.password field. If there is a greater than 50% likeness to the user.password field, a value of "true" is returned.

        next();
    });

userSchema.pre('save',
    { document: true, query: false },
    async function (next) {
        const user = this;

        if (user.isModified('password')) {
            user.password = await bcrypt.hash(user.password, 8);
        }

        next();
    });


userSchema.pre('deleteOne',
    { document: true, query: false },
    async function (next) {
        const user = this;

        await mongoose.model('FriendRequest').deleteMany(
            {
                $or: [
                    { sender: user._id },
                    { receiver: user._id },
                ]
            }
        );

        // NOTE: Should NOT need to delete all friends from this user as once these operations are complete the user will be deleted.

        await mongoose.model('User').updateMany(
            { friends: user._id },
            { $pull: { friends: user._id } }
        );

        await mongoose.model('ExcursionInvite').deleteMany(
            {
                $or: [
                    { sender: user._id },
                    { receiver: user._id },
                ]
            }
        );

        await mongoose.model('Excursion').updateMany(
            { participants: user._id },
            { $pull: { participants: user._id } }
        );

        // TODO: Determine if this call can be safely deleted. It should already be handled by the above 'ExcursionInvite' deleteMany call.
        // await mongoose.model('Excursion').updateMany(
        //     { invitees: user._id },
        //     { $pull: { invitees: user._id } }
        // );

        await mongoose.mongo.model('Trip').deleteMany(
            { host: user._id }
        );

        await mongoose.model('Excursion').deleteMany(
            { host: user._id }
        );

        next();
    });

// ----------- //
// #endregion  //
// ----------- //

// ------------ //
// #region Post //
// ------------ //

// ------------ //
// #endregion   //
// ------------ //

export const User = mongoose.model('User', userSchema);