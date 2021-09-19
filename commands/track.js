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

const differenceInSeconds = (oldDate, newDate) => {
  const difference = Math.abs(newDate - oldDate);
  let points = (difference / 1000 / 60);
  return Math.round((points + Number.EPSILON) * 100) / 100
};

const isActive = (voiceState) => {
  // Double negation to convert to boolean, might be confusing at first.
  const isInVoice = !!voiceState.channel;
  const isNotDeaf = !voiceState.deaf;
  return isInVoice && isNotDeaf;
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

  // Check if user is already in database
  let _user = await User.findOne({ guild_id, user_id });

  // If they are not, create a new database and give them 0 points
  if (!_user) {
    _user = new User({
      guild_id,
      user_id,
      points: 0,
      is_active: isActive(newState),
      is_active_since: Date.now(),
    });
  } else {
    // They are already are in db

    // Assign points if they were previously active
    if (_user.is_active) {
      let newPoints = differenceInSeconds(_user.is_active_since, Date.now());
      _user.points += newPoints;
    }
    // TODO: INCORPORATE ROLES FOR POINT MULTIPLIERS

    // Reassign active value
    _user.is_active = isActive(newState);
    _user.is_active_since = Date.now();
  }
  try {
    await _user.save();
  } catch (err) {
    console.log(err);
  }
};

module.exports.command = async (message) => {
  if (!utils.isTrusted(message)) {
    utils.react(message, incorrectSyntax);
    return;
  }

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
