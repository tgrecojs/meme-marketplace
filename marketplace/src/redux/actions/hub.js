import types from "../constants";
import { Client, Buckets } from "@textile/hub";
import { Libp2pCryptoIdentity, ThreadID } from "@textile/threads-core";
import {
  getTotalSupply,
  awardMemeToken,
  getTokenMetadata,
  getTokenOwner,
} from "../../utils/blockchain";

const API = false ? "http://localhost:3007" : undefined;

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
 * Method for using the server to create credentials without identity
 */
const createCredentials = async () => {
  const response = await fetch(`/api/userauth`, {
    method: "GET",
  });
  const userAuth = await response.json();
  return userAuth;
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
            /** User our identity to sign the challenge */
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

    /** Render our avatar */
    /* displayAvatar(identity) */

    /** Get the public key */
    const publicKey = this.id.public.toString();

    /** Return the publicKey short ID */
    return publicKey;
  };

  listThreads = async () => {
    if (!this.auth) {
      throw Error("User not authenticated");
    }

    /** Setup a new connection with the API and our user auth */
    const client = Client.withUserAuth(this.auth, API);

    /** Query for all the user's existing threads (expected none) */
    const threads = await client.listThreads();

    /** Query for all the user's existing buckets (expected none) */

    /** Display the results */
    console.log(JSON.stringify(threads.listList));
    /* displayThreadsList(JSON.stringify(result.listList)); */
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

  /**
   * Provides a basic auth where
   * - the server doesn't care about the user identity
   * - the server just provides user auth on any request
   *
   * see simple.html for example running this method
   */
  simpleAuth = async () => {
    if (!this.id) {
      throw Error("No user ID found");
    }

    /** Use the simple auth REST endpoint to get API access */
    this.auth = await createCredentials();

    console.log("Verified on Textile API");
    /* displayStatus(); */

    /** The simple auth endpoint generates a user's Hub API Token */
    const client = Client.withUserAuth(this.auth, API);
    const token = await client.getToken(this.id);

    /** Update our auth to include the token */
    this.auth = {
      ...this.auth,
      token: token,
    };
  };

  getBucketThreadID = async () => {
    try {
      var storedThread = localStorage.getItem("bucket-thread-id-1");
      if (storedThread === null) {
        throw new Error("No thread id");
      }
      const restored = ThreadID.fromString(storedThread);
      return restored;
    } catch (e) {
      const newThread = ThreadID.fromRandom();
      localStorage.setItem("bucket-thread-id-1", newThread.toString());
      return newThread;
    }
  };

  createBucket = async () => {
    /** Authenticate and open a Bucket */
    this.buckets = await Buckets.withUserAuth(this.auth);
    const root = await this.buckets.open("memes");
    this.bucketKey = root.key;
    return this.buckets;
  };

  doesBucketExist = async () => {
    /**
     * List existing Buckets
     */
    if (this.buckets) {
      const roots = await this.buckets.list();
      console.log(roots);
      const existing = roots.find((bucket) => bucket.name === "memes");
      console.log(existing);
      return existing;
    } else {
      return false;
    }
  };

  // Read existing Buckets
  readBuckets = async (path) => {
    // Check if the Bucket Exists or not
    const exists = await this.doesBucketExist();

    if (exists) {
      console.log("Data Found");
      const bucketKey = exists.key;
      return this.buckets.pullPath(bucketKey, path);
    } else {
      console.error("Data Not Found");
      return null;
    }
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

  listBucketPaths = async (path) => {
    // Check if the Bucket Exists or not
    const exists = await this.doesBucketExist();

    if (exists) {
      const paths = await this.listPath(exists.key, path);
      return paths;
    } else {
      console.error("Bucket does not exist");
      return null;
    }
  };
}

const hubClient = new HubClient();

export const setupIdentity = (payload) => async (dispatch) => {
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

export const createBucket = (payload) => async (dispatch) => {
  const bucket = await hubClient.createBucket();
  dispatch({
    type: types.CREATE_BUCKET,
    payload: bucket,
  });
};

export const doesBucketExist = (payload) => async (dispatch) => {
  const exists = await hubClient.doesBucketExist();
  dispatch({
    type: types.DOES_BUCKET_EXIST,
    payload: exists,
  });
};

export const readBucket = (payload) => async (dispatch) => {
  const bucket = await hubClient.readBuckets(payload.path);
  dispatch({
    type: types.READ_BUCKET,
    payload: bucket,
  });
};

export const addDataToBucket = (payload) => async (dispatch) => {
  const result = await hubClient.addFileToBucket(payload.path, payload.content);
  dispatch({
    type: types.ADD_FILE_TO_BUCKET,
    payload: result,
  });
};

export const listPath = (payload) => async (dispatch) => {
  const result = await hubClient.listBucketPaths(payload.path);
  dispatch({
    type: types.LIST_BUCKET_PATH,
    payload: result,
  });
};

export const registerMeme = (payload) => async (dispatch) => {
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

export const getTotalMemes = (payload) => async (dispatch) => {
  // Gets total number of registered memes
  getTotalSupply((err, res) => {
    console.log(err, res);
  });
};
