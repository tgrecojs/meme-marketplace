/** Provides nodejs access to a global Websocket value, required by Hub API */
(global as any).WebSocket = require("isomorphic-ws");

import koa from "koa";
import websockify from "koa-websocket";

import dotenv from "dotenv";

import wss from "./wss";

dotenv.config();

if (!process.env.USER_API_KEY || !process.env.USER_API_SECRET) {
  process.exit(1);
}

const PORT = parseInt(process.env.PORT, 10) || 3001;

const app = websockify(new koa());

/**
 * Create Websocket endpoint for client-side token challenge
 *
 * See ./wss.ts
 */
app.ws.use(wss);

/** Start the server! */
app.listen(PORT, () => console.log("Server started."));
