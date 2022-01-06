const axios = require("axios").default;
const { MongoClient } = require("mongodb");

const mongoURI = process.env.MONGO_CONNECTION_STRING;
const client = new MongoClient(mongoURI);

// amazon cognito identity needs fetch
require('cross-fetch/polyfill');
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');

const oauth = {
    refreshToken: null,
    idToken: null
};

/** @returns {Promise<AmazonCognitoIdentity.CognitoUserSession>} */
function cognitoLogin() {
    const authenticationData = {
        Username: process.env.COGNITO_USERNAME,
        Password: process.env.COGNITO_PASSWORD,
    };
    const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);
    const poolData = {
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        ClientId: process.env.COGNITO_CLIENT_ID,
    };
    const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    const userData = {
        Username: process.env.COGNITO_USERNAME,
        Pool: userPool,
    };
    const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

    return new Promise((res, rej) => {
        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: function (result) {
                res(result);
            },
            onFailure: function (err) {
                console.error(err);
                rej();
            }
        });
    })
}

module.exports = async function (context, req) {

    const { uuids = "[]" } = req.query;

    let parsedUuids;
    try {
        parsedUuids = JSON.parse(decodeURIComponent(uuids));
        if (parsedUuids instanceof Array == false || parsedUuids.length == 0) {
            throw new Error();
        }
    } catch (e) {
        context.res = {
            body: "Bad or invalid uuids parameter"
        };
        return;
    }

    const uuidsToAccount = parsedUuids.reduce((acc, curr) => {
        acc[curr] = {};
        return acc;
    }, {});

    let error = {
        hadError: false,
        message: ""
    };

    // see if the account ids already exist
    try {
        await client.connect();
        const database = client.db(process.env.MONGO_DB_NAME);
        const users = database.collection("users");
        const oauthCollection = database.collection("oauth");

        const cursor = await users.find({
            "uuid": {
                "$in": parsedUuids
            }
        });

        /** @param session {AmazonCognitoIdentity.CognitoUserSession} */
        async function updateTokens(idToken, refreshToken) {
            oauth.idToken = idToken;
            oauth.refreshToken = refreshToken;
            await oauthCollection.updateOne({ "id": "tokens" }, { $set: { "idToken": idToken, "refreshToken": refreshToken } }, { upsert: true });
            return;
        }

        function getNewToken() {
            return new Promise((resolve, reject) => {
                axios.post(process.env.TOKEN_ENDPOINT,
                    {
                        "ClientId": process.env.API_CLIENT_ID,
                        "AuthFlow": "REFRESH_TOKEN_AUTH",
                        "AuthParameters": { "REFRESH_TOKEN": oauth.REFRESH_TOKEN }
                    },
                    {
                        headers: {
                            "accept-encoding": "gzip",
                            "connection": "Keep-Alive",
                            "content-type": "application/x-amz-json-1.1",
                            "x-amz-target": "AWSCognitoIdentityProviderService.InitiateAuth",
                            "x-amz-user-agent": "aws-amplify/0.1.x react-native"
                        },
                    }
                ).then(async result => {
                    oauth.token = result.data.AuthenticationResult.IdToken
                    await updateTokens(session.getIdToken().getJwtToken(), oauth.refreshToken).then(resolve)
                    resolve();
                }).catch(err => {
                    // try to log in again to reobtain refresh token
                    cognitoLogin().then(session => {
                        updateTokens(session.getIdToken().getJwtToken(), session.getRefreshToken().getToken()).then(resolve)
                    }).catch(reject)
                });
            });
        }

        const promises = [];
        const databaseUpdates = [];

        // the users that have a puuid stored already
        await cursor.forEach(({ uuid, puuid }) => {
            uuidsToAccount[uuid].puuid = puuid;
            promises.push(new Promise((resolve, reject) => {
                axios.get(`https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}?api_key=${process.env.RIOT_API_KEY}`).then(({
                    data: {
                        name
                    }
                }) => {
                    uuidsToAccount[uuid].summonerName = name;
                    resolve();
                }).catch(err => {
                    reject(err);
                });
            }));
        });

        const untrackedAccounts = Object.entries(uuidsToAccount).reduce((acc, [uuid, { puuid }]) => {
            if (puuid === undefined) {
                acc.push(uuid);
            }
            return acc;
        }, []);

        if (untrackedAccounts.length > 0) {
            const cachedTokenResult = await oauthCollection.findOne({ "id": "tokens" });
            if (!cachedTokenResult) {
                const session = await cognitoLogin();
                await updateTokens(session.getIdToken().getJwtToken(), session.getRefreshToken().getToken());
            } else {
                oauth.idToken = cachedTokenResult.idToken;
                oauth.refreshToken = cachedTokenResult.refreshToken;
            }

            function uuidToSummonerName(uuid, retries) {
                return new Promise((resolve, reject) => {
                    if (retries < 0) {
                        reject("failed to get token")
                    }
                    axios.get(`${process.env.API_GATEWAY_BASE_URL}/production/tournament-service/users/${uuid}/video-games/LOL`, {
                        headers: {
                            "Authorization": `Bearer ${oauth.idToken}`,
                            "accept": "application/json, text/plain, */*",
                            "accept-encoding": "gzip"
                        }
                    }).then(async ({ data, status }) => {
                        if (status == 200) {
                            resolve(data);
                        } else {
                            await getNewToken();
                            resolve(uuidToSummonerName(uuid, retries - 1));
                        }
                    }).catch(async (err) => {
                        console.log(err);
                        await getNewToken();
                        resolve(uuidToSummonerName(uuid, retries - 1));
                    })
                });
            }

            // do this code sequentially because each request could
            // update the global scoped oauth token for the next promise
            for (const uuid of untrackedAccounts) {
                const name = await uuidToSummonerName(uuid, 1);
                uuidsToAccount[uuid].summonerName = name;
                // update the database with the puuid afterwards
                databaseUpdates.push({ uuid, name });
            }
        }

        await Promise.all(promises);

        // finally form the http redirect with the values in uuidsToAccount map
        const summoners = Object.values(uuidsToAccount).map(({ summonerName }) => summonerName);
        context.res.status(302)
            .set('location', `https://na.op.gg/multi/query=${encodeURIComponent(summoners.join(", "))}`)
            .send();


        if (databaseUpdates.length > 0) {
            // fetch my account Id and store into mongodb
            const results = await Promise.all(databaseUpdates.map(({ uuid, name }) => new Promise(async (res, rej) => {
                try {
                    const { data: { puuid } } = await axios.get(`https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(name)}?api_key=${process.env.RIOT_API_KEY}`);
                    uuidsToAccount[uuid].puuid = puuid;
                    res({ uuid, puuid });
                } catch (err) {
                    rej(err);
                }
            })));
            await users.insertMany(results)
        }

    } catch (err) {
        error = { hadError: true, message: err };
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }

    if (error.hadError == true) {
        context.res = {
            body: "Error obtaining summoner names\n" + error.message
        };
        return;
    }
};