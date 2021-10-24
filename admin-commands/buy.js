"use strict";

const config = require("../utilities/config").config;
const User = require("../models/User");
const utils = require("../utilities/utils");
const { incorrectSyntax, finished } = require("../utilities/emojis");
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const jsonfile = require("jsonfile");

module.exports = {
  aliases: ["buy"],
  event: "messageCreate",
};

module.exports.command = async (message) => {
  let yesButton = new MessageButton().setCustomId("yes").setEmoji(finished).setStyle("PRIMARY");
  let noButton = new MessageButton().setCustomId("no").setEmoji(incorrectSyntax).setStyle("PRIMARY");

  let guildId = message.guildId;
  let roleName = utils.parseArgs(message.content)._[0];

  let roles = jsonfile.readFileSync("./db/json/roles.json");
  let role = roles.find(({ guild_id, name }) => guild_id === guildId && name.toLowerCase() === roleName.toLowerCase());
  if (!role) {
    utils.sendDelete(message, "Could not find role. Are you sure it is in the shop?");
    return;
  }
  let _role = await message.guild.roles.fetch(role.role_id).catch((err) => console.log(err));
  if (!_role) {
    utils.sendDelete(message, "Server doesn't have the role. Was it removed?");
    return;
  }

  let embed = new MessageEmbed()
    .setColor(_role.hexColor)
    .setTitle(`Buy ${_role.name}?`)
    .addField("Price", `💵  ${role.price}`)
    .addField("Stock", `${role.stock} roles`)
    .addField("Multiplier", `${role.multiplier}x`);

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
        buyRole(message, _role, role.price);
        break;
      case "no":
        selectedButton = noButton;
        break;
    }

    let row = new MessageActionRow().addComponents(selectedButton);

    await interaction.update({ components: [row] }).catch((err) => console.log(err));

    buttonCollector.stop(["Collected reaction"]);
  });
};

const buyRole = async (message, role, price) => {
  let user_id = message.author.id;
  let roleManager = message.member.roles;

  let roles = roleManager.cache;
  let alreadyHasRole = false;
  roles.map((_role) => {
    if (_role.id === role.id) {
      alreadyHasRole = true;
      return;
    }
  });

  if (alreadyHasRole) {
    utils.sendDelete(message, `You already have the ${role.name} role.`);
    return;
  }
  let success = await utils.takePoints(user_id, price);

  if (success) {
    utils.sendDelete(message, `Successfully bought ${role.name}.`);
    roleManager.add(role, "Bought with points");
  } else {
    utils.sendDelete(message, `Not enough points.`);
  }
};
