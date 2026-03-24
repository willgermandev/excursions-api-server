import mongoose from "mongoose";

const Schema = mongoose.Schema;

const excursionInviteSchema = new Schema({
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
    excursion: {
        type: Schema.Types.ObjectId,
        ref: 'Excursion',
        required: true,
    },
    isAccepted: {
        type: Boolean,
        required: true,
        default: false,
    }
},
    { timestamps: true }
);

// --------------- //
// #region Methods //
// --------------- //

excursionInviteSchema.methods.toJSON = function () {
    const invite = this;
    const inviteObject = invite.toObject();

    delete inviteObject.__v;

    return inviteObject;
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

excursionInviteSchema.pre('save',
    { document: true, query: false },
    async function (next) {
        const invite = this;

        if (invite.isNew) {
            await mongoose.model('User').updateMany(
                {
                    _id: {
                        $in: [
                            invite.sender,
                            invite.receiver
                        ]
                    }
                },
                { $push: { excursionInvites: invite._id } }
            );

            await mongoose.model('Excursion').updateOne(
                { _id: invite.excursion },
                { $push: { invitees: invite.receiver } }
            );
        }

        next();
    }
);


excursionInviteSchema.pre('deleteOne',
    { document: true, query: false },
    async function (next) {
        const invite = this;

        await mongoose.model('Excursion').updateOne(
            { _id: invite.excursion },
            { $pull: { invitees: invite.receiver } }
        );

        await mongoose.model('User').updateMany(
            {
                _id: {
                    $in: [
                        invite.sender,
                        invite.receiver
                    ]
                }
            },
            { $pull: { excursionInvites: invite._id } }
        );

        next();
    });

// ----------- //
// #endregion  //
// ----------- //

// ------------ //
// #region Post //
// ------------ //

excursionInviteSchema.post('create', { document: true, query: false }, async function (next) {
    const invite = this;

    await mongoose.model('User').updateMany(
        {
            $or: [
                { _id: invite.sender },
                { _id: invite.receiver },
            ]
        },
        { $push: { excursionInvites: invite._id } }
    );

    await mongoose.model('Excursion').updateOne(
        { _id: invite.excursion },
        { $push: { invitees: invite.receiver } }
    );

    next();
});

// ------------ //
// #endregion   //
// ------------ //

export const ExcursionInvite = mongoose.model('ExcursionInvite', excursionInviteSchema);