const rockset = require("rockset").default(process.env.API_KEY, "https://api.rs2.usw2.rockset.com");
const moment = require("moment");

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    const response = await rockset.queryLambdas.executeQueryLambda(
        /* workspace */ "commons",
        /* queryName */ "GetFutureTournaments",
        /* version */ "2ec32e30c5836a6f"
    );

    const { results } = response;

    const responseText = `
        <!DOCTYPE html>
        <html>
            <head>
            <script>
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
                
                document.addEventListener("DOMContentLoaded", function() {
                    document.querySelectorAll('.spots').forEach(node => {
                        const uuid = node.getAttribute("data-uuid");
                        const opggUrl = 'tournamentopgg?' + (code !== "" ? \`code=\${encodeURIComponent(code)}&\` : "") + \`tournamentUuid=\${uuid}\`;
                        console.log(node.setAttribute("href", opggUrl));
                    })
                });
            </script>
            </head>
            <body>
                ${results.map(tournament => {
                    const datePart = moment(new Date(tournament.startDate)).format('dddd, MMM DD');
                    const timePart = moment(new Date(tournament.startDate)).format('hh:mm A');
                    return `<div>${datePart} @ ${timePart} -- ${tournament.name} -- <a data-uuid="${tournament.uuid}" class="spots">spots filled: ${tournament.spotsFilled}</a></div>`;
                }).join("\n")}
            </body>
        </html>
        `;

    context.res = {
        headers: {
            "Content-Type": "text/html"
        },
        body: responseText
    };
}