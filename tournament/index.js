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

    teams.sort((team1, team2) => team1.name.localeCompare(team2.name));
    const paidTeams = [];
    const unpaidTeams = [];
    teams.forEach(team => {
        if (team.status && team.status == "AWAITING_PAYMENT") {
            unpaidTeams.push(team);
        } else {
            paidTeams.push(team);
        }
    });

    responseText += `<script>

        function getQueryVariable(variable) {
            var query = location.search.substring(1);
            var vars = query.split('&');
            for (var i = 0; i < vars.length; i++) {
                var pair = vars[i].split('=');
                if (decodeURIComponent(pair[0]) == variable) {
                    return decodeURIComponent(pair[1]);
                }
            }
            return "";
        }

        var code = getQueryVariable("code");
        document.addEventListener("DOMContentLoaded", function () {
            document.querySelectorAll('a').forEach(node => {
                const teamUuids = node.getAttribute("data-uuids");
                const teamOpggUrl = 'teamopgg?' + (code !== "" ? \`code=\${encodeURIComponent(code)}&\` : "") + \`uuids=\${teamUuids}\`;
                node.setAttribute("href", teamOpggUrl);
            });
        });
        </script>
    `;

    for ({ members: teamMembers, name: teamName } of paidTeams) {
        responseText += `<a data-uuids="${encodeURIComponent(JSON.stringify(teamMembers.map(member => member.userUuid)))}">${teamName}</a></br>\n`;
    }

    responseText += "<br/>";
    responseText += `<h3 style="margin-bottom: 10px;">Unpaid Teams</h3>`;
    for ({ members: teamMembers, name: teamName } of unpaidTeams) {
        responseText += `<a data-uuids="${encodeURIComponent(JSON.stringify(teamMembers.map(member => member.userUuid)))}">${teamName}</a></br>\n`;
    }

    context.res = {
        headers: {
            "Content-Type": "text/html"
        },
        // status: 200, /* Defaults to 200 */
        body: responseText
    };
}