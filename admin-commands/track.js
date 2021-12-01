"use strict";

const config = require("../utilities/config").config;
const Server = require("../models/Server");
const User = require("../models/User");
const utils = require("../utilities/utils");
const { incorrectSyntax, finished } = require("../utilities/emojis");

module.exports = {
  aliases: ["track"],
  event: "voiceStateUpdate",
};

const alreadyIsTracked = `This server is already being tracked, run \`${config.prefix}untrack\` to untrack.`;



const isActive = (voiceState) => {
  // Double negation to convert to boolean, might be confusing at first.
  const isInVoice = !!voiceState.channel;
  //const isNotDeaf = !voiceState.deaf;
  return isInVoice;
};

module.exports.func = async (oldState, newState) => {
  // New voice event, here's what we need to do
  // First of all check if the guild the event happened in is being tracked.
  let guild_id = newState.guild.id;
  let _server = await Server.findOne({ guild_id });

  if (!(_server && _server.is_enabled)) {
    return;
  }

  let user_id = newState.id;

  utils.updatePoints(user_id, newState.guild, oldState);
};

module.exports.command = async (message) => {
  let finishReaction;
  let guild_id = message.guildId;
  let _server = await Server.findOne({ guild_id });

  // We did not find the _server, create the model.
  if (!_server) {
    let guild_name = message.guild.name;
    _server = new Server({
      guild_id,
      guild_name,
      is_enabled: true,
      bot_channel: message.channel.id,
    });
  } // Server already exists, enable or send message
  else {
    if (!_server.is_enabled) {
      _server.is_enabled = true;
      _server.bot_channel = message.channel.id;
    } else {
      message.channel.send(alreadyIsTracked);
    }
  }

  try {
    finishReaction = finished;
    await _server.save();
  } catch (err) {
    finishReaction = incorrectSyntax;
    console.log(err);
  }

  utils.react(message, finishReaction);
};
