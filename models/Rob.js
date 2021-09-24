const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const robSchema = new Schema({
  guild_id: {
    type: String,
    required: true,
  },
  from_id: {
    type: String,
    required: true,
  },
  to_id: {
    type: Number,
    required: true,
    default: 0,
    index: true,
  },
  will_finish_at: {
    type: Date,
    required: true,
  },
});

module.exports = mongoose.model("Rob", robSchema);
