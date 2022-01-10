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
        const amountString = "" + tournament.totalPrizePool.amount;
        const prizeAmount = amountString.slice(0, -2) + "." + amountString.slice(-2);
        return {
            ...tournament,
            dateTime: new Date(tournament.startDate).getTime(),
            datePart: moment(new Date(tournament.startDate)).tz('America/Los_Angeles').format('dddd, MMM DD'),
            timePart: moment(new Date(tournament.startDate)).tz('America/Los_Angeles').format('hh:mm A'),
            prize: tournament.totalPrizePool.type == 'cash' ? "$" + prizeAmount : prizeAmount + " credits"
        }
    })
    
    tournaments.sort((t1, t2) => {
        if (t1.dateTime < t1.dateTime) {
            return -1
        } else if (t1.dateTime == t2.dateTime) {
            return t1.name.localeCompare(t2.name);
        } else {
            return 1;
        }
    });

    const responseText = await ejs.renderFile(path.resolve(__dirname, "index.ejs"), { tournaments }); 

    context.res = {
        headers: {
            "Content-Type": "text/html"
        },
        body: responseText
    };
}