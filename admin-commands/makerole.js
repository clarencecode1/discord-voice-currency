"use strict";

const config = require("../utilities/config").config;
const Role = require("../models/Role");
const utils = require("../utilities/utils");
const { incorrectSyntax } = require("../utilities/emojis");
const { MessageEmbed } = require("discord.js");

module.exports = {
  aliases: ["makerole", "createrole"],
  event: "messageCreate",
};
/* 
const arguments = [
    "-name <role name>",
    "-color <Can be a number, hex string, an RGB array like: [255, 0, 255] // purple>"
];
 */
const missingArguments = "Invalid syntax. You need to pass in these arguments:";

module.exports.command = async (message) => {
  let embed = new MessageEmbed()
    .setColor("DARK_BUT_NOT_BLACK")
    .setTitle(`Creating a new role`)
    .addField("Colour", `React to one of the colours to pick`);
  let initialMessage = await message.channel.send({ embeds: [embed] });

  const filter = (reaction, user) => {
    return user === message.author;
  };

  const reactionCollector = initialMessage.createReactionCollector({
    filter,
  });

  reactionCollector.on("collect", (reaction) => {
    reactionCollector.stop(["Collected reaction"]);
  });

  reactionCollector.on("end", (collected, reason) => {
    console.log(collected)
    console.log(reason)
  })

};
