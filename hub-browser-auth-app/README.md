# Textile Hub Web App Example

This example includes a server in `src/server`. The example demonstrates how to use the [Textile Hub](https://docs.textile.io/) APIs from the Browser using user identities and **user group keys**.

Read the full tutorial accompanying this example on [docs.textile.io](https://docs.textile.io).

#### WARNING

_Do not share any API Key Secrets. This includes User Group Key secret and Account key Secrets. Be sure you never commit them into public repos or share them in published apps._

## Configure

Create a `.env` file in the root of your project. Ensure you never check this file into your repo or share it, it contains your User Group Key Secret.

```bash
cp example.env .env
```

Then replace the `USER_API_KEY` and `USER_API_SECRET` values with those you create using the Textile Hub and your own account or org (see [docs.textile.io](https://docs.textile.io) for details).

## Setup

```bash
npm install
```

### Build all examples

The Server and Client code will be written to folders in `dist/`

```bash
npm run build
```

### Clean

```bash
npm run clean
```

## Running examples

Follow [this tutorial]() on Filecoin docs to get started.
