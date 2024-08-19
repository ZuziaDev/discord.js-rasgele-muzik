const { Client, Events, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const Config = require("./Config.js");
require("advanced-logs");
const allIntents = Object.values(GatewayIntentBits);
const client = new Client({
    intents: [allIntents]
});
require("./Utils/eventLoader.js")(client)
require("./Utils/slashHandler.js")(client)
const axios = require("axios")
client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId.startsWith("lyrics-music-")) {
        const [trackName, artistName] = interaction.customId.replace("lyrics-music-", "").split("_");
        
        if (!trackName || !artistName) {
            return interaction.reply({ content: "Invalid track or artist name.", ephemeral: true });
        }
        
        const lyrics = await getLyricsInfo(trackName, artistName);
        if (!lyrics) {
            return interaction.reply({ content: "Lyrics not found.", ephemeral: true });
        }
        
        interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle(trackName)
                    .setDescription(lyrics)
                    .setFooter({text:"Lyrics powered by www.musixmatch.com"})
            ]
        });
    }
});


async function getLyricsInfo(trackName, artistName) {

    const searchUrl = `https://api.musixmatch.com/ws/1.1/track.search?q_track=${trackName.replace()}}&q_artist=${encodeURIComponent(artistName)}&apikey=${Config.musixmatch.apikey}`;
  
    try {
        const response = await axios.get(searchUrl);
        const trackList = response.data.message.body.track_list;
        if (trackList.length === 0) {
            return null;
        }
  
        const trackId = trackList[0].track.track_id;
        const lyricsUrl = `https://api.musixmatch.com/ws/1.1/track.lyrics.get?track_id=${trackId}&apikey=${Config.musixmatch.apikey}`;
        const lyricsResponse = await axios.get(lyricsUrl);
        const lyricsData = lyricsResponse.data.message.body.lyrics;

        const lyrics = lyricsData.lyrics_body;
        return lyrics;
    } catch (error) {
        console.error('Musixmatch API hatası:', error);
        return null;
    }
}


// CrashHandler ------------------------------------------------------------------------------------------------
// process.on('unhandledRejection', (reason, p) => {
//     console.error(reason);
// });
// process.on("uncaughtException", (err, origin) => {
//     console.error(' [AntiCrash] :: Uncaught Exception/Catch');
// })
// process.on('uncaughtExceptionMonitor', (err, origin) => {
//     console.error(' [AntiCrash] :: Uncaught Exception/Catch (MONITOR)');
// });
// CrashHandler ------------------------------------------------------------------------------------------------

client.login(Config.Token);