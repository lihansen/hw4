'use strict';

const chai = require('chai');
const { expect } = chai;

const { Fixture } = require('../lib/fixture');
const fs = require('fs');
const path = require('path');

const { URL } = require('url');
const qs = require('querystring');

const { MongoClient, ObjectId } = require('mongodb');

const {
  random_string
} = require('../lib/util');

const INTERPRETER = 'node';
const SCRIPT_TO_TEST = `${__dirname}/../hw4p1.js`;

const URL_MAP = {
  CREATE_PLAYER: {
    method: 'POST',
    path:   '/player'
  },
  DELETE_PLAYER: {
    method: 'DELETE',
    path:   (pid) => `/player/${pid}`
  },
  DEPOSIT_PLAYER: {
    method: 'POST',
    path:   (pid) => `/deposit/player/${pid}`
  },
  GET_PLAYER: {
    method: 'GET',
    path:   (pid) => `/player/${pid}`
  },
  GET_PLAYERS: {
    method: 'GET',
    path:   `/player`
  },
  PING: {
    method: 'GET',
    path:   '/ping'
  },
  UPDATE_PLAYER: {
    method: 'POST',
    path:   (pid) => `/player/${pid}`
  }
};

const WWW = {
  host:  'localhost',
  port:  '3000',
  proto: 'http'
};

const MONGO_CONNECTION = {
  host: 'localhost',
  port: '27017',
  db:   'ee547_hw',
  opts: {
    useUnifiedTopology: true
  }
};

const MONGO_COLLECTION = {
  PLAYER: 'player'
};


const HANDED_MAP = {
  A: 'ambi',
  L: 'left',
  R: 'right'
};

// player defaults
const DEFAULT_FNAME   = random_string();
const DEFAULT_LNAME   = random_string();
const DEFAULT_HANDED  = 'L';
const DEFAULT_INITIAL = '5.66';

// REUSABLE
let url, body, status, headers;


const MONGO_CONFIG_FILE = `${__dirname}/../config/mongo.json`;

class Hw4P1Fixture extends Fixture {
  constructor() {
    super(INTERPRETER, SCRIPT_TO_TEST);

    this.setWwwOpts(WWW);
  }


  async _connect() {
    /*
    if (this._mongoConnect) {
      return;
    }
    */

    const { host, port, db, opts } = {
      ...MONGO_CONNECTION
    };

    const u = new URL(`mongodb://${host}:${port}`);
    u.search = qs.encode(opts);

    try {
      this._mongoConnect = await MongoClient.connect(u.href);
      this._mongoDb = this._mongoConnect.db(db);
    } catch(err) {
      console.error(`mongodb connection error -- ${err}`);
      process.exit(5);
    }
  }


  async _close() {
    if (this._mongoConnect) {
      return this._mongoConnect.close();
      this._mongoConnect = null;
    }
  }


  async before() {
    this.write_config();
    await this._connect();
    await super.before();
  }


  async after() {
    await super.after();
    await this._close();
  }


