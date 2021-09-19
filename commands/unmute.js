"use strict";

const config = require("../utilities/config").config;
const Role = require("../models/Role");
const utils = require("../utilities/utils");
const { incorrectSyntax, finished } = require("../utilities/emojis");
const { MessageEmbed } = require("discord.js");

const price = 85;

module.exports = {
  aliases: ["unmute", "unmuteuser"],
  event: "messageCreate",
};

const missingArguments =
  "Invalid syntax. You need to ping the user or put in their uid:";

  module.exports.command = async (message) => {
    let user;
    let user_id;
  
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
      utils.sendDelete(message, missingArguments);
      return;
    }
  
    let embed = new MessageEmbed()
      .setColor("GREEN")
      .setTitle(`Unmute ${user.username}?`)
      .addField("Cost: ", `💵 ${price}`)
      .setThumbnail(user.avatarURL());
    let initialMessage = await message.channel.send({ embeds: [embed] });
    initialMessage.react(finished);
    initialMessage.react(incorrectSyntax);
  
    const filter = (reaction, user) => {
      let emoji = reaction.emoji.toString();
      return (
        user === message.author &&
        (emoji === finished || emoji === incorrectSyntax)
      );
    };
  
    const reactionCollector = initialMessage.createReactionCollector({
      filter,
    });
  
    reactionCollector.on("collect", (reaction) => {
      reactionCollector.stop(["Collected reaction"]);
    });
  
    reactionCollector.on("end", async (collected, reason) => {
      let emoji = collected.first().emoji.toString();
      if (emoji === finished) {
        // Detract from user's points
        let success = await utils.takePoints(message, message.author.id, price);
  
        if (success) {
          // Try to mute them
          let guildMember = await message.guild.members.fetch(user_id);
          let voiceState = guildMember.voice;
          voiceState.setMute(
            false,
            `Unmuted by ${message.member.displayName} for ${price}`
          );
          initialMessage.delete();
          utils.sendDelete(
            message,
            `Successfully unmuted user.\nNew balance is ${success}`
          );
        } else {
          utils.sendDelete(message, `Not enough balance.`);
        }
      } else {
        try {
          initialMessage.delete();
        } catch (err) {
          console.log(err);
        }
      }
    });
  };
  