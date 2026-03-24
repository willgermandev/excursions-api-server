import express from "express";
import { auth } from "../middleware/auth.js";
import { default as utils } from "url"; // maybe not the best naming convention here ¯ \_(ツ)_/¯  but it conflicted with my pre-existing 'url' variable(s).

const NPS_API_URL = process.env.NPS_API_URL;
const NPS_API_KEY = process.env.NPS_API_KEY;

export const router = new express.Router();

// -------------------- //
// #region Park Details //
// -------------------- //

/**
 *  Get National Parks
 *  [docs link]
 *  https://www.nps.gov/subjects/developer/api-documentation.htm#/parks/getPark
 */
router.get('/national-parks', auth, async (req, res) => {
    try {
        const endpoint = 'parks';
        let url = `${NPS_API_URL}/${endpoint}`;

        let options = {};
        let query = ``;

        if (req.query && Object.keys(req.query).length > 0) {
            query += `?${utils.parse(req.url, true).search}`;

            if (!req.query.limit) {
                query += `&limit=1`;
            }
        } else {
            query += `?limit=1`;
        }

        query += `&api_key=${NPS_API_KEY}`;

        if (query) {
            url += query;
        }

        let response = await fetch(url, options);

        if (response.ok) {
            if (response.status === 200) {
                const data = await response.json();
                return res.status(200).send(data);
            }
        } else {
            if (response.status === 400) {
                return res.status(400).send("Unable to retrieve the requested resource.");
            }

            // NOTE: Returns a 500 status to the client because the server exclusive NPS API key is invalid and there is nothing the client can do to fix this.
            if (response.status === 401) {
                console.log(response);
                return res.status(500).send("Server encountered an unexpected error. Please try again.");
            }

            // NOTE: Returns a 500 status to the client because the server is sending a malformed query to the NPS API and there is nothing the client can do to fix this.
            if (response.status === 403) {
                console.log(response);
                return res.status(500).send("Server encountered an unexpected error. Please try again.");
            }
        }
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server encountered an unexpected error. Please try again.");
    }
});

/**
 *  Get Campgrounds
 *  [docs link]
 *  https://www.nps.gov/subjects/developer/api-documentation.htm#/campgrounds
 */
router.get('/campgrounds', auth, async (req, res) => {
    try {
        const endpoint = 'campgrounds';
        let url = `${NPS_API_URL}/${endpoint}`;

        let options = {};
        let query = ``;

        if (req.query && Object.keys(req.query).length > 0) {
            query += `?${utils.parse(req.url, true).search}`;

            if (!req.query.limit) {
                query += `&limit=1`;
            }
        } else {
            query += `?limit=1`;
        }

        query += `&api_key=${NPS_API_KEY}`;

        if (query) {
            url += query;
        }

        let response = await fetch(url, options);

        if (response.ok) {
            if (response.status === 200) {
                const data = await response.json();
                return res.status(200).send(data);
            }
        } else {
            if (response.status === 400) {
                console.log(response);
                return res.status(400).send("Unable to retrieve the requested resource.");
            }

            // NOTE: Returns a 500 status to the client because the server exclusive NPS API key is invalid and there is nothing the client can do to fix this.
            if (response.status === 401) {
                console.log(response);
                return res.status(500).send("Server encountered an unexpected error. Please try again.");
            }

            // NOTE: Returns a 500 status to the client because the server is sending a malformed query to the NPS API and there is nothing the client can do to fix this.
            if (response.status === 403) {
                return res.status(500).send("Server encountered an unexpected error. Please try again.");
            }
        }
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server encountered an unexpected error. Please try again.");
    }
});

/**
 *  Get Activities
 *  [docs link]
 *  https://www.nps.gov/subjects/developer/api-documentation.htm#/activities/getActivities
 */
router.get('/activities', auth, async (req, res) => {
    try {
        const endpoint = 'activities';
        let url = `${NPS_API_URL}/${endpoint}`;

        let options = {};
        let query = ``;

        if (req.query && Object.keys(req.query).length > 0) {
            query += `?${utils.parse(req.url, true).search}`;

            if (!req.query.limit) {
                query += `&limit=1`;
            }
        } else {
            query += `?limit=1`;
        }

        query += `&api_key=${NPS_API_KEY}`;

        if (query) {
            url += query;
        }

        let response = await fetch(url, options);

        if (response.ok) {
            if (response.status === 200) {
                const data = await response.json();
                return res.status(200).send(data);
            }
        } else {
            if (response.status === 400) {
                return res.status(400).send("Unable to retrieve the requested resource.");
            }

            // NOTE: Returns a 500 status to the client because the server exclusive NPS API key is invalid and there is nothing the client can do to fix this.
            if (response.status === 401) {
                return res.status(500).send("Server encountered an unexpected error. Please try again.");
            }

            // NOTE: Returns a 500 status to the client because the server is sending a malformed query to the NPS API and there is nothing the client can do to fix this.
            if (response.status === 403) {
                return res.status(500).send("Server encountered an unexpected error. Please try again.");
            }
        }
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server encountered an unexpected error. Please try again.");
    }
});

/**
 *  Get Things To Do
 *  [docs link]
 *  https://www.nps.gov/subjects/developer/api-documentation.htm#/thingstodo/getThingstodo
 */
router.get('/things-to-do', auth, async (req, res) => {
    try {
        const endpoint = 'thingstodo';
        let url = `${NPS_API_URL}/${endpoint}`;

        let options = {};
        let query = ``;

        if (req.query && Object.keys(req.query).length > 0) {
            query += `?${utils.parse(req.url, true).search}`;

            if (!req.query.limit) {
                query += `&limit=1`;
            }
        } else {
            query += `?limit=1`;
        }

        query += `&api_key=${NPS_API_KEY}`;

        if (query) {
            url += query;
        }

        let response = await fetch(url, options);

        if (response.ok) {
            if (response.status === 200) {
                const data = await response.json();
                return res.status(200).send(data);
            }
        } else {
            if (response.status === 400) {
                return res.status(400).send("Unable to retrieve the requested resource.");
            }

            // NOTE: Returns a 500 status to the client because the server exclusive NPS API key is invalid and there is nothing the client can do to fix this.
            if (response.status === 401) {
                return res.status(500).send("Server encountered an unexpected error. Please try again.");
            }

            // NOTE: Returns a 500 status to the client because the server is sending a malformed query to the NPS API and there is nothing the client can do to fix this.
            if (response.status === 403) {
                return res.status(500).send("Server encountered an unexpected error. Please try again.");
            }
        }
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server encountered an unexpected error. Please try again.");
    }
});

// -------------------- //
// #endregion           //
// -------------------- //