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

Save the sesssion chrome id for example: 1ef96f6b-c3e5-6ea0-bb28-36286423835a

## Run Whatsapp
```
wa-cli --loadSession 1ef96f6b-c3e5-6ea0-bb28-36286423835a
```

## Run Commands

This is still in development

```
wa-cli --loadSession 1ef96f6b-c3e5-6ea0-bb28-36286423835a list-chats
```
