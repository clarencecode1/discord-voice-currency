("use strict");

const config = require("../utilities/config").config;
const Role = require("../models/Role");
const utils = require("../utilities/utils");
const { catchError } = utils;
const { incorrectSyntax, finished } = require("../utilities/emojis");
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");

const price = 1;

module.exports = {
  aliases: ["unmute"],
  event: "messageCreate",
};

const missingArguments = "Invalid syntax. You need to ping the user or put in their uid:";

module.exports.command = async (message) => {
  let user;
  let user_id;

  let yesButton = new MessageButton().setCustomId("yes").setEmoji(finished).setStyle("PRIMARY");
  let noButton = new MessageButton().setCustomId("no").setEmoji(incorrectSyntax).setStyle("PRIMARY");

  // Check for mentions
  let mentions = message.mentions.members;
  let parsedArgs = utils.parseArgs(message.content);
  let commandArgs = parsedArgs._[0];
  let force = parsedArgs.f;
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
    user_id = message.author.id;
  }

  if (force) {
    // force, just do it
    unmuteUser(message, user_id, price);
    return;
  }

  let embed = new MessageEmbed().setColor("GREEN").setTitle(`Unmute ${user.username}?`).addField("Cost: ", `💵 ${price}`).setThumbnail(user.avatarURL());

  let row = new MessageActionRow().addComponents(yesButton, noButton);

  let initialMessage = await message.channel.send({ embeds: [embed], components: [row] });

  const filter = (interaction) => interaction.user === message.author;

  const buttonCollector = initialMessage.createMessageComponentCollector({
    filter,
  });

  buttonCollector.on("collect", async (interaction) => {
    let selectedButton;

    switch (interaction.customId) {
      case "yes":
        selectedButton = yesButton;
        unmuteUser(message, user_id, price, initialMessage);
        break;
      case "no":
        selectedButton = noButton;
        break;
    }

    let row = new MessageActionRow().addComponents(selectedButton);

    await interaction.update({ components: [row] });

    buttonCollector.stop(["Collected reaction"]);
  });
};

const unmuteUser = async (message, user_id, price, initialMessage = null) => {
  // Detract from user's points
  let success = await utils.takePoints(message.author.id, price, message.guildId);

  if (success) {
    // Try to mute them
    let guildMember = await message.guild.members.fetch(user_id);
    let voiceState = guildMember.voice;
    voiceState.setMute(false, `Unmuted by ${message.member.displayName} for ${price}`).catch(catchError);
    if (initialMessage) initialMessage.delete();
    utils.sendDelete(message, `Successfully unmuted user.\nNew balance is ${success}`);
  } else {
    utils.sendDelete(message, `Not enough balance.`);
  }
};
