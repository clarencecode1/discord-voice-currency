const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PermissionsSchema = new Schema({ flag: String });

const roleSchema = new Schema({
  guild_id: {
    type: String,
    required: true,
  },
  role_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    default: -1,
  },
  stock: {
    type: Number,
    required: true,
    default: -1,
  },
  multiplier: {
    type: Number,
    required: true,
    default: 1,
  },
  permissions: {
    type: [PermissionsSchema],
    default: undefined,
  },
});

module.exports = mongoose.model("Role", roleSchema);
