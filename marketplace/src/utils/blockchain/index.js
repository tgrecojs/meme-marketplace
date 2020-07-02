const Web3 = require("web3");
const contract = require("./contract");
const NETWORK_URL = "http://127.0.0.1:8545";

const web3 = new Web3(new Web3.providers.HttpProvider(NETWORK_URL));

const keystore = {
  address: "0x78d96931f653c8899A541350f2338aBE46c74E12",
  privateKey:
    "0x1ff159d2f717e3edffde28590b545b21ae513a3157cd2c336f3248b14f517470",
};

const MemeMarketplace = new web3.eth.Contract(contract.abi, contract.address, {
  from: keystore.address,
  gas: 3000000,
});

export const awardMemeToken = (tokenMetadata, callback) => {
  return new Promise((resolve, reject) => {
    let data = MemeMarketplace.methods
      .awardMemeToken(keystore.address, tokenMetadata)
      .encodeABI();
    const Tx = require("ethereumjs-tx").Transaction;
    const privateKey = new Buffer.from(keystore.privateKey.substr(2), "hex");

    web3.eth.getTransactionCount(keystore.address).then((nonce) => {
      const rawTx = {
        nonce: nonce,
        gasPrice: 9000000000,
        gasLimit: 4300000,
        from: keystore.address,
        to: contract.address,
        data: data,
      };

      const tx = new Tx(rawTx, {
        chain: "mainnet",
        hardfork: "homestead",
      });

      tx.sign(privateKey);

      const serializedTx = tx.serialize();

      web3.eth
        .sendSignedTransaction("0x" + serializedTx.toString("hex"))
        .on("transactionHash", function (hash) {
          console.log(`hash: ${hash}`);
        })
        .on("receipt", function (receipt) {
          console.log(`receipt: ${JSON.stringify(receipt)}`);
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
        .on("confirmation", function (confirmationNumber, receipt) {
          console.log(
            `confirmationNumber: ${confirmationNumber}, receipt: ${receipt} `
          );
        })
        .on("error", function (error) {
          console.error(error);
          reject(error);
        });
    });
  });
};

export const getTokenOwner = (tokenId, callback) => {
  return new Promise((resolve, reject) => {
    let data = MemeMarketplace.methods.ownerOf(tokenId).encodeABI();

    web3.eth
      .call({
        from: keystore.address,
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
        from: keystore.address,
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
        from: keystore.address,
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
