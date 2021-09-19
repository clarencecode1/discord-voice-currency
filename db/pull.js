const jsonfile = require("jsonfile");
const Role = require("../models/Role")

const pullModel = async (file, model, name) => {
    const data = await model.find({})
    jsonfile.writeFileSync(file, data, { spaces: 2 });

    console.log(`Pulled ${name}`)
}

module.exports.pullAll = async => {
  const rolesFile = "./db/json/roles.json";
  pullModel(rolesFile, Role, "roles")
};