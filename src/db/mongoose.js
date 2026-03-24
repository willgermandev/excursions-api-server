import mongoose from "mongoose";

console.log(`Connecting to ${process.env.MONGODB_URL}`);

mongoose.connect(process.env.MONGODB_URL)
    .then(() => {
        console.log('Connection to database successful.');
    })
    .catch((error) => {
        console.log('Error: ' + error);
    });