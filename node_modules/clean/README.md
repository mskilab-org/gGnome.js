[![NPM version](https://badge.fury.io/js/clean.png)](http://badge.fury.io/js/clean)
[![Build Status](https://travis-ci.org/kaelzhang/node-clean.png?branch=master)](https://travis-ci.org/kaelzhang/node-clean)
[![Dependency Status](https://gemnasium.com/kaelzhang/node-clean.png)](https://gemnasium.com/kaelzhang/node-clean)

# clean

Clean is small but powerful node.js module that parses and santitize argv or options for node, supporting:

- fully extendable types
- shorthands
- validatiors
- setters

# Installation and Usage

```sh
npm install clean --save
```

```js
var clean = require('clean')(options);
```

# Usage

## Argv Shorthands

We can define shorthands with the option `options.shorthands`.

```js
var shorthands = {
	// if `String`, define a shorthand for a key name
	c: 'cwd',
	// if `Array`, define a pattern slice of argv
	nr: ['--no-recursive'],
	// if `Object`, define a specific value
	r3: {
		retry: 3,
		strict: false
	}
};
clean({
	shorthands: shorthands
}).argv(['node', 'xxx', '-c', 'abc', '--nr', '--r3']); 
// notice that '-nr' will be considered as '-n -r'
// The result is:
// {
//		cwd: 'abc',
//		recursive: false,
//		retry: 3,
//		strict: false 
// }
```

## Types

```js
clean({
	schema: {
		cwd: {
			type: require('path')
		},
		
		retry: {
			type: Boolean
		}		
	}
}).parseArgv(
	['node', 'xxx', '--cwd', 'abc', 'retry', 'false'], 
	function(err, results, details){
		console.log(results.cwd); // the `path.resolved()`d 'abc'
		console.log(results.retry === false); // is a boolean, not a string
	}
)
```

How to extend a custom type ? See the "advanced section".

## Validators and Setters

Validators and setters of `clean` is implemented by `[checker](https://github.com/kaelzhang/node-checker)`, check the apis of `checker` for details.

You could check out the demo located at "example/clean.js". That is a very complicated situation of usage.

```sh
node example/clean.js --username guest
```



# Programatical Details

## constructor: clean(schema, options)


### options

#### options.offset `Number=`

The offset from which the parser should start to parse. Optional. Default to `2`.

#### options.shorthands `Object=`

The shorthands used to parse the argv.

#### options.schema `Object=`

The schema used to clean the given object or the parsred argv

#### options.check_all `Boolean=false`

#### options.parallel `Boolean=false`

#### options.limit `Boolean=false`


## .argv(argv)

Parses the argument vector, without cleaning the data.

### argv `Array`

### returns `Object`

The parsed object with shorthand rules applied.


## .clean(data, callback)

Cleans the given data according to the `schema`.

### data `Object`

The given data.

### callback `function(err, results, details)`


## .parseArgv(argv, callback)

Parses argument vector (argv) or something like argv, and cleans the parsed data according to the `schema`.

This method is equivalent to `c.clean(c.argv(argv), callback)`.

# Advanced Section

## .registerType(type, typeDef)






