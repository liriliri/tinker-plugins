# tinker-mailbox

An email client plugin for [TINKER](https://github.com/liriliri/tinker), with IMAP receive ([imapflow](https://imapflow.com/)) and SMTP send ([nodemailer](https://nodemailer.com/)).

![Screenshot](https://raw.githubusercontent.com/liriliri/tinker-plugins/master/packages/tinker-mailbox/screenshot.png)

## Features

- **Multi-account** IMAP/SMTP setup with presets for Gmail, Outlook, QQ, 163, and more
- **Folder browsing** with local cache, idle sync, and pull-to-load older messages
- **Message reading** for plain text and HTML mail
- **Compose & send** with rich-text formatting (bold, lists, font size, etc.)
- **Move & delete** messages via context menu (trash or permanent delete)
## Installation

Download and install TINKER from `https://tinker.liriliri.io/`, then run `npm i -g tinker-mailbox`.

## Usage

1. Add an email account and fill in IMAP/SMTP settings (or use a provider preset from the email domain)
2. Select a folder in the sidebar to browse messages
3. Click a message to read it; right-click to move or delete
4. Click **Compose** to write and send a new message
5. Use the toolbar to switch accounts, edit settings, or refresh the current folder
