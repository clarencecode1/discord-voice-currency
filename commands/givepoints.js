"use strict";

const config = require("../utilities/config").config;
const User = require("../models/User");
const utils = require("../utilities/utils");
const { incorrectSyntax } = require("../utilities/emojis");
const { MessageEmbed } = require("discord.js");

module.exports = {
  aliases: ["give", "givepoints", "add", "addpoints", "givebal", "givebalance", "addbal", "addbalance"],
  event: "messageCreate",
};

const missingArguments = `Invalid syntax. You need to pass in two arguments: \`-u <uid> \` for user and \`-p <value> \` for points.\nExample: \`${config.prefix}${module.exports.aliases[0]} -u 832730746258718741 -p 169\`\nThe order of the flags is irrelevant.`;

/* module.exports.func = async (message) => {
  return;
}; */

module.exports.command = async (message) => {
  // User needs to be an admin
  let finishReaction = incorrectSyntax;
  if (!utils.isTrusted(message)) {
    utils.react(message, finishReaction);
    return;
  }

  let commandArgs = utils.parseArgs(message.content);

  // Check for missing flags, give help on how to use the command.
  if (!commandArgs.u || !commandArgs.p) {
    utils.react(message, finishReaction);
    message.channel.send(missingArguments);
    console.log(commandArgs)
    return;
  }

  // Minimal check in order to lessen load on database

  if (commandArgs.u.length != 18) {
    utils.react(message, finishReaction);
    message.channel.send("Invalid user id.");
    return;
  }

  if (isNaN(parseInt(commandArgs.p))) {
    utils.react(message, finishReaction);
    message.channel.send("Invalid points value.");
    return;
  }

  finishReaction = await utils.givePoints(message, commandArgs.u, commandArgs.p)

  utils.react(message, finishReaction);
};
