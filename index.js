
const axios = require("axios").default;

let tournamentUuid = '62560b56-2714-4750-95a7-c0cc0782b7cf';
let date = new Date();

// go back 1 month for more data
date.setDate(date.getDate() + -30);

axios({
  url: `https://api.rs2.usw2.rockset.com/v1/orgs/self/ws/commons/lambdas/TestLambda/versions/7103beda26ada20f`,
  method: "POST",
  headers: {
    'authority': 'api.rs2.usw2.rockset.com',
    'sec-ch-ua': '"Chromium";v="92", " Not A;Brand";v="99", "Google Chrome";v="92"',
    'accept': 'application/json, text/javascript, */*; q=0.01',
    'dnt': '1',
    'authorization': 'ApiKey 46wxOgjedO07Vzn3VavzroAdzy3IWXqqr2UCx9DYNKHMLiH2kkYlyAu6CEf6EJSg',
    'sec-ch-ua-mobile': '?0',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36',
    'content-type': 'application/json',
    'origin': 'https://gamercraft.com',
    'sec-fetch-site': 'cross-site',
    'sec-fetch-mode': 'cors',
    'sec-fetch-dest': 'empty',
    'referer': 'https://gamercraft.com/',
    'accept-language': 'en-US,en;q=0.9'
  },
  // data: {
  //   'parameters': [
  //     {
  //       'name': 'date',
  //       'type': 'string',
  //       'value': date.toISOString()
  //     }
  //   ]
  // }
}).then(response => {
  const data = response.data;
  try {
    const teams = data.results.filter(t => t.tournamentUuid == tournamentUuid && t._tp == 'TournamentTeamEntry');
    for ({ members: teamMembers, name: teamName } of teams) {
      let summoners = [];
      teamMembers.forEach(member => {
        summoners.push(member.gameUsername);
      });
      console.log(`${teamName}\thttps://na.op.gg/multi/query=${encodeURIComponent(summoners.join(", "))}\n`);
    }
  }
  catch (err) {
    console.error(err);
  }
});


// for (var i = 0; i < teams.length; i++) {
//   let str = teams[i];
//   let team = JSON.parse("[" + str.substr(1, str.length - 2) + "]");
//   teams[i] = team;
// }
// for (members of teams) {
//   let summoners = [];
//   members.forEach(member => {
//     summoners.push(member.gameUsername);
//   });


//   console.log(`https://na.op.gg/multi/query=${encodeURIComponent(summoners.join(", "))}\n`);
// }



//   
// })

