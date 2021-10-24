"use strict";

const config = require("../utilities/config").config;
const Role = require("../models/Role");
const utils = require("../utilities/utils");
const { catchError } = utils;
const { finished, incorrectSyntax } = require("../utilities/emojis");
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");

module.exports = {
  aliases: ["simp", "donate"],
  event: "messageCreate",
};

const MIN_DONATION = 1;
const invalidValue = "Invalid sum.";
const valueTooSmall = `Please specify a value higher than ${MIN_DONATION}.`;
const missingArgs = `Missing arguments, try \`${config.prefix}${module.exports.aliases[0]} ${MIN_DONATION * 2}\``;
module.exports.command = async (message) => {
  let user;
  let user_id;

  let yesButton = new MessageButton().setCustomId("yes").setEmoji(finished).setStyle("PRIMARY");
  let noButton = new MessageButton().setCustomId("no").setEmoji(incorrectSyntax).setStyle("PRIMARY");

  let split = message.content.split(" ");
  let donation;
  split.map((string) => {
    if (!isNaN(parseInt(string))) {
      donation = parseInt(string);
    }
  });

  if (!donation) {
    utils.sendDelete(message, missingArgs);
    return;
  }

  if (donation < 0) {
    utils.sendDelete(message, invalidValue);
    return;
  }

  // Check for mentions
  let mentions = message.mentions.members;
  if (mentions.size) {
    user = mentions.first().user;
    user_id = mentions.first().id;
  } else {
    utils.sendDelete(message, missingArgs);
    return;
  }

  let userPoints = await utils.getPoints(message, message.author.id);

  if (donation > userPoints) {
    utils.sendDelete(message, `You only have ${userPoints}, you can't donate ${donation}.`);
    return;
  }

  let parsedArgs = utils.parseArgs(message.content);
  let force = parsedArgs.f;

  if (force) {
    // force, just do it
    donate(null, message, donation, user, user_id);
    return;
  }

  let embed = new MessageEmbed()
    .setColor("RANDOM")
    .setTitle(`Donate 💵 ${donation} to ${user.username}?`)
    .addField("Your balance: ", `💵 ${userPoints}`)
    .setThumbnail(user.avatarURL());

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
        donate(initialMessage, message, donation, user, user_id);
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

const donate = async (initialMessage, message, donation, user, user_id) => {
  let success = await utils.takePoints(message.author.id, donation);

  // Give points to target

  if (success) {
    let userNewBalance = await utils.givePoints(message, user_id, donation);
    let embed = new MessageEmbed()
      .setColor("GREEN")
      .setTitle(`Successfully gave 💵 ${donation} to ${user.tag}.`)
      .addField("Your new balance: ", `💵 ${success}`)
      .addField(`Their new balance:`, `💵 ${userNewBalance}.`)
      .setThumbnail(user.avatarURL());
    if (initialMessage) {
      initialMessage.edit({ embeds: [embed] });
    } else {
      await message.channel.send({ embeds: [embed] });
    }
    return;
  } else {
    let embed = new MessageEmbed().setColor("RED").setTitle(`Something went wrong.\nYou probably don't have enough points.`);
    if (initialMessage) {
      initialMessage.edit({ embeds: [embed] });
    } else {
      await message.channel.send({ embeds: [embed] });
    }
    return;
  }
};
