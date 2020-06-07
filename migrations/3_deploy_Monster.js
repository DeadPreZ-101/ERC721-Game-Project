const Monster = artifacts.require("Monster");

module.exports = function(deployer) {
  deployer.deploy(Monster);
};
