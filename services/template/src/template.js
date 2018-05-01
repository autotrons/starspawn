const uuid = require("uuid");
const template = async (req, res) => {
  const id = uuid.v4();
  console.log(`uuid ${id}`);
  res.send(`v1 ${id}`);
};

module.exports = {
  template
};
