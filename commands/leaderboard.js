"use strict";

const config = require("../utilities/config").config;
const User = require("../models/User");
const utils = require("../utilities/utils");
const { incorrectSyntax, finished } = require("../utilities/emojis");
const { MessageEmbed } = require("discord.js");

module.exports = {
  aliases: ["lb", "leaderboard", "leaderboards"],
  event: "messageCreate",
};

/* module.exports.func = async (message) => {
  return;
}; */

module.exports.command = async (message) => {
  return;

  let finishReaction = finished;
  let points = 0;
  let user;
  let user_id;

  // Check if there's a mention or a user id in here and run the command for that user instead.

  // Check for mentions
  let mentions = message.mentions.members;
  let commandArgs = utils.parseArgs(message.content)._[0];
  if (mentions.size) {
    user = mentions.first().user;
    user_id = mentions.first().id;
  } else if (commandArgs && commandArgs.length == 18) {
    // Check for user id
    user = await utils.getUser(message, commandArgs);
    user_id = commandArgs;
    // TODO: I should check if this user is in the guild, just to make sure people don't add random things to the database
  } else {
    user = message.author;
    user_id = user.id;
  }

  // Check if user is already in database
  let _user = await User.findOne({ user_id });

  // If they are not, create a new database and give them 0 points
  if (!_user) {
    _user = new User({
      guild_id,
      user_id,
      points,
      is_active: isActive(newState),
      is_active_since: Date.now(),
    });

    try {
      await _user.save();
    } catch (err) {
      console.log(err);
    }
  } else {
    points = _user.points;
  }

  // Construct embed
  let embed = new MessageEmbed()
    .setColor("DARK_BUT_NOT_BLACK")
    .setTitle(`${user.username} balance`)
    .addField("Points: ", `💵 ${points}`)
    .setTimestamp()
    .setThumbnail(user.avatarURL());
  message.channel.send({ embeds: [embed] });

  utils.react(message, finishReaction);
};
