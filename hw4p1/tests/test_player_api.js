'use strict';

const { assert, expect } = require('chai');

const DEFAULT_TIMEOUT_MS = 4e3;
const { Fixture } = require('./fixture_hw4p1');


describe('DELETE /player/:pid', function() {
  const DEFAULT_PATH   = Fixture.URL_MAP.DELETE_PLAYER.path;
  const DEFAULT_METHOD = Fixture.URL_MAP.DELETE_PLAYER.method;

  this.timeout(DEFAULT_TIMEOUT_MS);

  const fix = new Fixture();

  before(() => fix.before());
  after(() => fix.after());

  context('pid exist', () => {
    it('response_code is 303 on success', async () => {
      const pid = await fix.add_player();
      await fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 303);
    });

    it('pid deleted', async () => {
      const pid = await fix.add_player();
      return fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 303);
    });

    it('pid deleted x2', async () => {
      const pid = await fix.add_player();
      await fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 303);
      await fix.test_fail(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 404);
    });
  });


  context('pid not exist', function() {
    it('response code is 404', function () {
      const pid = fix.random_pid();
      return fix.test_fail(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 404);
    });
  });
});


describe('POST /player', function() {
  const DEFAULT_PATH   = Fixture.URL_MAP.CREATE_PLAYER.path;
  const DEFAULT_METHOD = Fixture.URL_MAP.CREATE_PLAYER.method;

  this.timeout(DEFAULT_TIMEOUT_MS);

  const fix = new Fixture();

  before(() => fix.before());
  after(() => fix.after());

  
  context('response', function () {
    it('response_code is 303 on success', async () => {
      const ps = fix.add_player_param();
      return fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH, ps, 303);
    });
  });

  context('field: pid', function () {
    it('is ObjectId', async () => {
      const ps = fix.add_player_param();
      const { body } = await fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH, ps, 303);
      
      const { pid } = JSON.parse(body);
      const player = await fix.get_player(pid);

      expect(player).to.have.property('_id');
      expect(player._id).to.be.an.ObjectId;
    });
  });

  // FNAME + LNAME
  context('field: name', function () {
    it('fname + lname', async () => {
      const fname = 'player';
      const lname = 'last';
      const ps = fix.add_player_param({ fname, lname });
      return fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH, ps, 303, { name: `${fname} ${lname}` });
    });
    
    it('fname blank', async () => {
      const fname = '';
      const ps = fix.add_player_param({ fname });
      return fix.test_fail(DEFAULT_METHOD, DEFAULT_PATH, ps, 422, 'fname');
    });
    
    it('fname invalid char', async () => {
      const fname = 'player1';
      const ps = fix.add_player_param({ fname });
      return fix.test_fail(DEFAULT_METHOD, DEFAULT_PATH, ps, 422, 'fname');
    });

    it('fname invalid space', async () => {
      const fname = 'player player';
      const ps = fix.add_player_param({ fname });
      return fix.test_fail(DEFAULT_METHOD, DEFAULT_PATH, ps, 422, 'fname');
    });
  });

  context('field: handed', function () {
    it('accept valid enum', () => {
      const vals = ['left', 'right', 'ambi'];

      return Promise.map(vals, val => {
        const ps = fix.add_player_param({ handed: val });
        return fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH, ps, 303, { handed: val });
      });
    });

    it('no-accept invalid enum', () => {
      const vals = ['L', 'R'];

      return Promise.map(vals, val => {
        const ps = fix.add_player_param({ handed: val });
        return fix.test_fail(DEFAULT_METHOD, DEFAULT_PATH, ps, 422, 'handed');
      });
    });
  });

  context('field: initial_balance_usd', function () {
    it('set if valid, two precision digit', async () => {
      const val = '10.13';
      const ps = fix.add_player_param({ initial_balance_usd: val });
      return fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH, ps, 303, { balance_usd: parseFloat(val).toFixed(2) });
    });

    it('set if valid, one precision digit', async () => {
      const val = '10.1';
      const ps = fix.add_player_param({ initial_balance_usd: val });
      return fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH, ps, 303, { balance_usd: parseFloat(val).toFixed(2) });
    });

    it('set if valid, zero precision digit with decimal', async () => {
      const val = '10.';
      const ps = fix.add_player_param({ initial_balance_usd: val });
      return fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH, ps, 303, { balance_usd: parseFloat(val).toFixed(2) });
    });
    
    it('set if valid, zero precision digit', async () => {
      const val = '10';
      const ps = fix.add_player_param({ initial_balance_usd: val });
      return fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH, ps, 303, { balance_usd: parseFloat(val).toFixed(2) });
    });
    
    it('fail if invalid', async () => {
      const val = '10.133';
      const ps = fix.add_player_param({ initial_balance_usd: val });
      return fix.test_fail(DEFAULT_METHOD, DEFAULT_PATH, ps, 422, 'balance_usd');
    });
  });
  
  context('field: is_active', function () {
    it('default is_active=true', async () => {
      const ps = fix.add_player_param();
      return fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH, ps, 303, { is_active: true });
    });
  });
  
  context('field: created_at', function () {
    it('created_at set', async () => {
      const pid = await fix.post_player();

      const player = await fix.get_player(pid);

      expect(player).to.have.property('created_at');
      expect(player.created_at).to.be.instanceof(Date);
    });
  });
});


