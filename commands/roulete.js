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
const missingArgs = `Missing arguments, try \`${config.prefix}${module.exports.aliases[0]} ${MIN_BID * 2}\``;

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

  let totalBet = 0;
  let userPoints = {};

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

  let result = Math.floor(Math.random() * 37);

  let reactionsCollection = await initialMessage.awaitReactions({
    time: duration * 1000,
  });

  let colours = {
    green: "GREEN",
    red: "RED",
    black: "DARK_BUT_NOT_BLACK",
  };

  let players = {};

  let promises = reactionsCollection.map(async (reaction) => {
    // Iterate over all reactions
    let usersCollection = reaction.users.cache;
    usersCollection = usersCollection.filter((user) => !user.bot);

    let userPromises = await usersCollection.map(async (user) => {
      let currentBid;
      if (!userPoints[user.id]) {
        userPoints[user.id] = await utils.updatePoints(user.id, message.guild);
        currentBid = parseInt(Math.min(bid, userPoints[user.id]));
      }
      if (!players[user.tag]) {
        players[user.tag] = 0;
      }
      // Check colour
      let reactionIsOdd = reaction.emoji.toString() === one;
      let reactionIsEven = reaction.emoji.toString() === two;
      let reactionIsColour = [green, red, black].includes(reaction.emoji.toString());

      if (reactionIsColour) {
        if (table[result] === reaction.emoji.toString()) {
          let prize = reaction.emoji.toString() === green ? 16 * currentBid : currentBid;
          if (win(message, user, userPoints[user.id], currentBid, prize)) {
            totalBet += currentBid;
            userPoints[user.id] += prize;
            players[user.tag] += prize;
          }
        } else {
          if (lose(message, user, userPoints[user.id], currentBid)) {
            totalBet += currentBid;
            let prize = currentBid;
            userPoints[user.id] -= prize;
            players[user.tag] -= prize;
          }
        }
      } else if (reactionIsOdd || reactionIsEven) {
        // Check even or odd
        if ((reactionIsOdd && result % 2 === 1) || (reactionIsEven && result % 2 === 0)) {
          if (win(message, user, userPoints[user.id], currentBid)) {
            totalBet += currentBid;
            let prize = currentBid;
            userPoints[user.id] += prize;
            players[user.tag] += prize;
          }
        } else {
          if (lose(message, user, userPoints[user.id], currentBid)) {
            totalBet += currentBid;
            let prize = currentBid;
            userPoints[user.id] -= prize;
            players[user.tag] -= prize;
          }
        }
      }
    });

    await Promise.all(userPromises);
  });

  await Promise.all(promises);

  let bigFieldWinners = [];
  let bigFieldLosers = [];

  Object.keys(players).forEach((key, index) => {
    let points = players[key];
    if (points > 0) {
      bigFieldWinners.push(`**${key}**  -  💵 ${Math.round((points + Number.EPSILON) * 100) / 100}`);
    } else {
      bigFieldLosers.push(`**${key}**  -  💵 ${Math.round((-points + Number.EPSILON) * 100) / 100}`);
    }
  });

  if (!bigFieldWinners.length) {
    bigFieldWinners = "No winners";
  } else bigFieldWinners = "\n" + bigFieldWinners.join("\n");

  if (!bigFieldLosers.length) {
    bigFieldLosers = "No losers";
  } else bigFieldLosers = "\n" + bigFieldLosers.join("\n");

  embed = new MessageEmbed()
    .setColor(colours[table[result]])
    .setTitle(`Roulette table, react to bid.`)
    .addField("Total sum played: ", `💵 ${totalBet}`, true)
    .addField("Result: ", `${table[result]} ${result}`, true)
    .addField(`Winners: `, bigFieldWinners)
    .addField(`Losers: `, bigFieldLosers)
    .setThumbnail(initialMessage.author.avatarURL());

  // Edit message with results
  initialMessage.edit({ embeds: [embed] });
};

const win = (message, user, userPoints, bid, prize = null) => {
  if (bid <= userPoints) {
    if (!prize) {
      prize = bid;
    }
    utils.givePoints(user.id, prize, message.guildId);
    return true;
  } else {
    return false;
  }
};

const lose = (message, user, userPoints, bid) => {
  if (bid <= userPoints) {
    utils.takePoints(user.id, bid, message.guildId);
    return true;
  } else {
    return false;
  }
};
