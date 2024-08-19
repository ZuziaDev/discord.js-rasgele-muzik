
const { ActivityType } = require("discord.js")
require("advanced-logs")

module.exports = client => {

    console.success(`${client.user.username} adlı hesaba başarıyla bağlanıldı.`)
    const statuses = [
        { name: `Nova Community`, type: ActivityType.Watching },
        { name: `Nova`, type: ActivityType.Listening },
    ];

    let index = 0;

    setInterval(() => {
        const status = statuses[index];
        client.user.setPresence({
            activities: [{ name: status.name, type: status.type }],
            status: 'online'
        });

        index = (index + 1) % statuses.length;
    }, 10000);
};
