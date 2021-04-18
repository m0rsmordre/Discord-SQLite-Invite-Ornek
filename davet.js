const Discord = require("discord.js");
const client = new Discord.Client();
var moment = require("moment");
const sqlite3 = require("sqlite3");
let db = new sqlite3.Database("./test.db");

client.on("ready", () => {
  console.log(`${client.user.tag}`);
  client.user.setPresence({
    status: "online",
    activity: { name: "M0rsmordre", type: "WATCHING" },
  });
});

/*
Tabloyu oluşturmak için terminale sqlite3 yazıp .open test.db yazdıktan sonra aşağıdaki komutu girerek tabloyu oluşturmalısınız

CREATE TABLE `invite_tbl` (
`k_id` VARCHAR(50),
`last_inv` VARCHAR(50),
`created_at` VARCHAR(50),
PRIMARY KEY (`k_id`)
);*/

client.on("message", async function (msg) {
  if (msg.author.bot) return;
  let suan = Math.floor(Date.now() / 1000);

  let davet_ch = msg.guild.channels.cache.get("806224051391168576"); // Davet oluşturulacak kanal
  let davet_log = msg.guild.channels.cache.get("820244119573757962"); // Oluşturulan davet kodlarının loglanacağı kanal
  if (!davet_log) return msg.channel.send("Davet log kanalı bulunamadı");
  if (!davet_ch)
    return msg.channel.send("Davet oluşturulacak kanal bulunamadı");

  let use = 1;
  let sure = 3600; // 1 saat için 60 * 60 = 3600, 1 gün için 24 * 60 * 60 = 86400 olarak düzenleyebilirsiniz.

  db.get(
    `SELECT * FROM invite_tbl WHERE k_id ="${msg.author.id}"`, // Kullanıcı daha önce bir davet oluşturmuş mu?
    [],
    async (err, row) => {
      if (err) return msg.reply("Hata oluştu");
      if (row) { // Eğer daha önce bir davet oluşturmuş ve davet süresi bitmişse
        if (parseInt(suan) >= parseInt(row.created_at) + parseInt(sure)) { // Davet süresi geçmişse yeni davet oluştur
          let invite = await davet_olustur(use, sure, davet_ch);
          var URL = "https://discord.gg/" + invite;
          msg.member.send(
            `İsteğin üzerine ${URL} ${use} kullanımlık ve ${
              sure / 60
            } dakika geçerli bir davet oluşturuldu`
          );

          db.run(
            `UPDATE invite_tbl SET last_inv=?,created_at=? WHERE k_id = ?`,
            [invite, suan, msg.author.id]
          );
          davet_log.send(
            `<@${msg.author.id}> kullanıcısı ${invite} davetini oluşturdu`
          );
        } else { // Davet süresi geçmemişse
          let bitecek = moment
            .unix(parseInt(row.created_at) + parseInt(sure))
            .format("HH:mm:ss DD/MM/YYYY");
          msg.reply(
            `Her ${
              sure / 60
            } dakikada bir yeni bir davet linki oluşturabilirsin. ${bitecek} tarihinde yeni bir davet oluşturabileceksiniz`
          );
        }
      } else { // Eğer daha önce bir davet oluşturmadıysa
        let invite = await davet_olustur(use, sure, davet_ch);
        var URL = "https://discord.gg/" + invite;
        msg.member.send(
          `İsteğin üzerine ${URL} ${use} kullanımlık ve ${
            sure / 60
          } dakika geçerli bir davet oluşturuldu`
        );
        db.run(
          "insert or ignore into invite_tbl (k_id,last_inv,created_at) VALUES (?, ?,?);",
          [msg.author.id, invite, suan]
        );
        davet_log.send(
          `<@${msg.author.id}> kullanıcısı ${invite} davetini oluşturdu`
        );
      }
    }
  );
});

client.login("TOKEN");

async function davet_olustur(use, sure, davet_ch) {
  return new Promise(async (resolve, reject) => {
    await davet_ch
      .createInvite({ maxUses: use, unique: true, maxAge: sure })
      .then((res) => {
        resolve(res.code);
      });
  });
}
