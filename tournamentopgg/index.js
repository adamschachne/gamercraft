const axios = require("axios").default;
const rockset = require("rockset").default(process.env.API_KEY, "https://api.rs2.usw2.rockset.com");
const uuidRegex = /\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b/;

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    const { tournamentUuid } = req.query;
    if (uuidRegex.test(tournamentUuid) != true) {
        context.res = {
            body: "Bad or invalid tournamentUuid"
        };
        return;
    }

    const response = await rockset.queries.query({
        sql: {
            query: `SELECT
                        t.*, t2.gameUsername
                    FROM
                        commons.dynamodb_tournaments t
                    LEFT JOIN dynamodb_tournaments t2
                    ON t.userUuid = t2.userUuid and t2._et='GamerProfile'
                    WHERE
                        t.tournamentUuid='${tournamentUuid}'`
        }
    });

    let responseText = "";
    const users = {};
    const teams = [];

    // store members into a map
    for (let result of response.results) {
        switch (result["_et"]) {
            case "TournamentTeamUserEntry": {
                users[result["userUuid"]] = result;
                break;
            }
            case "TournamentTeamEntry": {
                teams.push(result);
                break;
            }
        }
    }

    for ({ members: teamMembers, name: teamName } of teams) {
        const requests = [];
        teamMembers.forEach(member => {
            const url = new URL(`production/tournament-service/users/${member.userUuid}/video-games/LOL/regions/NA1`, process.env.API_GATEWAY_BASE_URL).href;
            requests.push(axios.get(url, {
                headers: {
                    "authorization": `Bearer ${process.env.API_BEARER_TOKEN}`
                }
            }));
        });
        const summoners = await Promise.all(requests);
        responseText += `<a href="https://na.op.gg/multi/query=${encodeURIComponent(summoners.map(summoner => summoner.data).join(", "))}">${teamName}</a></br>\n`;
    }

    context.res = {
        headers: {
            "Content-Type": "text/html"
        },
        // status: 200, /* Defaults to 200 */
        body: responseText
    };
}