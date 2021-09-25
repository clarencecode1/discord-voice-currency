"use strict";

const config = require("../utilities/config").config;
const Role = require("../models/Role");
const utils = require("../utilities/utils");
const { catchError } = utils;
const { green, red, black, one, two } = require("../utilities/emojis");
const { MessageEmbed } = require("discord.js");

module.exports = {
  aliases: ["roulete", "roullette", "roullete", "roulette"],
  event: "messageCreate",
};

const MIN_BID = 1;
const duration = 10;
const invalidValue = "Invalid bid.";
const valueTooSmall = `Please specify a value higher than ${MIN_BID}.`;
const missingArgs = `Missing arguments, try \`${config.prefix}${
  module.exports.aliases[0]
} ${MIN_BID * 2}\``;

const missingArguments = "Invalid syntax. You need to pass in these arguments:";

module.exports.command = async (message) => {
  let split = message.content.split(" ");
  let bid;
  split.map((string) => {
    if (!isNaN(parseInt(string))) {
      bid = parseInt(string);
    }
  });

  if (!bid) {
    utils.sendDelete(message, missingArgs);
    return;
  }

  if (bid < MIN_BID) {
    utils.sendDelete(message, valueTooSmall);
    return;
  }

  let userPoints = await utils.getPoints(message, message.author.id);

  if (bid > userPoints) {
    utils.sendDelete(
      message,
      `You only have ${userPoints}, you can't bet ${bid}.`
    );
    return;
  }

  let user = message.author;
  let embed = new MessageEmbed()
    .setColor("DARK_BUT_NOT_BLACK")
    .setTitle(`Roulette table, react to bid.`)
    .addField("Cost: ", `💵 ${bid}`, true)
    .addField("Duration: ", `${duration} seconds`, true)
    .setThumbnail(user.avatarURL());
  let initialMessage = await message.channel.send({ embeds: [embed] });
  initialMessage.react(green);
  initialMessage.react(red);
  initialMessage.react(black);
  initialMessage.react(one);
  initialMessage.react(two);

  let reactionsCollection = await initialMessage.awaitReactions({
    time: duration * 1000,
  });


  let table = [
    green, // 0
    red, // 1
    black, // 2
    red, // 3
    black, // 4
    red, // 5
    black, // 6
    red, // 7
    black, // 8
    red, // 9
    black, // 10
    black, // 11
    red, // 12
    black, // 13
    red, // 14
    black, // 15
    red, // 16
    black, // 17
    red, // 18
    red, // 19
    black, // 20
    red, // 21
    black, // 22
    red, // 23
    black, // 24
    red, // 25
    black, // 26
    red, // 27
    black, // 28
    black, // 29
    red, // 30
    black, // 31
    red, // 32
    black, // 33
    red, // 34
    black, // 35
    red, // 36
  ];

  let colours = {
    green: "GREEN",
    red: "RED",
    black: "DARK_BUT_NOT_BLACK",
  };

  let result = Math.floor(Math.random() * 37);
  console.log(result);

  reactionsCollection.map((reaction) => {
    // Iterate over all reactions
    let usersCollection = reaction.users.cache;
    usersCollection = usersCollection.filter(
      (user) => !user.bot
    );

    usersCollection.map((user) => {
      console.log(`${user.tag}, ${reaction.emoji.toString()}`);
    });
  });

  embed = new MessageEmbed()
    .setColor(colours[table[result]])
    .setTitle(`Roulette table, react to bid.`)
    .addField("Total sum played: ", `💵 ${bid}`, true)
    .addField("Result: ", `${table[result]} ${result}`, true)
    .setThumbnail(user.avatarURL());

  // Edit message with results
  initialMessage.edit({ embeds: [embed] });

  /* reactionCollector.on("end", (collected, reason) => {
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

    embed
      .setThumbnail(user.avatarURL())
      .addField("Prize: ", `💵 ${prize}`)
      .addField("New balance: ", `💵 ${userPoints + prize}`);

    initialMessage.edit({ embeds: [embed] });

    utils.givePoints(message, message.author.id, prize);
  }); */
};
