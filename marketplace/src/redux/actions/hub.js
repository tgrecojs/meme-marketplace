import types from "../constants";
import { Buckets } from "@textile/hub";
import { Libp2pCryptoIdentity } from "@textile/threads-core";
import {
  getTotalSupply,
  awardMemeToken,
  getTokenMetadata,
  getTokenOwner,
} from "../../utils/blockchain";

/**
 * Creates a new random keypair-based Identity
 *
 * The identity will be cached in the browser for later
 * sessions.
 */
const getIdentity = async () => {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  try {
    if (urlParams.get("force")) {
      window.history.replaceState({}, document.title, "/");
      throw new Error("Forced new identity");
    }
    var storedIdent = localStorage.getItem("identity");
    if (storedIdent === null) {
      throw new Error("No identity");
    }
    const restored = Libp2pCryptoIdentity.fromString(storedIdent);
    return restored;
  } catch (e) {
    /**
     * If any error, create a new identity.
     */
    try {
      /** Random new identity */
      const identity = await Libp2pCryptoIdentity.fromRandom();

      /** Convert to string. */
      const identityString = identity.toString();

      /** Storing identity for later use */
      localStorage.setItem("identity", identityString);
      return identity;
    } catch (err) {
      return err.message;
    }
  }
};

/**
 * More secure method for getting token & API auth.
 *
 * Keeps private key locally in the app.
 */
const loginWithChallenge = async (id) => {
  return new Promise((resolve, reject) => {
    /**
     * Configured for our development server
     *
     * Note: this should be upgraded to wss for production environments.
     */
    const socketUrl = `ws://localhost:3001/ws/userauth`;

    /** Initialize our websocket connection */
    const socket = new WebSocket(socketUrl);

    /** Wait for our socket to open successfully */
    socket.onopen = () => {
      /** Get public key string */
      const publicKey = id.public.toString();

      /** Send a new token request */
      socket.send(
        JSON.stringify({
          pubkey: publicKey,
          type: "token",
        })
      );

      /** Listen for messages from the server */
      socket.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        switch (data.type) {
          /** Error never happen :) */
          case "error": {
            reject(data.value);
            break;
          }
          /** The server issued a new challenge */
          case "challenge": {
            /** Convert the challenge json to a Buffer */
            const buf = Buffer.from(data.value);
            /** Use our identity to sign the challenge */
            const signed = await id.sign(buf);
            /** Send the signed challenge back to the server */
            socket.send(
              JSON.stringify({
                type: "challenge",
                sig: Buffer.from(signed).toJSON(),
              })
            );
            break;
          }
          /** New token generated */
          case "token": {
            resolve(data.value);
            break;
          }
        }
      };
    };
  });
};

class HubClient {
  /** The users unique pki identity */
  id;

  /** The Hub API authentication */
  auth;

  /** The Bucket Instance */
  buckets;

  /** The Bucket Key */
  bucketKey;

  constructor() {}

  setupIdentity = async () => {
    /** Create or get identity */
    this.id = await getIdentity();

    /** Get the public key */
    const publicKey = this.id.public.toString();

    /** Return the publicKey short ID */
    return publicKey;
  };

  /**
   * Provides a full login where
   * - pubkey is shared with the server
   * - identity challenge is fulfilled here, on client
   * - hub api token is sent from the server
   *
   * see index.html for example running this method
   */
  login = async () => {
    if (!this.id) {
      throw Error("No user ID found");
    }

    /** Use the identity to request a new API token */
    this.auth = await loginWithChallenge(this.id);

    console.log("Verified on Textile API");

    /* Return auth details */
    return this.auth;
  };

  createBucket = async () => {
    /** Authenticate and open a Bucket */
    this.buckets = await Buckets.withUserAuth(this.auth);
    const root = await this.buckets.open("memes");
    this.bucketKey = root.key;
    return this.buckets;
  };

  addFileToBucket = async (path, content) => {
    /**
     * Push the file to the root of the Files Bucket.
     */

    // Check if the Bucket Exists or not
    if (this.buckets) {
      const raw = await this.buckets.pushPath(this.bucketKey, path, content);
      return raw;
    } else {
      console.error("Bucket does not exist");
      return null;
    }
  };
}

const hubClient = new HubClient();

export const setupIdentity = () => async (dispatch) => {
  const publicKey = await hubClient.setupIdentity();
  dispatch({
    type: types.SETUP_IDENTITY,
    payload: publicKey,
  });
};

export const loginAndCreateBucket = () => async (dispatch) => {
  document.getElementById("login").innerHTML = "Creating Hub Identity...";

  // Logging In
  await hubClient.setupIdentity();
  const auth = await hubClient.login();

  dispatch({
    type: types.LOGIN,
    payload: auth,
  });

  document.getElementById("login").innerHTML = "Creating a Bucket...";

  // Creating & Opening a Bucket
  const bucket = await hubClient.createBucket();

  dispatch({
    type: types.CREATE_BUCKET,
    payload: bucket,
  });
};

export const createBucket = () => async (dispatch) => {
  const bucket = await hubClient.createBucket();
  dispatch({
    type: types.CREATE_BUCKET,
    payload: bucket,
  });
};

export const registerMeme = (payload) => async () => {
  const { address, name, price, fileBuffer } = payload;

  document.getElementById("registerMeme").innerText =
    "Adding meme to Textile Bucket...";

  // add meme to bucket
  const result = await hubClient.addFileToBucket(name, fileBuffer);

  document.getElementById("registerMeme").innerText =
    "Registering Meme NFT on Local Blockchain...";

  // register a meme token
  awardMemeToken(
    address,
    `${name},${price},${result.path.path}`,
    (err, res) => {
      if (err) {
        console.error(err);
        document.getElementById("registerMeme").innerText =
          "Failed. Try Again!";
      } else {
        document.getElementById("registerMeme").innerText = "Create Meme";
        document.getElementById("success").style.visibility = "";
      }
    }
  );
};

export const getMemeTokenList = () => async (dispatch) => {
  // Get the total count of meme tokens
  const totalSupply = parseInt((await getTotalSupply())["0"]);

  // Create a request to blockchain to get the meme metadata and owner for each token
  let metadataPromiseArr = [];
  let ownerPromiseArr = [];
  for (let i = 1; i <= totalSupply; i++) {
    metadataPromiseArr.push(getTokenMetadata(i));
    ownerPromiseArr.push(getTokenOwner(i));
  }

  let memesTokenList = await Promise.all(metadataPromiseArr);
  let memesOwnerList = await Promise.all(ownerPromiseArr);

  // Parse the fecthed metadata to get back the meme details
  memesTokenList = memesTokenList.map((token, index) => {
    token = token["0"].split(",");
    let owner = memesOwnerList[0]["0"].split(",")[0];
    return {
      name: token[0],
      price: token[1],
      path: token[2],
      owner: owner,
    };
  });

  dispatch({
    type: types.GET_MEME_TOKEN_LIST,
    payload: {
      memesTokenList: memesTokenList,
      totalMemes: totalSupply,
    },
  });
};
