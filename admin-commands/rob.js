"use strict";

const config = require("../utilities/config").config;
const User = require("../models/User");
const Rob = require("../models/Rob");
const utils = require("../utilities/utils");
const { incorrectSyntax, finished } = require("../utilities/emojis");
const { MessageEmbed } = require("discord.js");

const missingArguments = "You'll have to ping the user you want to rob.";
const invalidMention = "You can't rob yourself.";
const alreadyBeingRobbed = "This user is already being robbed.";

const price = 5

module.exports = {
  aliases: ["rob", "snitch"],
  event: "messageCreate",
};

/* module.exports.func = async (message) => {
  return;
}; */

module.exports.command = async (message) => {
  let user;
  let user_id;
  let guild_id = message.guildId;

  // Check for mentions
  let mentions = message.mentions.members;
  if (mentions.size) {
    if (mentions.first().user === message.author) {
      utils.sendDelete(message, invalidMention);
      return;
    }
    user = mentions.first().user;
    user_id = mentions.first().id;
  } else {
    utils.sendDelete(message, missingArguments);
    return;
  }

  let userPoints = await utils.getPoints(message, message.author.id)

  if(price > userPoints) {
    utils.sendDelete(message, `You only have ${userPoints}, robbing costs ${bid}.`);
    return;
  }

  let _rob = await Rob.findOne({ guild_id, to_id: user_id });

  // If there's no rob active on the user, create one
  if (!_rob) {
    _rob = new Rob({
      guild_id,
      from_id: message.author.id,
      to_id: user_id,
      started_at: Date.now(),
    });
  } else {
    utils.sendDelete(message, alreadyBeingRobbed);
    return;
  }
};
