const fetch = require('node-fetch');
async function run() {
  const res = await fetch("http://localhost:3000/api/chats/group", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      currentUserId: "60c72b2f9b1d8b00155b8e9a",
      participantIds: ["60c72b2f9b1d8b00155b8e9b", "60c72b2f9b1d8b00155b8e9c"],
      groupName: "Test Group",
      groupAvatar: ""
    })
  });
  console.log(res.status, await res.text());
}
run();