  // if rawData no output processing
  write_config(data = {}, rawData) {
    if (rawData === undefined) {
      data = {
        ...MONGO_CONNECTION,
        ...data
      };
      data = JSON.stringify(data);
    } else {
      data = rawData;
    }

    const dir = path.dirname(MONGO_CONFIG_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(MONGO_CONFIG_FILE, data);
  }

  // ENTITY HELPERS
  
  // return obj, use params and replace missing with DEFAULT
  add_player_param(data) {
    const DEFAULT_DATA = {
      fname:               DEFAULT_FNAME,
      lname:               DEFAULT_LNAME,
      handed:              HANDED_MAP[DEFAULT_HANDED],
      initial_balance_usd: DEFAULT_INITIAL
    }

    return { ...DEFAULT_DATA, ...data };
  }


  // create player by request
  // return pid
  async post_player(params = {}) {
    params = this.add_player_param(params);

    url = this.url(URL_MAP.CREATE_PLAYER.path, params);
    ({ status, headers } = await this.request(URL_MAP.CREATE_PLAYER.method, url));

    expect(status).to.be.equal(303);
    // axios uses lower-case
    expect(headers).to.have.property('location');
    expect(headers['location']).to.match(/^\/player\/([a-f0-9]{12,})$/);

    const [, pid] = headers['location'].match(/^\/player\/([a-f0-9]{12,})$/);
    return pid;
  }
  

  // return obj, use params and replace missing with DEFAULT
  _add_player_defs(data) {
    const DEFAULT_DATA = {
      fname:       DEFAULT_FNAME,
      lname:       DEFAULT_LNAME,
      handed:      DEFAULT_HANDED,
      balance_usd: DEFAULT_INITIAL,
      is_active:   true
    }

    return { ...DEFAULT_DATA, ...data };
  }


  // add player with data (defaults: _add_player_defs)
  // return pid
  async add_player(data = {}) {
    const doc = this._add_player_defs(data);

    const { insertedId: _id } = await this._mongoDb.collection(MONGO_COLLECTION.PLAYER).insertOne(doc);

    return _id.toString();
  }


  get_player(pid) {
    const selector = {
      _id: new ObjectId(pid)
    };

     return this._mongoDb.collection(MONGO_COLLECTION.PLAYER).findOne(selector);
  }


  async list_players() {
     const docs = await this._mongoDb.collection(MONGO_COLLECTION.PLAYER).find({}, { projection: { _id: true } }).toArray();
     return docs.map(({ _id }) => _id.toString());
  }


  _db_flush() {
    if (this._mongoDb) {
      return this._mongoDb.dropDatabase();
    }
  }


  _to_currency(val) {
    return parseFloat(val).toFixed(2);
  }


  _add_usd(v1, v2) {
    return this._to_currency(parseFloat(v1) + parseFloat(v2));
  }


  _sub_usd(v1, v2) {
    return this._to_currency(parseFloat(v1) - parseFloat(v2));
  }


  random_pid() {
    return random_string(24, false, 'abcdef0123456789');
  }
}

Hw4P1Fixture.URL_MAP = URL_MAP;


Hw4P1Fixture.assert_valid_player = (obj) => {
  const fields = [
    'pid',
    'name',
    'handed',
    'is_active',
    'balance_usd'
  ];

  for (const field of fields) {
    expect(obj).to.have.property(field);
  }
}


Hw4P1Fixture.assert_valid_player_document = (obj) => {
  const fields = [
    '_id',
    'fname',
    'lname',
    'handed',
    'is_active',
    'balance_usd'
  ];

  for (const field of fields) {
    expect(obj).to.have.property(field);
  }
}


Hw4P1Fixture.assert_valid_player_balance = (obj) => {
  const fields = [
    'old_balance_usd',
    'new_balance_usd'
  ];

  for (const field of fields) {
    expect(obj).to.have.property(field);
  }
}


chai.use(function (chai) {
  var Assertion = chai.Assertion;

  Assertion.addMethod('document', function (exp) {
    const self = this;

    const validators = {
      player:         Hw4P1Fixture.assert_valid_player_document
    }

    if (!(exp in validators)) {
      throw new Error(`invalid document assertion -- val:${exp}, allowed:${Object.keys(validators).join(',')}`);
    }

    validators[exp](self._obj);
  });

  Assertion.addMethod('model', function (exp) {
    const self = this;

    const validators = {
      player:         Hw4P1Fixture.assert_valid_player,
      player_balance: Hw4P1Fixture.assert_valid_player_balance
    }

    if (!(exp in validators)) {
      throw new Error(`invalid model assertion -- val:${exp}, allowed:${Object.keys(validators).join(',')}`);
    }

    validators[exp](self._obj);
  });
});

module.exports = {
  Fixture: Hw4P1Fixture
}
