"use strict";

const config = require("../utilities/config").config;
const Rob = require("../models/Rob");
const RobCd = require("../models/RobCooldown");
const utils = require("../utilities/utils");
const { incorrectSyntax, finished } = require("../utilities/emojis");
const { MessageCollector, MessageEmbed } = require("discord.js");

const onCooldown = "You're on cooldown.";
const onCooldownTwo = "No, I won't tell you for how long.";
const missingArguments = "You have to ping the user you want to rob.";
const invalidMention = "You can't rob yourself.";
const alreadyBeingRobbed = "This user is already being robbed.";
const botError = "You cannot rob bots.";

const price = 5;
const DELAY = 5;

module.exports = {
  aliases: ["rob"],
  event: "messageCreate",
};

/* module.exports.func = async (message) => {
  return;
}; */

module.exports.command = async (message) => {
  let user;
  let user_id;
  let guild_id = message.guildId;

  // Check for mentions
  let mentions = message.mentions.members;
  if (mentions.size) {
    if (mentions.first().user === message.author) {
      utils.sendDelete(message, invalidMention);
      return;
    }
    user = mentions.first().user;
    if (user.bot) {
      utils.sendDelete(message, botError);
      return;
    }
    user_id = mentions.first().id;
  } else {
    utils.sendDelete(message, missingArguments);
    return;
  }

  let _rob = await Rob.findOne({ guild_id, robber_id: user_id, victim_id: message.author.id });
  if (_rob) {
    // Counter rob
    endRob(_rob.robber_id, message.author.id, message, _rob);
    await Rob.deleteOne({ guild_id, victim_id: message.author.id });
    return;
  }

  let userPoints = await utils.updatePoints(message.author.id, message.guild);
  let victimPoints = await utils.updatePoints(user_id, message.guild);

  if (price > userPoints) {
    utils.sendDelete(message, `You only have ${userPoints}, robbing costs ${price}.`);
    return;
  }

  _rob = await Rob.findOne({ guild_id, victim_id: user_id });

  // If there's no rob active on the user, create one
  if (!_rob) {
    let _robCd = await RobCd.findOne({ guild_id, robber_id: message.author.id });
    if (_robCd) {
      utils.sendDelete(message, onCooldown);
      setTimeout(() => {
        utils.sendDelete(message, onCooldownTwo);
      }, 1000);
      return;
    }

    _rob = new Rob({
      guild_id,
      robber_id: message.author.id,
      victim_id: user_id,
      started_at: Date.now(),
      victim_balance_at_start: victimPoints,
    });
    _rob.save().catch((err) => console.log(err));

    let embed = new MessageEmbed()
      .setColor("GREEN")
      .setTitle(`${message.author.tag} has started robbing ${user.tag}`)
      .addField("Type this in order to counter the rob", `${config.prefix}${module.exports.aliases[0]} @${message.author.tag}`)
      .setThumbnail(user.avatarURL());
    await message.channel.send({ embeds: [embed] });
    _robCd = new RobCd({
      guild_id,
      robber_id: message.author.id,
    });
    _robCd.save().catch((err) => console.log(err));
  } else {
    // There's already a rob active, cash in
    if (message.author.id === _rob.robber_id) {
      let initialMessage = await message.channel.send(`Robbing will finish in ${DELAY} seconds. The victim can type anything now to save themselves.`);
      const filter = (m) => m.author.id === user_id;
      let messageCollector = new MessageCollector(message.channel, { filter, time: DELAY * 1000 });

      messageCollector.on("collect", async (m) => {
        messageCollector.stop("countered");
      });

      messageCollector.on("end", async (collected, reason) => {
        if (reason === "time") {
          endRob(user_id, message.author.id, message, _rob, initialMessage);
        } else if (reason === "countered") {
          // Counter the rob
          endRob(message.author.id, user_id, message, _rob, initialMessage);
        }
      });
      await Rob.deleteOne({ guild_id, victim_id: user_id });
    } else utils.sendDelete(message, alreadyBeingRobbed);
    return;
  }
};

const endRob = async (from_id, to_id, message, rob, initialMessage = null) => {
  let points = await utils.updatePoints(rob.victim_id, message.guild);
  points -= rob.victim_balance_at_start;
  points = Math.max(points, 0);
  points = Math.round((points + Number.EPSILON) * 100) / 100;
  let timeDifference = utils.differenceInMinutes(rob.started_at, Date.now());

  let fromUser = await utils.getUser(message, from_id);
  let toUser = await utils.getUser(message, to_id);
  let fromBalance = await utils.getPoints(message, from_id, message.guild_id);
  points = Math.min(points, fromBalance);
  let fromNewBalance = await utils.givePoints(from_id, -points, message.guildId);

  let toNewBalance = await utils.givePoints(to_id, points, message.guildId);
  let embed = new MessageEmbed()
    .setColor("GREEN")
    .setTitle(`${toUser.tag} has stolen 💵 ${points} from ${fromUser.tag}.`)
    .addField(`${toUser.tag}'s new balance: `, `💵 ${toNewBalance}`)
    .addField(`${fromUser.tag}'s new balance:`, `💵 ${fromNewBalance}.`)
    .addField(`Minutes since rob started:`, `⌛ ${timeDifference}`)
    .setThumbnail(fromUser.avatarURL());
  if (initialMessage) {
    initialMessage.edit({ embeds: [embed] });
  } else {
    await message.channel.send({ embeds: [embed] });
  }
};
