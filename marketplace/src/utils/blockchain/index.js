const Web3 = require("web3");
const contract = require("./contract");
const metamask = window.web3;

const NETWORK_URL = "http://127.0.0.1:8545";
const web3 = new Web3(new Web3.providers.HttpProvider(NETWORK_URL));

const MemeMarketplace = new web3.eth.Contract(contract.abi, contract.address, {
  from: metamask.eth.accounts[0],
  gas: 3000000,
});

export const awardMemeToken = (tokenMetadata, callback) => {
  let data = MemeMarketplace.methods
    .awardMemeToken(metamask.eth.accounts[0], tokenMetadata)
    .encodeABI();

  metamask.eth.sendTransaction(
    {
      from: metamask.eth.accounts[0],
      to: contract.address,
      data: data,
    },
    function (receipt) {
      callback(null, receipt);
    }
  );
};

export const getTokenOwner = (tokenId, callback) => {
  return new Promise((resolve, reject) => {
    let data = MemeMarketplace.methods.ownerOf(tokenId).encodeABI();

    web3.eth
      .call({
        from: metamask.eth.accounts[0],
        to: contract.address,
        data: data,
      })
      .then((receipt) => {
        receipt.logs.forEach((log) => {
          if (log.data !== "0x") {
            let res = web3.eth.abi.decodeParameters(
              ["address", "string"],
              log.data
            );
            callback(null, res);
            resolve(res);
          }
        });
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export const getTokenMetadata = (tokenId) => {
  return new Promise((resolve, reject) => {
    let data = MemeMarketplace.methods.tokenURI(tokenId).encodeABI();

    web3.eth
      .call({
        from: metamask.eth.accounts[0],
        to: contract.address,
        data: data,
      })
      .then((receipt) => {
        let res = web3.eth.abi.decodeParameters(["string"], receipt);
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export const getTotalSupply = () => {
  return new Promise((resolve, reject) => {
    let data = MemeMarketplace.methods.totalSupply().encodeABI();

    web3.eth
      .call({
        from: metamask.eth.accounts[0],
        to: contract.address,
        data: data,
      })
      .then((receipt) => {
        let res = web3.eth.abi.decodeParameters(["uint256"], receipt);
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};
