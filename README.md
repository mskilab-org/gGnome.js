# PROJECT gGnome

## Requirements

For execution, you will only need Node.js installed on your environment.

### Node

[Node](http://nodejs.org/) is really easy to install & now include [NPM](https://npmjs.org/).
You should be able to run the following command after the installation procedure
below.

    $ node --version
    v0.10.24

    $ npm --version
    1.3.21

#### Node installation on OS X

You will need to use a Terminal. On OS X, you can find the default terminal in
`/Applications/Utilities/Terminal.app`.

Please install [Homebrew](http://brew.sh/) if it's not already done with the following command.

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
    $ npm install -g simple-autoreload-server

### Start application

Copy `config.sample.json` to `config.json` then edit it with the url where you have setup:

    $ cd gGnome.js/complete-genome-interval-graph/
    $ autoreload-server -w "**/**.{html,css,js,json}" -r "**/**.{html,css,js,json}" ./ 8080

Open your preferred browser and navigate to the url

    http://localhost:8080/index.html

---

### Configuration

The application is reading 

- the intervals and their connections from the json file in gGnome.js/complete-genome-interval-graph/data.json
- the genes from the json file in gGnome.js/complete-genome-interval-graph/genes.json
- the walks and their connections from the json file in gGnome.js/complete-genome-interval-graph/walks.json
- the chromosome metadata from the json file in gGnome.js/complete-genome-interval-graph/metadata.json