describe('POST /player/:pid', function() {
  const DEFAULT_PATH   = Fixture.URL_MAP.UPDATE_PLAYER.path;
  const DEFAULT_METHOD = Fixture.URL_MAP.UPDATE_PLAYER.method;

  this.timeout(DEFAULT_TIMEOUT_MS);

  const fix = new Fixture();

  before(() => fix.before());
  after(() => fix.after());

  
  context('pid exist', function () {
    it('response_code is 303', async () => {
      const pid = await fix.add_player();
      return fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 303);
    });
  });
  
  context('pid not exist', function() {
    it('response code is 404', function () {
      const pid = fix.random_pid();
      return fix.test_fail(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 404);
    });
  });

  context('field: lname', function () {
    it('response code is 303', async function () {
      let lname = 'lname';

      const pid = await fix.add_player({ lname });

      lname = 'lnamep';
      return fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH(pid), { lname }, 303);
    });

    it('update', async function () {
      const fname = 'pp';
      let lname = 'lname';

      const pid = await fix.add_player({ fname, lname });

      lname = 'lnamep';
      return fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH(pid), { lname }, 303, { name: `${fname} ${lname}` });
    });
    
    it('update to same', async function () {
      const fname = 'pp';
      let lname = 'lname';

      const pid = await fix.add_player({ fname, lname });

      lname = 'lname';
      return fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH(pid), { lname }, 303, { name: `${fname} ${lname}` });
    });
    
    it('update to empty', async function () {
      const fname = 'pp';
      let lname = 'lname';

      const pid = await fix.add_player({ fname, lname });

      lname = '';
      return fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH(pid), { lname }, 303, { name: `${fname}` });
    });
  });

  context('field: active', function () {
    it('active => inactive', async function () {
      const pid = await fix.add_player();
      return fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH(pid), { active: 'f' }, 303, { is_active: false });
    });
    
    it('inactive => active', async function () {
      const pid = await fix.add_player();
      await fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH(pid), { active: 'f' }, 303, { is_active: false });
      return fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH(pid), { active: 't' }, 303, { is_active: true });
    });
    
    it('validate true boolean input', function () {
      const test_vals = ['1', 't', 'true', 'T', 'TRUE'];

      return Promise.map(test_vals, async val => {
        const pid = await fix.add_player();
        // deactivate
        await fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH(pid), { active: 'f' }, 303, { is_active: false });
        // re-activate
        const { body } = await fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH(pid), { active: val }, 303);
        const { is_active } = JSON.parse(body);
        expect(is_active).to.be.a('boolean').and.equal(true);
      });
    });

    context('field: created_at', async () => {    
      it('created_at no change on update', async () => {
        let lname = 'lname';
  
        const pid = await fix.add_player({ lname });
  
        const { created_at: createdAt1 } = await fix.get_player(pid);
  
        lname = 'lnamep';
        await fix.test_forward(
          Fixture.URL_MAP.UPDATE_PLAYER.method,
          Fixture.URL_MAP.UPDATE_PLAYER.path(pid),
          {
            lname
          }, 303);
  
        const { created_at: createdAt2, lname: lname2 } = await fix.get_player(pid);
  
        expect(lname2).to.equal(lname);
        expect(createdAt2).to.equal(createdAt1);
      });
    });
  });
});


