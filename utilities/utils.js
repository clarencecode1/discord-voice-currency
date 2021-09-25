const config = require("./config").config;
const { finished, incorrectSyntax } = require("./emojis");
const User = require("../models/User");

module.exports.sendDelete = async (
  message,
  string,
  time = config.message_life * 1000
) => {
  let _msg = await message.channel.send(string);

  setTimeout(() => {
    _msg.delete();
  }, time);
};

module.exports.edit = async (message, string) => {
  if (message.editable) {
    return message
      .edit(string)
      .then((msg) => {
        msg.edit(string);
        return msg.fetch();
      })
      .catch(console.error);
  } else {
    return message.channel
      .send(`...`)
      .then((msg) => {
        msg.edit(string);
        return msg.fetch();
      })
      .catch(console.error);
  }
};

module.exports.isTrusted = (message) => {
  let member = message.member;
  if (member) {
    let { permissions } = member;
    return permissions.has("BAN_MEMBERS", true);
  } else return false;
};

module.exports.react = (message, reaction = finished) => {
  let { reactions } = message;
  reactions.removeAll();
  message.react(reaction);
};

const isFlag = (string) => {
  return isNaN(parseInt(string)) && string.startsWith("-");
};

module.exports.parseArgs = (string) => {
  let parsedArgs = {
    _: [],
  };

  let split = string.toLowerCase().split(/\s+/);
  if (split[0] === config.prefix) {
    args = split.slice(2);
  } else {
    args = split.slice(1);
  }

  for (let i = 0; i < args.length; i++) {
    if (isFlag(args[i])) {
      args[i] = args[i].substr(1);
      // If the next one is not a flag, set this one's value to it
      if (args[i + 1] && !isFlag(args[i + 1])) {
        parsedArgs[args[i]] = args[i + 1];
        i++;
      } else {
        parsedArgs[args[i]] = true;
      }
    } else {
      parsedArgs._.push(args[i]);
    }
  }

  return parsedArgs;
};

module.exports.getUser = async (message, id) => {
  return message.client.users.fetch(id);
};

module.exports.getPoints = async (message, user_id) => {
  // Look for the user with the given uid

  let _user = await User.findOne({ user_id });

  if (!_user) {
    _user = new User({
      guild_id: message.guildId,
      user_id: user_id,
      points: 0,
      is_active: false,
      is_active_since: Date.now(),
    });
  }

  return _user.points;
};

module.exports.givePoints = async (message, user_id, points) => {
  let finishReaction;
  // Look for the user with the given uid

  let _user = await User.findOne({ user_id });

  // If they do not exist err on believing the admin and create the user without checking if they are actually in the guild.
  // I could do this later but I'm lazy
  if (!_user) {
    _user = new User({
      guild_id: message.guildId,
      user_id: user_id,
      points: parseInt(points),
      is_active: false,
      is_active_since: Date.now(),
    });
  } else {
    // They already exist, so just give them the points.
    _user.points += parseInt(points);
  }

  try {
    finishReaction = finished;
    await _user.save();
  } catch (err) {
    finishReaction = incorrectSyntax;
    console.log(err);
  }

  //message.channel.send(`New balance is ${_user.points}`);

  return _user.points;
};

module.exports.takePoints = async (message, user_id, points) => {
  let _user = await User.findOne({ user_id });

  // If they do not exist, based on the fact that they have 0 points they probably can't afford it
  if (!_user) {
    return false;
  } else {
    // They exist, check if they have enough points.
    if (_user.points > parseInt(points)) {
      _user.points -= parseInt(points);
    } else {
      return false;
    }
  }

  try {
    await _user.save();
    return _user.points;
  } catch (err) {
    console.log(err);
    return false;
  }
};

module.exports.catchError = (err) => {
  console.log(err);
};
