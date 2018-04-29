# document [![NPM version](https://badge.fury.io/js/document.png)](http://badge.fury.io/js/document) [![Dependency Status](https://gemnasium.com/kaelzhang/node-document.png)](https://gemnasium.com/kaelzhang/node-document)
<!-- [![Build Status](https://travis-ci.org/kaelzhang/node-document.png?branch=master)](https://travis-ci.org/kaelzhang/node-document) -->

**Document** is another documentation generator with which everything will be done by only **ONE** command.

It is written in node.js, and you could easily install **document** with [NPM](https://npmjs.org/).

## Life gets easier

To create your document site, just:

```
cd /path/to/your/repo
document
```

Oh YEAH! That's it! We made it!

## Features

- Could not be easier ! Just ONE command!
- Build with [node.js](http://nodejs.org), yeah !
- CommonJS [package/1.0](http://wiki.commonjs.org/wiki/Packages/1.0) spec friendly.
- Designed to minimize arguments and configurations as much as possible.
- Support documents of multiple languages.
- Supports [GitHub Flavored Markdown](https://help.github.com/articles/github-flavored-markdown).
- Support subdirectories.
- Lovely and SEO friendly URLs.
- Application cache so that to afford heavy traffic.
- Custom themes and dev guide with `grunt-init` task. (what's comming...) 
- `document` middleware for [express.js](http://expressjs.com). (what's comming...)


## Installation

Easily install from [NPM](https://npmjs.org/):

```sh
npm install document -g
```


## Usage

Visit [the document site](http://kael.me/document) for details.


## Why a node.js version of daux.io?

The first time when I met daux.io: Wow.

Setting up nginx conf and trying to install daux.io under a sub path: Oh no!

Spelunking into the source code: \_(:3」∠)\_

That's it.


## Credits

`document@0.x.x` uses the theme of [daux.io](daux.io), thanks a million.

## Contribution

- issues: [https://github.com/kaelzhang/node-document/issues](https://github.com/kaelzhang/node-document/issues)
- any [forks](https://github.com/kaelzhang/node-document/fork) and pull requests are welcome.


## What's comming!

### Vision `1.x.x`

> Actually, all those features below has been designed and implemented at the very beginning, but they were not fully tested yet.
>
> I will release them immediately when the test cases are ok.

- You will be able to `require('document')` as an express middleware. (actually it already is)
- Custom themes support.
- Plugins.
- Programmatical APIs.
- Watcher support so that you can uodate your documents without restarting your server.