// let teams = [
//     `{{"displayName":"vokainodragon","gameUsername":"Vokainodragon","userUuid":"104e13b8-0e4c-4fba-b159-18a91125a13c","teamUuid":"940ae720-9009-11eb-84e2-fbe1d59dfa65","modified":"2021-03-28T21:17:19.307Z","type":"User","uuid":"104e13b8-0e4c-4fba-b159-18a91125a13c","role":"USER","defaultAvatarId":3.0,"encryptedGameUsername":"zGY2IhqGVvomu9hy_DG0TO7eNE8FqJSnVdF6U3vtl45Tf9w","created":"2021-03-28T21:17:19.307Z","email":"xxcreperninjaxx@gmail.com"},{"displayName":"ChumTheWat3rs","gameUsername":"ChumTheWat3rs","userUuid":"75f0b05b-e178-47f5-9f9e-9f2b92bc09fc","teamUuid":"940ae720-9009-11eb-84e2-fbe1d59dfa65","phoneNumber":"+17187082472","modified":"2021-07-20T18:18:28.199Z","type":"User","uuid":"75f0b05b-e178-47f5-9f9e-9f2b92bc09fc","role":"USER","defaultAvatarId":0.0,"encryptedGameUsername":"JqHgZNx_crcxhHPjZmKcQ3y6V-RLbUtJHA9bWNWM15phx4mG","created":"2021-07-20T18:18:28.198Z","email":"ikindalikemoney@gmail.com"},{"displayName":"22smasher","gameUsername":"house maid","userUuid":"7eb25cb4-233c-406c-9c9a-491d45538e3e","teamUuid":"940ae720-9009-11eb-84e2-fbe1d59dfa65","modified":"2021-03-28T21:13:48.832Z","type":"User","uuid":"7eb25cb4-233c-406c-9c9a-491d45538e3e","role":"USER","defaultAvatarId":4.0,"encryptedGameUsername":"0yi6_v-oda-szuBRtdph9jBeY5yFSZP5QPOnwaMxlI49ImA","created":"2021-03-28T21:13:48.832Z","email":"williamlo25570@gmail.com"},{"displayName":"Credhits","gameUsername":"credhitss","userUuid":"af9135bc-a51a-47c2-aed4-8b87c10d3ac5","teamUuid":"940ae720-9009-11eb-84e2-fbe1d59dfa65","phoneNumber":"9178735995","modified":"2021-04-02T23:35:54.001Z","type":"User","uuid":"af9135bc-a51a-47c2-aed4-8b87c10d3ac5","role":"USER","defaultAvatarId":4.0,"encryptedGameUsername":"Jfy-n5N907tXVK9VNCB9kh0yHlzMMgj1XIx-TNeC3jeo9-36","created":"2021-04-02T23:35:54.001Z","email":"credhits@gmail.com"},{"userUuid":"b260ddf1-13e7-40ca-b92b-a20e3de77f26","teamUuid":"940ae720-9009-11eb-84e2-fbe1d59dfa65","encryptedGameUsername":"bg1tWmTpWfUhndjhhvVQopmCpPN4V4uo7k3iDM_ahzpA4KWt","displayName":"fullofsnipes","gameUsername":"mango fish gf"}}`,
//     `{{"displayName":"LetterD","gameUsername":"LetterD","userUuid":"7d916254-c013-40cc-ac46-00b561a06c79","teamUuid":"f2f2aac0-0eb2-11ec-8029-75f03fbe7add","phoneNumber":"+14168782828","modified":"2021-09-06T01:40:01.367Z","type":"User","uuid":"7d916254-c013-40cc-ac46-00b561a06c79","role":"USER","defaultAvatarId":2.0,"encryptedGameUsername":"RCO2r08eFzkaKpD_96xi1Osie0_mhNKkE7q_wS7S_SPlCIk","created":"2021-09-06T01:40:01.367Z","email":"skydragon101@gmail.com"},{"displayName":"OrientalSurprise","gameUsername":"dWango Unchained","userUuid":"cc6019d0-18bb-494d-b1b3-d4bcf20f913b","teamUuid":"f2f2aac0-0eb2-11ec-8029-75f03fbe7add","phoneNumber":"+1 (508) 308-2525","modified":"2021-09-06T02:34:08.280Z","type":"User","uuid":"cc6019d0-18bb-494d-b1b3-d4bcf20f913b","role":"USER","defaultAvatarId":4.0,"encryptedGameUsername":"3OE6Mver9usfcZ5gNYfQsV9jz05fAAE2BDuEchWZwkhUIfA","created":"2021-09-06T02:34:08.280Z","email":"ray.wang1206@gmail.com"},{"displayName":"Fully Noided","gameUsername":"Fully Noided","userUuid":"ebe438e1-1e9d-4a12-ac1c-f854c6fca249","teamUuid":"f2f2aac0-0eb2-11ec-8029-75f03fbe7add","phoneNumber":"+13013371163","modified":"2021-09-06T14:28:30.945Z","type":"User","uuid":"ebe438e1-1e9d-4a12-ac1c-f854c6fca249","role":"USER","defaultAvatarId":1.0,"encryptedGameUsername":"Bliiwkh6TS7yzRsvYLHv8kDA9lR2QvQqe5mrXlXfTBqYMpI","created":"2021-09-06T14:28:30.945Z","email":"fullynoided@gmail.com"},{"displayName":"kennsta","gameUsername":"kennsta","userUuid":"fe35c614-617d-4c6d-9ccc-696e4252db70","teamUuid":"f2f2aac0-0eb2-11ec-8029-75f03fbe7add","phoneNumber":"604-889-7019","modified":"2021-09-06T19:22:24.377Z","type":"User","uuid":"fe35c614-617d-4c6d-9ccc-696e4252db70","role":"USER","defaultAvatarId":3.0,"encryptedGameUsername":"M_n0NrafhS_ePxD7PsfvS9Yxvq5_1fvFX5T6bnesyAEJ42Q","created":"2021-09-06T19:22:24.377Z","email":"danielcou7@gmail.com"},{"userUuid":"c2bf1c75-2d37-459c-bb40-e5323b65604f","teamUuid":"f2f2aac0-0eb2-11ec-8029-75f03fbe7add","encryptedGameUsername":"0WEQjJnw-pFb8vqr7-fJ5v4wHp0YjtkwnPP6HanAxuknefY","displayName":"mrsuperpoder","gameUsername":"El Dongerino"}}`
//   ]
