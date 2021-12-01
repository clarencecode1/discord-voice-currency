const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const robCdSchema = new Schema({
  guild_id: {
    type: String,
    required: true,
    index: true,
  },
  robber_id: {
    type: String,
    required: true,
    index: true,
  },
  expire_at: {
    type: Date,
    default: Date.now,
    index: { expires: "5m" },
  },
});

module.exports = mongoose.model("RobCooldown", robCdSchema);
