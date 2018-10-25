# Savitar API Client for JavaScript

The official Node.js/Browser library for Savitar's API.

## Table of Contents

1. **[Install](#install)**

    * [Node.js / Browserify / webpack](#nodejs--browserify--webpack)
    * [&lt;script&gt; tag using CDNs](#script-tag-using-cdns)

1. **[Quick Start](#quick-start)**

    * [Initialize the client](#initialize-the-client)


# Getting Started

## Install

#### Node.js / Browserify / webpack

We are [browserify](http://browserify.org/)able and [webpack](http://webpack.github.io/) friendly.

```sh
npm install savitar-api-client --save
# OR
yarn add savitar-api-client
```
#### &lt;script&gt; tag using CDNs

##### Recommended: jsDelivr.com

[jsDelivr](http://www.jsdelivr.com/about.php) is a global CDN delivery for JavaScript libraries.

```html
<script src="https://cdn.jsdelivr.net/npm/savitar-api-client/dist/savitar.min.js"></script>
```

## Quick Start

### Initialize the client

You first need to initialize the client. For that you need your **Application ID** and **Application Secret**.

```js
var savitar = require('savitar-api-client');
// OR
import * as savitar from 'savitar-api-client';


var publicClient = new savitar.PublicClient();
var authenticatedClient = new savitar.AuthenticatedClient('applicationID', 'apiSecret');
```
