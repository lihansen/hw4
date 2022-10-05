'use strict';

const { assert, expect } = require('chai');

const DEFAULT_TIMEOUT_MS = 4e3;
const { Fixture } = require('./fixture_hw4p1');


describe('GET /player', function() {
  const DEFAULT_PATH   = Fixture.URL_MAP.GET_PLAYERS.path;
  const DEFAULT_METHOD = Fixture.URL_MAP.GET_PLAYERS.method;

  this.timeout(DEFAULT_TIMEOUT_MS);

  const fix = new Fixture();

  beforeEach(() => fix._db_flush());

  before(() => fix.before());
  after(() => fix.after());

  
  context('contains 0 player', () => {
    it('response code is 200', async function () {
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH, {}, 200);
    });

    it('response is empty array', async function () {
      const { body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH, {}, 200);
      
      const d = JSON.parse(body);
      expect(d).to.be.an('array').with.length(0);
    });
  });

  
  context('contains 1 player', () => {
    it('response code is 200', async function () {
      await fix.add_player();
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH, {}, 200);
    });

    it('response is array length 1', async function () {
      await fix.add_player();
      const { body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH, {}, 200);
      
      const d = JSON.parse(body);
      expect(d).to.be.an('array').with.length(1);

      for (const obj of d) {
        expect(obj).to.be.a.model('player');
      }
    });
  });

  
  context('contains 2+ player', () => {
    it('response code is 200', async function () {
      await Promise.all([
        fix.add_player(),
        fix.add_player()
      ]);
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH, {}, 200);
    });

    it('response is array length 2', async function () {
      await Promise.all([
        fix.add_player(),
        fix.add_player()
      ]);
      const { body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH, {}, 200);
      
      const d = JSON.parse(body);
      expect(d).to.be.an('array').with.length(2);

      for (const obj of d) {
        expect(obj).to.be.a.model('player');
      }
    });
  });
  

  context('sort A-Z ASC', function () {
    it('different first name', async function () {
      // create in order
      const vals = [
        { fname: 'c', lname: 'l' },
        { fname: 'b', lname: 'l' },
        { fname: 'a', lname: 'l' },
      ];
      const sorted_vals = vals.map(({ fname, lname }) => `${fname} ${lname}`).sort();

      await Promise.map(vals, ({ fname, lname }) => fix.add_player({ fname, lname }));

      const { body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH, {}, 200);
      const objs = JSON.parse(body);

      const names = objs.map(({ name }) => name);
      expect(names).to.deep.equal(sorted_vals);
    });

    it('same first name', async function () {
      // create in order
      const vals = [
        { fname: 'f', lname: 'a' },
        { fname: 'f', lname: 'b' },
        { fname: 'f', lname: 'c' },
      ];
      const sorted_vals = vals.map(({ fname, lname }) => `${fname} ${lname}`).sort();

      await Promise.map(vals, ({ fname, lname }) => fix.add_player({ fname, lname }));

      const { body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH, {}, 200);
      const objs = JSON.parse(body);

      const names = objs.map(({ name }) => name);
      expect(names).to.deep.equal(sorted_vals);
    });

    it('update re-orders', async function () {
      // create in order
      const vals = [
        { fname: 'f', lname: 'a' },
        { fname: 'f', lname: 'b' }
      ];
      const sorted_vals_pre = vals.map(({ fname, lname }) => `${fname} ${lname}`).sort();

      let body, names;

      const [pida,] = await Promise.map(vals, ({ fname, lname }) => fix.add_player({ fname, lname }));

      ({ body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH, {}, 200));
      (names = JSON.parse(body).map(({ name }) => name));
      expect(names).to.deep.be.equal(sorted_vals_pre);

      const new_lname = 'c';
      await fix.test_forward('POST', `/player/${pida}`, { lname: new_lname }, 303);
      
      // update vals, and get new order
      vals[0].lname = new_lname;
      const sorted_vals_post = vals.map(({ fname, lname }) => `${fname} ${lname}`).sort();

      ({ body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH, {}, 200));
      (names = JSON.parse(body).map(({ name }) => name));
      expect(names).to.deep.equal(sorted_vals_post);
    });
  });
});


describe('GET /player/:pid', function() {
  const DEFAULT_PATH   = Fixture.URL_MAP.GET_PLAYER.path;
  const DEFAULT_METHOD = Fixture.URL_MAP.GET_PLAYER.method;

  this.timeout(DEFAULT_TIMEOUT_MS);

  const fix = new Fixture();

  before(() => fix.before());
  after(() => fix.after());


  context('pid exist', () => {
    it('response code is 200', async () => {
      const pid = await fix.add_player();
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 200);
    });

    it('response is valid player', async () => {
      const pid = await fix.add_player();
      const { body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 200);

      const d = JSON.parse(body);
      expect(d).to.be.a.model('player');
    });
  });


  context('pid not exist', function() {
    it('response code is 404', function () {
      const pid = fix.random_pid();
      return fix.test_fail(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 404);
    });
  });


  context('field: pid', () => {
    it('response contains pid', async () => {
      const pid = await fix.add_player();
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 200, ['pid']);
    });
    
    it('pid is ObjectId', async () => {
      const pid = await fix.add_player();
      const { body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 200);
      
      const { pid:_pid } = JSON.parse(body);
      expect(_pid).to.be.ObjectIdString.and.equal(pid);
    });
  });


  context('field: name', () => {
    it('response contains response contains name', async () => {
      const pid = await fix.add_player();
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 200, ['name']);
    });
    
    it('fname + lname', async () => {
      const fname = 'player';
      const lname = 'last';
      
      const pid = await fix.add_player({ fname, lname });
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 200, { name: `${fname} ${lname}` });
    });
    
    it('lname blank', async () => {
      const fname = 'player';
      const lname = '';
      const pid = await fix.add_player({ fname, lname });
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 200, { name: `${fname}` });
    });
  });


  context('field: handed', () => {
    it('response contains handed', async () => {
      const pid = await fix.add_player();
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 200, ['handed']); 
    });
    
    it('handed enum', async () => {
      const vals = {
        A: 'ambi',
        L: 'left',
        R: 'right'
      };

      return Promise.map(Object.keys(vals), async val => {
        const pid = await fix.add_player({ handed: val });
        const {body} = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 200, { handed: vals[val] });
      });
    });
  });


  context('field: is_active', () => {
    it('response contains is_active', async () => {
      const pid = await fix.add_player();
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 200, ['is_active']);
    });
    
    it('is_active is boolean', async () => {
      const pid = await fix.add_player();
      const { body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 200);
      
      const { is_active } = JSON.parse(body);
      expect(is_active).to.be.a('boolean').and.equal(true);
    });
  });


  context('field: balance_usd', () => {
    it('response contains balance_usd', async () => {
      const pid = await fix.add_player();
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 200, ['balance_usd']);
    });
    
    it('balance_usd is currency', async () => {
      const balance_usd = '12.34';
      const pid = await fix.add_player({ balance_usd });
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 200, { balance_usd });
    });
  });
});
