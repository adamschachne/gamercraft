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
        sql: { query: `SELECT t.* FROM commons.dynamodb_tournaments t WHERE t.tournamentUuid='${tournamentUuid}' AND _tp='TournamentTeamEntry'` }
    });

    const { results: teams } = response;

    let responseText = "";

    for ({ members: teamMembers, name: teamName } of teams) {
        let summoners = [];
        teamMembers.forEach(member => {
            summoners.push(member.gameUsername);
        });

        responseText += `<a href="https://na.op.gg/multi/query=${encodeURIComponent(summoners.join(", "))}">${teamName}</a></br>\n`;
    }

    context.res = {
        headers: {
            "Content-Type": "text/html"
        },
        // status: 200, /* Defaults to 200 */
        body: responseText
    };
}