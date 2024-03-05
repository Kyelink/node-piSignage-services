# node-red-contrib-piSignage-services

![Platform](https://img.shields.io/badge/platform-Node--RED-red)
![npm](https://img.shields.io/badge/npm-v0.1.0-blue)
![Downloads](https://img.shields.io/badge/downloads-0k-green)
![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)

Implement your Node-RED flows with the services proposed by the RESTful API of piSignage for opensource server.

**Warning: Beta version - piSignage-services will change in the next releases!**

The REST API module provides a generic interface to various subsystems of the piSignage platform.

## Requirements

Ensure you provided your login/password for the opensource server in the credentials, write your hostname on the model http://IPserver:port

## Use

# Files

You can either get all your files uploaded without providing any input, or get one, delete, or rename a file providing his name (including his extension) or upload a local file, using his full path (including his name).
Component for files currently only works for pictures and not yet for videos, it'll be updated in subsequent versions.

# Playlists

You can either get all your playlists without providing any input, or you can provide the playlist name to delete it, create it, getting infos aboout it, or add/remove an uploaded file, providing also its name.

## Installation

No particular setup is required.
