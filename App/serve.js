
const os = require('os');
const path = require('path');

require('array.prototype.flat/auto');
const app = require('express')();
const webpack = require('webpack');
const middleware = require('webpack-dev-middleware');

const arg = (process.argv[2] || ':8080').split(':')
const port = arg.pop();
const addr = arg.pop() || firstPublicAddress() || '0.0.0.0';
function firstPublicAddress() {
  return Object.values(os.networkInterfaces())
        .flat()
        .filter((iface) => iface.family === 'IPv4' && iface.internal === false)
        .map((iface) => iface.address)
        .shift();
}

const webpack_web = webpack(require('./webpack.config.web'));
webpack_web.hooks.done.tap('webpack.serve.js', () => {
  console.log(`[local-home-app] Chrome ondevice testing URL: http://${addr}:${port}/web/index.html`);
});

const webpack_node = webpack(require('./webpack.config.node'));
webpack_node.hooks.done.tap('webpack.serve.js', () => {
  console.log(`[local-home-app] Node ondevice testing URL:   http://${addr}:${port}/node/bundle.js`);
});

app.use('/web', middleware(webpack_web))
   .use('/node', middleware(webpack_node))
   .listen(port);
