const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const robSchema = new Schema({
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
  victim_id: {
    type: String,
    required: true,
    default: 0,
    index: true,
  },
  started_at: {
    type: Date,
    required: true,
  },
  victim_balance_at_start: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model("Rob", robSchema);
