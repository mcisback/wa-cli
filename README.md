# Whatsapp CLI

You can control whatsapp using cli commands

# Installation

```
git clone thisrepo
cd thisrepo
npm i

chmod +x wa-cli.js

sudo cp wa-cli.js /usr/local/bin
```

# Usage

## Login

```
wa-cli --newSession
```

Use your mobile to link a device as you would have done for a regular use

Wait for the chat interface to load completely and the close browser (this is not headless **yet**)

Save the session chrome id for example: 1ef96f6b-c3e5-6ea0-bb28-36286423835a

## Run Whatsapp

This open a whatsapp chat window

```
wa-cli --loadSession 1ef96f6b-c3e5-6ea0-bb28-36286423835a
```

## Run Commands

This is still in development

```
wa-cli --loadSession 1ef96f6b-c3e5-6ea0-bb28-36286423835a list-chats
```
