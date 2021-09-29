"use strict";

const config = require("../utilities/config").config;
const Server = require("../models/Server");
const User = require("../models/User");
const utils = require("../utilities/utils");
const { rock, paper, scissors } = require("../utilities/emojis");
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");

module.exports = {
  aliases: ["joined", "members"],
  event: "messageCreate",
};

module.exports.command = async (message) => {
  let people = [];
  let { cache } = message.guild.members;

  cache.map((user) => {
    people.push({
      username: user.displayName,
      joined: new Date(user.joinedAt),
    });
  });

  let isSorted;

  do {
    isSorted = true;

    for (let i = 0; i < people.length - 1; i++) {
      if (people[i].joined > people[i + 1].joined) {
        isSorted = false;
        let temp = people[i];
        people[i] = people[i + 1];
        people[i + 1] = temp;
      }
    }
  } while (!isSorted);

  let bigField = [""];

  for (let index = 0; index < 10; index++) {
    let joinedStamp = people[index].joined.toString().split(" ").slice(0, 5).join(" ");
    bigField[index] = `**${index + 1}. ${people[index].username}** - ${joinedStamp}`;
  }

  bigField = bigField.join("\n");

  // Construct embed
  let embed = new MessageEmbed().setColor("DARK_BUT_NOT_BLACK").setTitle(`${message.guild.name} first people that joined`).addField(`Top 10`, bigField);

  message.channel.send({ embeds: [embed] });
};
