const { EmbedBuilder, ButtonBuilder } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const axios = require('axios');
const config = require("../Config");

module.exports = {
  structure: new SlashCommandBuilder()
    .setName("rastgele-müzik-öner")
    .setDescription("Seçtiğiniz tarzda rastgele müzik önerisi yapar.")
    .addStringOption(option => 
      option.setName('tarz-seçim')
        .setDescription('Hangi tarzda rastgele müzik önerisi yapmamı dilersin?')
        .setRequired(true)
        .setAutocomplete(true)
    ),
    async run(client, interaction) {
      if (interaction.isCommand()) {
          const genre = interaction.options.getString('tarz-seçim');
          
          try {
              const token = await getSpotifyToken();
              const track = await getRandomTrackFromSpotify(genre, token);
              
              if (!track) {
                  return interaction.reply({ content: 'Müzik bulunamadı!', ephemeral: true });
              }
  
              const trackName = track.name;
              const artistName = track.artists[0].name;
              const albumName = track.album.name;
              const trackUrl = track.external_urls.spotify;
  
              // Süreyi dakika ve saniyeye çevirme
              const durationMs = track.duration_ms;
              const totalSeconds = Math.floor(durationMs / 1000);
              const minutes = Math.floor(totalSeconds / 60);
              const seconds = totalSeconds % 60;
              const durationFormatted = `${minutes} dakika ${seconds} saniye`;
  
              // Şarkı sözlerini Musixmatch'ten çekme
              const lyrics = await getLyricsInfo(trackName, artistName);
              await interaction.reply({
                embeds: [
                  new EmbedBuilder()
                    .setTitle("Başarılı!")
                    .setDescription(`
                      İstediğin türde rastgele bir müzik buldum.
                      
                      **Müzik Hakkında Bilgiler:**
                      - Müziğin İsmi: ${trackName}
                      - Sanatçı: [${artistName}](${track.artists[0].external_urls.spotify})
                      - Albüm: ${albumName}
                      - Süre: ${durationFormatted}`)
                    .setFooter({ text: "Müziğe ulaşmak için aşağıdaki butona tıkla!" })
                ],
                  components: [{
                      type: 1,
                      components: [
                          new ButtonBuilder()
                          .setLabel("Müziği dinle!")
                          .setURL(trackUrl)
                          .setStyle("Link")
                          .setEmoji("🔗"),
  
                          new ButtonBuilder()
                          .setCustomId(`lyrics-music-${trackName}_${artistName}`)
                          .setLabel(`Şarkı Sözlerini Görüntüle!`)
                          .setStyle("Primary")
                          .setDisabled(lyrics)
                          .setEmoji("🎼")
                      ]
                  }]
              });
          } catch (error) {
              console.error(error);
              await interaction.reply({ content: 'Müzik önerisi yapılırken bir hata oluştu.', ephemeral: true });
          }
      } else if (interaction.isAutocomplete()) {
          const focusedValue = interaction.options.getFocused();
          const choices = [
              'Rock', 'Pop', 'Hip-Hop', 'Jazz', 'Classical', 'Country', 'Electronic', 
              'Blues', 'Reggae', 'Soul', 'Metal', 'R&B', 'Funk', 'Punk',
              'Indie', 
               'Ska', 'Grunge', 'Synthwave', 
              'Drum & Bass', 'Reggaeton', 'Afrobeat', 'New Age', 'Chillout', 'Lo-fi'
          ];
  
          const filtered = choices.filter(choice => choice.toLowerCase().startsWith(focusedValue.toLowerCase()));
          await interaction.respond(
              filtered.map(choice => ({ name: choice, value: choice.toLowerCase() }))
          );
      } else {
          console.error('interaction is not a CommandInteraction or AutocompleteInteraction');
      }
  }
  
};

async function getSpotifyToken() {
  const tokenUrl = 'https://accounts.spotify.com/api/token';
  const authOptions = {
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${config.spotify.client_id}:${config.spotify.client_secret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
  };

  const response = await axios.post(tokenUrl, 'grant_type=client_credentials', { headers: authOptions.headers });
  return response.data.access_token;
}

async function getRandomTrackFromSpotify(genre, token) {
  const searchUrl = `https://api.spotify.com/v1/recommendations?seed_genres=${genre}&limit=1`;

  const response = await axios.get(searchUrl, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  return response.data.tracks.length > 0 ? response.data.tracks[0] : null;
}

async function getLyricsInfo(trackName, artistName) {
  const searchUrl = `https://api.musixmatch.com/ws/1.1/track.search?q_track=${encodeURIComponent(trackName)}&q_artist=${encodeURIComponent(artistName)}&apikey=${config.musixmatch.apikey}`;

  try {
      const response = await axios.get(searchUrl);
      const trackList = response.data.message.body.track_list;

      if (trackList.length === 0) {
          return true;
      }

      const trackId = trackList[0].track.track_id;

      const lyricsUrl = `https://api.musixmatch.com/ws/1.1/track.lyrics.get?track_id=${trackId}&apikey=${config.musixmatch.apikey}`;
      const lyricsResponse = await axios.get(lyricsUrl);
      console.log(lyricsResponse.data)
      const lyrics = lyricsResponse.data.message.body ? false : true;

      return lyrics;
  } catch (error) {
      console.error('Musixmatch API hatası:', error);
      return true;
  }
}
