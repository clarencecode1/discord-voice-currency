"use strict";

const config = require("../utilities/config").config;
const Role = require("../models/Role");
const utils = require("../utilities/utils");
const { catchError } = utils;
const { rock, paper, scissors } = require("../utilities/emojis");
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");

module.exports = {
  aliases: ["rps"],
  event: "messageCreate",
};

const MIN_BID = 1;
const invalidValue = "Invalid bid.";
const valueTooSmall = `Please specify a value higher than ${MIN_BID}.`;
const missingArgs = `Missing arguments, try \`${config.prefix}${module.exports.aliases[0]} ${MIN_BID * 2}\``;

const missingArguments = "Invalid syntax. You need to pass in these arguments:";

module.exports.command = async (message) => {
  let commandArgs = utils.parseArgs(message.content);

  let rockButton = new MessageButton().setCustomId("rock").setEmoji(rock).setStyle("PRIMARY");
  let paperButton = new MessageButton().setCustomId("paper").setEmoji(paper).setStyle("PRIMARY");
  let scissorsButton = new MessageButton().setCustomId("scissors").setEmoji(scissors).setStyle("PRIMARY");

  if (!commandArgs._.length) {
    utils.sendDelete(message, missingArgs);
    return;
  }

  let bid = parseInt(commandArgs._[0]);
  let prize = 0;

  if (isNaN(bid)) {
    utils.sendDelete(message, invalidValue);
    return;
  }

  if (bid < MIN_BID) {
    utils.sendDelete(message, valueTooSmall);
    return;
  }

  let userPoints = await utils.updatePoints(message.author.id, message.guild);

  if (bid > userPoints) {
    utils.sendDelete(message, `You only have ${userPoints}, you can't bet ${bid}.`);
    return;
  }

  let user = message.author;
  let embed = new MessageEmbed()
    .setColor("DARK_BUT_NOT_BLACK")
    .setTitle(`Rock, paper, scissors.`)
    .addField("Cost: ", `💵 ${bid}`)
    .setThumbnail(user.avatarURL());

  let row = new MessageActionRow().addComponents(rockButton, paperButton, scissorsButton);

  let initialMessage = await message.channel.send({
    embeds: [embed],
    components: [row],
  });

  const filter = (interaction) => interaction.user === message.author;

  const buttonCollector = initialMessage.createMessageComponentCollector({
    filter,
  });

  buttonCollector.on("collect", async (interaction) => {
    let selectedButton;

    switch (interaction.customId) {
      case "rock":
        selectedButton = rockButton;
        break;
      case "paper":
        selectedButton = paperButton;
        break;
      case "scissors":
        selectedButton = scissorsButton;
        break;
    }

    let row = new MessageActionRow().addComponents(selectedButton);

    await interaction.update({ components: [row] });

    buttonCollector.stop(["Collected reaction"]);
  });

  buttonCollector.on("end", (collected, reason) => {
    let rps = {};

    rps.rock = {
      wingsAgainst: scissors,
      losesAgainst: paper,
      drawsAgainst: rock,
    };

    rps.paper = {
      wingsAgainst: rock,
      losesAgainst: scissors,
      drawsAgainst: paper,
    };

    rps.scissors = {
      wingsAgainst: paper,
      losesAgainst: rock,
      drawsAgainst: scissors,
    };

    // Pick random thing
    let choices = [rock, paper, scissors];
    let random = Math.floor(Math.random() * 3);

    let choice = choices[random];

    let playerChoice = collected.first().customId;

    if (rps[playerChoice].wingsAgainst === choice) {
      // win
      prize = bid;
      embed = new MessageEmbed().setColor("GREEN").setTitle(`${choice}, you won!`);
    } else if (rps[playerChoice].losesAgainst === choice) {
      prize = -bid;
      embed = new MessageEmbed().setColor("RED").setTitle(`${choice}, you lost`);
    } else {
      prize = 0;
      embed = new MessageEmbed().setColor("DARK_BUT_NOT_BLACK").setTitle(`${choice}, draw`);
    }

    embed
      .setThumbnail(user.avatarURL())
      .addField("Prize: ", `💵 ${prize}`)
      .addField("New balance: ", `💵 ${userPoints + prize}`);

    initialMessage.edit({ embeds: [embed] });

    utils.givePoints(message.author.id, prize, message.guildId);
  });
};
