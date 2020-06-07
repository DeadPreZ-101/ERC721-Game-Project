const ERC721Contract = artifacts.require("ERC721Contract");

module.exports = function(deployer, _network) {
  deployer.deploy(ERC721Contract);
};
