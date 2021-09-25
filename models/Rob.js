const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const robSchema = new Schema({
  guild_id: {
    type: String,
    required: true,
    index: true,
  },
  from_id: {
    type: String,
    required: true,
    index: true,
  },
  to_id: {
    type: Number,
    required: true,
    default: 0,
    index: true,
  },
  started_at: {
    type: Date,
    required: true,
  },
});

module.exports = mongoose.model("Rob", robSchema);
