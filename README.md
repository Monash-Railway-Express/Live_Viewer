# Live Viewer for MREx CAN feed

Installable webpage to view CAN messages in the MREx Wallaby locomotive system in real time, with a togglable translation layer.

## Getting started

### Installation

Go to https://monash-railway-express.github.io/Live_Viewer

An install prompt should appear. It might take a minute and you might need to interact with the page before it appears. On mobile, you might need to visit the browser menu and find "Add to home screen" or similar.

### Usage

#### 1. Permit insecure WebSocket connections

If using a Chromium browser such as Chrome or Edge: go to chrome://flags and search for Insecure origins treated as secure. Enter the URL of any insecure WebSocket domain that you wish to access such as ws://10.0.0.1 and select Enabled. Reload your browser. [Screenshot](./insecure.png).

#### 2. Open the viewer

https://monash-railway-express.github.io/Live_Viewer or through the installed application.

#### 3. Connect to the MREx CAN Logger Wi-Fi

Password "YesWeCAN".

#### 4. Connect to the live feed

Ensure that the URL entered in the textbox is the WebSocket server to which you would like to connect (such as ws://10.0.0.1/ws) and hit the Connect button. If you succesfully connect, the server status should display "Connection opened.".

## JSON comments

sheet.json last updated 07/04/2026 from https://docs.google.com/spreadsheets/d/1OaXG5B06xnvpNkGQIkrtbM_n-pCCqvnd99yezD7YYoQ/edit?usp=sharing

sheet.object_dictionary.index.subindex.interpretation is "unsigned", "signed", "hex" or else a JSON object listing state descriptions.

sheet.pdo_entries is [...PdoMapEntry]

spec.json last updated 17/02/2026 from https://github.com/Monash-Railway-Express/CAN_MREx