"use strict";

const config = require("../utilities/config").config;
const Role = require("../models/Role");
const utils = require("../utilities/utils");
const { catchError } = utils;
const { rock, paper, scissors } = require("../utilities/emojis");
const { MessageEmbed } = require("discord.js");

module.exports = {
  aliases: ["rps", "rock", "paper", "scissors"],
  event: "messageCreate",
};

const MIN_BID = 1;
const invalidValue = "Invalid bid.";
const valueTooSmall = `Please specify a value higher than ${MIN_BID}.`;
const missingArgs = `Missing arguments, try \`${config.prefix}${
  module.exports.aliases[0]
} ${MIN_BID * 2}\``;

const missingArguments = "Invalid syntax. You need to pass in these arguments:";

module.exports.command = async (message) => {
  let commandArgs = utils.parseArgs(message.content);

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

  let userPoints = await utils.getPoints(message, message.author.id)

  if(bid > userPoints) {
    utils.sendDelete(message, `You only have ${userPoints}, you can't bet ${bid}.`);
    return;
  }

  let user = message.author;
  let embed = new MessageEmbed()
    .setColor("DARK_BUT_NOT_BLACK")
    .setTitle(`Rock, paper, scissors.`)
    .addField("Cost: ", `💵 ${bid}`)
    .setThumbnail(user.avatarURL());
  let initialMessage = await message.channel.send({ embeds: [embed] });
  initialMessage.react(rock);
  initialMessage.react(paper);
  initialMessage.react(scissors);

  const filter = (reaction, user) => {
    let emoji = reaction.emoji.toString();
    return (
      user === message.author &&
      (emoji === rock || emoji === paper || emoji === scissors)
    );
  };

  const reactionCollector = initialMessage.createReactionCollector({
    filter,
  });

  reactionCollector.on("collect", (reaction) => {
    reactionCollector.stop(["Collected reaction"]);
  });

  reactionCollector.on("end", (collected, reason) => {
    let rps = {};

    rps[rock] = {
      wingsAgainst: scissors,
      losesAgainst: paper,
      drawsAgainst: rock,
    };

    rps[paper] = {
      wingsAgainst: rock,
      losesAgainst: scissors,
      drawsAgainst: paper,
    };

    rps[scissors] = {
      wingsAgainst: paper,
      losesAgainst: rock,
      drawsAgainst: scissors,
    };

    // Pick random thing
    let choices = [rock, paper, scissors];
    let random = Math.floor(Math.random() * 3);

    let choice = choices[random];

    let playerChoice = collected.first().emoji.toString();

    if (rps[playerChoice].wingsAgainst === choice) {
      // win
      prize = bid;
      embed = new MessageEmbed()
        .setColor("GREEN")
        .setTitle(`${choice}, you won!`);
    } else if (rps[playerChoice].losesAgainst === choice) {
      prize = -bid;
      embed = new MessageEmbed()
        .setColor("RED")
        .setTitle(`${choice}, you lost`);
    } else {
      prize = 0;
      embed = new MessageEmbed()
        .setColor("DARK_BUT_NOT_BLACK")
        .setTitle(`${choice}, draw`);
    }

    embed.setThumbnail(user.avatarURL()).addField("Prize: ", `💵 ${prize}`).addField("New balance: ", `💵 ${userPoints + prize}`);

    initialMessage.edit({ embeds: [embed] });

    utils.givePoints(message, message.author.id, prize);
  });
};
