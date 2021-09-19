const mongoose = require("mongoose")
const Schema = mongoose.Schema

const serverSchema = new Schema({
    guild_id: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    guild_name: {
        type: String,
        required: true,
        unique: true,
    },
    is_enabled: {
        type: Boolean,
        required: true,
    },
})

module.exports = mongoose.model("Server", serverSchema)