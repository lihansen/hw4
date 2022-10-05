'use strict';

const chai = require('chai');
const { expect } = chai;

const fs = require('fs');

const {
  random_string
} = require('../lib/util');

const SCRIPT_TO_TEST = `${__dirname}/../hw4p2.js`;


class Hw4P2Fixture {
  constructor() { 
    this.scriptToTest = SCRIPT_TO_TEST;
    
    this.FILE1 = '/tmp/file1';
    this.FILE2 = '/tmp/file2';
  }

  before() {
    // cleanup
    if (this.fileExists(this.FILE1)) {
      this.deleteFile(this.FILE1);
    }

    if (this.fileExists(this.FILE2)) {
      this.deleteFile(this.FILE2);
    }
  }

  after() {
  }

  createFile(file, content = '') {
    if (this.fileExists(file)) {
      throw new Exception(`cannot create, file exists -- file:${file}`);
    }

    return fs.writeFileSync(file, content);
  }


  deleteFile(file) {
    if (!this.fileExists(file)) {
      throw new Exception(`cannot delete, file does not exist -- file:${file}`);
    }

    return fs.unlinkSync(file);
  }


  fileExists(file) {    
    return fs.existsSync(file);
  }


  uut() {
    return require(SCRIPT_TO_TEST);
  }


  // return a function to validate expected response
  _validator(expectError, expectData, cb) {
    return (err, data) => {
      if (!expectError) {
        expect(err).to.be.null;
      } else {
        expect(err).to.be.an.instanceof(Error);
        expect(err.message).to.equal(expectError);
      }

      if (!expectData) {
        expect(data).to.not.exist;
      } else {
        expect(data).to.exist;
        expect(data).to.equal(expectData);
      }

      cb();
    }
  }

  // ENTITY HELPERS
}


module.exports = {
  Fixture: Hw4P2Fixture
}
