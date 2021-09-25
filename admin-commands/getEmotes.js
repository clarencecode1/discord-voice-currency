"use strict";

const config = require("../utilities/config").config;
const Role = require("../models/Role");
const utils = require("../utilities/utils");
const { catchError } = utils;
const { incorrectSyntax } = require("../utilities/emojis");
const { MessageEmbed } = require("discord.js");

module.exports = {
  aliases: ["getemotes", "emotes", "emoji"],
  event: "messageCreate",
};

module.exports.command = async (message) => {
  let user = message.author;
  let embed = new MessageEmbed()
    .setColor("RANDOM")
    .setTitle(`React with x to end.`);
  let initialMessage = await message.channel.send({ embeds: [embed] });

  const filter = (reaction, user) => {
    return user === message.author;
  };

  const reactionCollector = initialMessage.createReactionCollector({
    filter,
  });

  reactionCollector.on("collect", (reaction) => {
    console.log(reaction.emoji.toString());
  });
};
