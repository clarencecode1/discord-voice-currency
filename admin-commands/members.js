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
      joined: new Date(user.joinedAt).toString(),
    });
  });

  console.log(people); /* 

  for(let i = 0; i < people.length; i ++) {
    
  } */
};
