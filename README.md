# node-red-contrib-piSignage-services

![Platform](https://img.shields.io/badge/platform-Node--RED-red)
![npm](https://img.shields.io/npm/v/@tec6/node-red-pisignage-services?color=blue)
![Downloads](https://img.shields.io/npm/dt/@tec6/node-red-pisignage-services?color=green)
![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)

Implement your Node-RED flows with most of the services proposed by the RESTful API of piSignage for servers.

**Warning: Beta version - piSignage-services will change in the next releases!**

The REST API module provides a generic interface to various subsystems of the piSignage platform.

## Requirements

Ensure you provided your login/password in the credentials, write your hostname on the model http://IPserver:port for the opensource server, or on https://yourusername.pisignage.com for the hosted service. Check the "Open-source server" checkbox accordingly.

## Use

# Files

You can either get all your files uploaded without providing any input, or get one, delete, or rename a file providing his name (including his extension) or upload a local file, using his full path (including his name).
You can also upload a file with his raw data, ensure you provide its exact mime-type and name, and data that can be converted in a buffer with javascript's Buffer.from(data).

# Playlists

You can either get all your playlists without providing any input, or you can provide the playlist name to delete it, create it, getting infos about it, or add/remove an uploaded file, providing also its name.
Changes on a deployed playlists will be automatically reverbed on the player and the group, unless you have video files in it, you'll have to manually deploy the group associated.

# Players

You can either get all your players without providing any input, or you can provide the player's id to delete it, update it, getting infos about it, or execute controls on it or on it's attached TV.
Additional fields will be required in order to create or update a player.
**Warning : the "toggle pause" command is correctly implemented, but it's currently doing nothing as it's the REST API command that's not working at the moment the node was developed.**

# Groups

You can either get all your groups without providing any input, or you can provide the group's id to delete it, getting infos about it, you can also create one by providing its name.
You can add or remove playlists to the group providing the playlist name, it'll deploy automatically, you can also just deploy without modifications.


## Installation

No particular setup is required.