describe('POST /deposit/player/:pid', function() {
  const DEFAULT_PATH   = Fixture.URL_MAP.DEPOSIT_PLAYER.path;
  const DEFAULT_METHOD = Fixture.URL_MAP.DEPOSIT_PLAYER.method;

  this.timeout(DEFAULT_TIMEOUT_MS);

  const fix = new Fixture();

  before(() => fix.before());
  after(() => fix.after());

  
  context('pid exist', function () {
    it('response_code is 200', async () => {
      const pid = await fix.add_player();
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), { amount_usd: '0.00' }, 200);
    });

    it('response is balance_usd model', async function () {
      const pid = await fix.add_player();
      const { body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), { amount_usd: '0.00' }, 200);
      
      const d = JSON.parse(body);
      expect(d).to.be.a.model('player_balance');
    });
  });
  
  context('pid not exist', function() {
    it('response code is 404', function () {
      const pid = fix.random_pid();
      return fix.test_fail(DEFAULT_METHOD, DEFAULT_PATH(pid), { amount_usd: '0.00' }, 404);
    });
  });

  context('amount_usd', function () {
    it('incremement zero balance', async function() {
      const balance_usd = '0.00';
      const amount_usd = '1.23';
      const pid = await fix.add_player({ balance_usd });
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), { amount_usd }, 200, { old_balance_usd: balance_usd, new_balance_usd: amount_usd });
    });
    
    it('incremement non-zero balance', async function() {
      const balance_usd = '1.00';
      const amount_usd = '1.23';
      const pid = await fix.add_player({ balance_usd });
      const new_balance_usd = fix._add_usd(balance_usd, amount_usd);
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), { amount_usd }, 200, { old_balance_usd: balance_usd, new_balance_usd });
    });

    it('allow zero deposit', function() {
      const test_vals = ['0', '0.0', '0.00'];
      const balance_usd = '1.00';

      return Promise.map(test_vals, async val => {
        const pid = await fix.add_player({ balance_usd });
        await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), { amount_usd: val }, 200, { old_balance_usd: balance_usd, new_balance_usd: balance_usd });
      });
    });
    
    it('allow valid currency', function() {
      const test_vals = ['1.21', '1.2', '1.0', '1'];
      const balance_usd = '1.00';

      return Promise.map(test_vals, async val => {
        const pid = await fix.add_player({ balance_usd });
        const new_balance_usd = fix._add_usd(balance_usd, val);
        await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), { amount_usd: val }, 200, { new_balance_usd });
      });
    });
    
    it('400 if empty amount_usd', async function() {
      const pid = await fix.add_player();
      await fix.test_fail(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 400);
    });
    
    it('400 if invalid currency', function() {
      const test_vals = ['1.211', 'one', '-1.00'];

      return Promise.map(test_vals, async val => {
        const pid = await fix.add_player();
        await fix.test_fail(DEFAULT_METHOD, DEFAULT_PATH(pid), { amount_usd: val }, 400);
      });
    });
  });
});
