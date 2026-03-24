export const payload = (permitted) => {

    if (!Array.isArray(permitted)) {
        throw new Error("Permitted fields must be an array.");
    }

    const isValid = permitted.every((field) => typeof field === "string");

    if (!isValid) {
        throw new Error("Permitted fields array must only contain strings.");
    }

    return async (req, res, next) => {
        try {
            if (Object.keys(req.body).length === 0) {
                return res.status(400).send("Missing or invalid payload.");
            }

            const props = Object.keys(req.body);

            const isValid = props.every((prop) => permitted.includes(prop));

            if (!isValid) {
                return res.status(400).send("Missing or invalid payload.");
            }

            let payload = {};
            props.forEach((prop) => payload[prop] = req.body[prop]);

            // TODO: Add additional layer of data validation here. This is also a good spot to sanitize the data prior to attempting any database operations.

            req.payload = payload;

            next();
        } catch {
            console.log(error);
            return res.status(500).send("Server encountered an unexpected error. Please try again.");
        }
    };
};