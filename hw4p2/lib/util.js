'use strict';


// cleanup, promisify.all()?
const util = require('util');
const fs = require('fs');
const [exists, open, unlink, writeFile] = [fs.exists, fs.open, fs.unlink, fs.writeFile].map(util.promisify)

// helpers
const delay_ms = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}


const random_string = (length = 8, mixCase = false) => {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const chars = (mixCase ? letters.toLowerCase() + letters.toUpperCase(): letters.toLowerCase());
  const ls = new Array(length).fill('a').map(() => chars.charAt(Math.floor(Math.random() * chars.length)));
  return ls.join('');
}


Promise.map = async (vals = [], fn) => {
  const ps = [];

  for (const val of vals) {
    ps.push(await fn(val));
  }

  return ps;
}


module.exports = {
  delay_ms,
  random_string,
  // promisified
  exists,
  open,
  unlink,
  writeFile
};
