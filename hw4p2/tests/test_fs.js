'use strict';

const { assert, expect } = require('chai');

const DEFAULT_TIMEOUT_MS = 4e3;
const { Fixture } = require('./fixture_hw4p2');

const {
  random_string
} = require('../lib/util');


describe('concatenates file1 and file2', function () {
  this.timeout(DEFAULT_TIMEOUT_MS);

  const fix = new Fixture();
  const { fileCat } = fix.uut();
  
  beforeEach(() => fix.before());
  afterEach(() => fix.after());
  
  const s1 = random_string();
  const s2 = random_string();

  context('success', () => {
    it('f1 and f2 exist', (cb) => {
      const validator = fix._validator(null, `${s1} ${s2}`, cb);

      fix.createFile(fix.FILE1, s1);  
      fix.createFile(fix.FILE2, s2);  
      fileCat(fix.FILE1, fix.FILE2, validator);    
    });

    it('f1 exist, f2 after', (cb) => {
      const validator = fix._validator(null, `${s1} ${s2}`, cb);

      fix.createFile(fix.FILE1, s1);  
      fileCat(fix.FILE1, fix.FILE2, validator);

      setTimeout(() => fix.createFile(fix.FILE2, s2), 400);      
    });

    it('f2 exist, f1 after', (cb) => {
      const validator = fix._validator(null, `${s1} ${s2}`, cb);

      fix.createFile(fix.FILE2, s2);  
      fileCat(fix.FILE1, fix.FILE2, validator);

      setTimeout(() => fix.createFile(fix.FILE1, s1), 400);      
    });

    it('f1 and f2 after', (cb) => {
      const validator = fix._validator(null, `${s1} ${s2}`, cb);

      fileCat(fix.FILE1, fix.FILE2, validator);

      setTimeout(() => fix.createFile(fix.FILE1, s1), 200); 
      setTimeout(() => fix.createFile(fix.FILE2, s2), 400);      
    });
  });

  context('fail', () => {
    it('f1 exist, f2 never', (cb) => {
      const validator = fix._validator('file2 not exist', null, cb);

      fix.createFile(fix.FILE1, s1);
      fileCat(fix.FILE1, fix.FILE2, validator);    
    });

    it('f2 exist, f1 never', (cb) => {
      const validator = fix._validator('file1 not exist', null, cb);

      fix.createFile(fix.FILE2, s2);
      fileCat(fix.FILE1, fix.FILE2, validator);    
    });
    
    it('f1 and f2 never', (cb) => {
      const validator = fix._validator('file1 and file2 not exist', null, cb);

      fileCat(fix.FILE1, fix.FILE2, validator);    
    });
  });
});
