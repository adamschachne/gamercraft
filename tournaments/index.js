const rockset = require("rockset").default(process.env.API_KEY, "https://api.rs2.usw2.rockset.com");
const ejs = require("ejs");
const moment = require("moment-timezone");
const fs = require("fs");
const path = require("path");

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    const response = await rockset.queryLambdas.executeQueryLambda(
        /* workspace */ "commons",
        /* queryName */ "GetFutureTournaments",
        /* version */ "2ec32e30c5836a6f"
    );

    const { results } = response;

    const tournaments = results.map(tournament => {
        return {
            ...tournament,
            datePart: moment(new Date(tournament.startDate)).tz('America/Los_Angeles').format('dddd, MMM DD'),
            timePart: moment(new Date(tournament.startDate)).tz('America/Los_Angeles').format('hh:mm A'),
            prize: tournament.totalPrizePool.type == 'cash' ? "$" + tournament.totalPrizePool.amount : tournament.totalPrizePool.amount + " credits"
        }
    })
    
    const responseText = await ejs.renderFile(path.resolve(__dirname, "index.ejs"), { tournaments }); 

    context.res = {
        headers: {
            "Content-Type": "text/html"
        },
        body: responseText
    };
}