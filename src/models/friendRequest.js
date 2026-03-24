import mongoose from "mongoose";

const Schema = mongoose.Schema;

const friendRequestSchema = new Schema({
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    receiver: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    isAccepted: {
        type: Boolean,
        required: false,
        default: false,
    }
},
    { timestamps: true }
);

// --------------- //
// #region Methods //
// --------------- //

friendRequestSchema.methods.toJSON = function () {
    const request = this;
    const requestObject = request.toObject();

    delete requestObject.__v;

    return requestObject;
};

// --------------- //
// #endregion      //
// --------------- //

// --------------- //
// #region Statics //
// --------------- //

// --------------- //
// #endregion      //
// --------------- //

// ----------- //
// #region Pre //
// ----------- //

friendRequestSchema.pre('save',
    { document: true, query: false },
    async function (next) {
        const request = this;

        if (request.isNew) {
            await mongoose.model('User').updateMany(
                {
                    _id: {
                        $in: [
                            request.sender,
                            request.receiver
                        ]
                    }
                },
                { $push: { friendRequests: request._id } }
            );
        }

        next();
    });

friendRequestSchema.pre('deleteOne',
    { document: true, query: false },
    async function (next) {
        const request = this;

        await mongoose.model('User').updateMany(
            {
                _id: {
                    $in: [
                        request.sender,
                        request.receiver
                    ]
                }
            },
            { $pull: { friendRequests: request._id } }
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

export const FriendRequest = mongoose.model('FriendRequest', friendRequestSchema);