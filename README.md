[![Build Status](https://travis-ci.org/mskilab/gGnome.js.svg?branch=master)](https://travis-ci.org/mskilab/gGnome.js)
[![codecov.io](https://img.shields.io/codecov/c/github/mskilab/gGnome.js.svg)](https://codecov.io/github/mskilab/gGnome.js?branch=master)

# Project gGnome

## Demo

You may find the online version of the gGnome.js project at the following [location](https://xanthopoulakis.github.io/).

## Requirements

For execution, you will only need Node.js installed on your environment.

### Node

[Node](http://nodejs.org/) is really easy to install and now includes [NPM](https://npmjs.org/).
You should be able to run the following command after the installation procedure
below:

    $ node --version
    v0.10.24

    $ npm --version
    1.3.21

#### Node installation on OS X

Please install [Homebrew](http://brew.sh/) if it's not already done with the following command:

    $ ruby -e "$(curl -fsSL https://raw.github.com/Homebrew/homebrew/go/install)"

If everything when fine, you should run

    brew install node

#### Node installation on Linux

    sudo apt-get install python-software-properties
    sudo add-apt-repository ppa:chris-lea/node.js
    sudo apt-get update
    sudo apt-get install nodejs

#### Node installation on Windows

Just go on [official Node.js website](http://nodejs.org/) & grab the installer.
Also, be sure to have `git` available in your PATH, `npm` might need it.

---

## Install

    $ git clone git@github.com:mskilab/gGnome.js.git
    $ npm install

## Start application

In the project folder, you may initiate the application via the terminal:

    $ cd gGnome.js/
    $ ./start.sh

In case it doesn't start automatically, open your preferred browser and navigate to the url

    http://localhost:8080/index.html


The validation of the data.json files is available at the respective Validator page

    http://localhost:8080/validator.html
    
---

## Configuration

The application is reading 

- the intervals, the walks, and their connections from the json file in gGnome.js/json/data.json
- the genes from the json file in gGnome.js/json/genes.json
- the chromosome metadata from the json file in gGnome.js/json/metadata.json

In order to test your own data, simply replace the file gGnome.js/json/data.json with your own, on condition you maintain the same structure