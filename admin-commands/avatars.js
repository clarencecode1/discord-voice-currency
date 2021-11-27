"use strict";

const User = require("../models/User");
const fs = require("fs");
const path = require("path");
const request = require("request");
const MIN_POINTS = 500;

module.exports = {
  aliases: ["avatars"],
  event: "messageCreate",
};

/* module.exports.func = async (message) => {
  return;
}; */

module.exports.command = async (message) => {
  let usersArray = await User.find({ guild_id: message.guildId, points: { $gte: MIN_POINTS } }).sort({ points: "desc" });
  let index = 0;

  await Promise.all(
    usersArray.map(async ({ user_id }) => {
      let user = await message.client.users.fetch(user_id);
      let avatar = user.avatarURL({ size: 2048 });
      console.log(avatar);
      if (avatar) {
        index++;

        let directoryName = `avatars${Math.floor(index / 20) + 1}`;

        fs.access(directoryName, (error) => {
          if (error) {
            fs.mkdir(directoryName, (err) => {
              if (err) {
                return console.error(err);
              }
              console.log("Directory created successfully!");
            });
          }
        });

        return download(avatar, `${directoryName}/${user.username.split(" ")[0]}.png`);
      }
    })
  );

  message.channel.send(`Finished pulling ${index} avatars.`);
};

const download = (uri, filename) => {
  return request.head(uri, function (err, res, body) {
    request(uri)
      .pipe(fs.createWriteStream(filename))
      .on("close", () => {
        console.log("Done with " + filename);
      });
  });
};
