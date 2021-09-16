let tournamentUuid = '62560b56-2714-4750-95a7-c0cc0782b7cf';
const uuidRegex = /\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b/;

if (uuidRegex.test(tournamentUuid) != true) {
  return;
}

const rockset = require("rockset").default(process.env.API_KEY, "https://api.rs2.usw2.rockset.com");

(async function() {
  const response = await rockset.queries.query({
    sql: { query: `SELECT t.* FROM commons.dynamodb_tournaments t WHERE t.tournamentUuid='${tournamentUuid}' AND _tp='TournamentTeamEntry'` }
  });

  const { results: teams } = response;

  for ({ members: teamMembers, name: teamName } of teams) {
    let summoners = [];
    teamMembers.forEach(member => {
      summoners.push(member.gameUsername);
    });
    console.log(`${teamName}\thttps://na.op.gg/multi/query=${encodeURIComponent(summoners.join(", "))}\n`);
  }
})()
