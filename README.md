# JSONView for Chrome

A Chrome extension to pretty-print JSON files viewed from within the browser.

## Building

### Rebuilding JSON parser

The JSON parser in `workerJSONLint.js` is generated using [jison](https://github.com/zaach/jison).

It can be regenerated like so:

    git clone git@github.com:zaach/jison.git
    cd jison
    npm install
    node ./examples/json.js > workerJSONLint.js
    # Then just move the file into place...
