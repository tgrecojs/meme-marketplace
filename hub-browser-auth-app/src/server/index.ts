/** Provides nodejs access to a global Websocket value, required by Hub API */
(global as any).WebSocket = require("isomorphic-ws");

import koa from "koa";
import Router from "koa-router";
import logger from "koa-logger";
import json from "koa-json";
import bodyParser from "koa-bodyparser";
import websockify from "koa-websocket";
import cors from "@koa/cors";

import dotenv from "dotenv";

import wss from "./wss";

dotenv.config();

if (!process.env.USER_API_KEY || !process.env.USER_API_SECRET) {
  process.exit(1);
}

const PORT = parseInt(process.env.PORT, 10) || 3001;

const app = websockify(new koa());

/** Middlewares */
app.use(json());
app.use(logger());
app.use(bodyParser());

/* Not safe in production */
app.use(cors());

/**
 * Start HTTP Routes
 */
const router = new Router();
app.use(router.routes()).use(router.allowedMethods());

/**
 * Create Websocket endpoint for client-side token challenge
 *
 * See ./wss.ts
 */
app.ws.use(wss);

/** Start the server! */
app.listen(PORT, () => console.log("Server started."));
