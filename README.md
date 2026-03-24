# USA National Park Excursions

A travel planning api service based around the United States National Parks.

<br/>

## Authors

- Will German ([@willgermandev](https://github.com/willgermandev))

<br/>

## License

[GNU Affero General Public License v3.0 (or later)](https://www.gnu.org/licenses/agpl-3.0.en.html)

Copyright (C) 2025 William S. German

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

<br/>

## API Protocol

1. [Excursions API Documentation](https://github.com/willgermandev/excursions-api-docs).
2. [National Park Service (NPS) API Documentation](https://www.nps.gov/subjects/developer/api-documentation.htm).

<br/>

## Features

- Accounts & Authentication
- Friends
- Excursions & Trips
- Invites & Sharing
- National Park Service (NPS) Integration

#### Coming Soon:

- Additional Data Validation
- User Input Sanitization
- Rate Limiting

<br/>

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file.

| Key                  | Description                                                |
| -------------------- | ---------------------------------------------------------- |
| PORT                 | The port on which the server will be run (locally).        |
| MONGODB_URL          | The MongoDB connection string that grants database access. |
| JSON_WEBTOKEN_SECRET | The shared secret used to sign and verify JSON Web Tokens. |
| NPS_API_URL          | The base URL for the NPS API service.                      |
| NPS_API_KEY          | The access key granted by NPS to use their API service.    |

<br/>

## Run Locally

All instructions below are written for MacOS/Unix systems. If you are on a different environment you must use the equivalent commands. These instructions assume you have already configured and deployed a MongoDB Cluster to use for this project.

#### 1. Clone the repository and change directories in to the project.

```
git clone git@github.com:willgermandev/excursions-api-server.git
cd ./excursions-api-server
```

#### 2. Install dependencies.

```
npm install
```

#### 3. Create .env file in the root directory and configure environment variables. See [Section: Environmnet Variables](#environment-variables) for required variables.

```
touch .env
```

#### 4. Run the server.

```
npm run dev
```
