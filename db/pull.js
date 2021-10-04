const jsonfile = require("jsonfile");
const Role = require("../models/Role");
const Server = require("../models/Server");

const pullModel = async (file, model, name) => {
  const data = await model.find({});
  jsonfile.writeFileSync(file, data, { spaces: 2 });

  console.log(`Pulled ${name}`);
};

module.exports.pullAll = (async) => {
  const rolesFile = "./db/json/roles.json";
  const serverFile = "./db/json/servers.json";
  pullModel(rolesFile, Role, "roles");
  pullModel(serverFile, Server, "servers");
};
