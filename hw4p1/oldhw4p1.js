const fs = require('fs');
const http = require('http');
const { reject } = require('lodash');
const { number } = require('mathjs');
// const { reject } = require('lodash');
const { ObjectId } = require('mongodb').ObjectId;
const { resolve } = require('path');
const url = require('url');



let default_json = {
    host: "localhost",
    port: "27017",
    db: "ee547_hw",
    opts: {
        useUnifiedTopology: true
    }
}


let config_file_path = './config/mongo.json';
let config_json = default_json;



if (!fs.existsSync(config_file_path)) {
    // config file not exist
    config_json = default_json
}
else {

    let rawdata = fs.readFileSync(config_file_path);

    // invalid json
    try {
        config_json = JSON.parse(rawdata);
    }
    catch (e) {
        process.exit(2);
        // return 2;
    }

    // check empty fields -> use default values
    for (var key of Object.keys(config_json)) {
        if (config_json[key].length == 0) {
            config_json = default_json;
            break;
        }
    }
}

if (!("collection" in config_json)) {
    config_json['collection'] = 'player';
}


const mongo_url = 'mongodb://' + config_json.host + ':' + config_json.port;
var MongoClient = require('mongodb').MongoClient;


var handed_query_to_db = {
    left: "L",
    right: "R",
    ambi: "A",
}

var handed_db_to_json = {
    L: 'left',
    R: "right",
    A: "ambi",
}

var query_fields = ['fname', "lname", 'handed', 'initial_balance_usd', 'active'];


function convert_db_to_json_player(result) {
    var name = result.fname;
    if (result.lname) {
        name = name + ' ' + result.lname;
    }

    if (result.is_active == 'f') {
        result['is_active'] = false
    }
    return {
        pid: result._id,
        name: name,
        handed: handed_db_to_json[result.handed],
        balance_usd: format_balance(result.balance_usd, '0'),
        is_active: result.is_active,
    }
}

function check_invalid_query(query) {
    let invalids = [];
    if ('fname' in query) {
        if (!/^[a-zA-Z()]+$/.test(query['fname'])) {
            invalids.push('fname')
        }
    } else { invalids.push('fname') }
    if ('lname' in query) {
        if (!/^[a-zA-Z()]+$/.test(query['lname'])) {
            invalids.push('lname')
        }
    } else { invalids.push('lname') }

    if ('handed' in query) {
        var lhand = query['handed']//.toLowerCase();
        if (!(lhand in { 'left': '', 'right': '', 'ambi': '' })) {
            invalids.push('handed');
        }
    }
    if ('initial_balance_usd' in query) {
        var blc = query['initial_balance_usd'];

        var digits = blc.split('.')

        if (digits.length > 2 || (digits.length == 2 && digits[1].length > 2)) {
            invalids.push('initial_balance_usd');
        }
    }
    if ('balance_usd' in query) {
        var blc = query['balance_usd'];

        var digits = blc.split('.')

        if (digits.length > 2 || (digits.length == 2 && digits[1].length > 2)) {
            invalids.push('initial_balance_usd');
        }
    }
    if ('active' in query) {
        if (query['active'] == true || query['active'] == false) {

        } else {
            invalids.push('active');
        }
    } else { query['active'] = true; }
    return invalids
}
exports.x = check_invalid_query

function fill_empty_fields(query) {

    for (var field of query_fields) {
        if (!field in query) {
            query[field] = '';
        }
    }
}

function check_balance(sum) {
    if (!/^[0-9]+\.[0-9][0-9]$/.test(sum)) {
        var d = sum.split('.')
        if (d.length == 1) {
            sum = d + '.00'
        } else if (d.length == 2) {
            if (d[1].length > 2) {
                sum = d[0] + '.' + d[1].slice(0, 2)
            } else if (d[1].length == 0) {
                sum = d[0] + '.00';
            }
            else if (d[1].length == 1) {
                sum = d[0] + '.' + d[1] + '0';
            }
        }

    }
    return sum
}


function print(a) {
    console.log(a);
}


function p_update(pid, mongo_url, update_query) {
    return new Promise((resolve, reject) => {
        MongoClient.connect(mongo_url, function (err, db) {
            if (err) process.exit(5);
            var dbo = db.db(config_json.db);
            var ido = new ObjectId(pid);
            dbo.collection(config_json.collection).updateOne({ _id: ido },
                { $set: update_query },
                function (err, result) {

                    if (result && result.matchedCount == 1) {
                        resolve(result);
                    } else {
                        reject();
                    }
                })

        })
    })
}


function p_find(pid, mongo_url) {
    return new Promise((resolve, reject) => {
        MongoClient.connect(mongo_url, function (err, db) {
            if (err) process.exit(5);

            var dbo = db.db(config_json.db);
            var ido = new ObjectId(pid);
            dbo.collection(config_json.collection).findOne({ '_id': ido },
                function (err, result) {
                    if (result) {
                        // print("not rej:")
                        // print(result)
                        resolve(result);
                    } else {
                        // print("fuckrej:")
                        // print(pid)
                        reject(result);
                    }
                })

        })
    })

}

function check_valid_amount_in_query(query) {

    if ("amount_usd" in query) {
        var blc = query['amount_usd'];
        if (/^[0-9]+\.[0-9][0-9]$/.test(blc)

            || /^[0-9]+$/.test(blc)

            || /^[0-9]+\.$/.test(blc)

            || /^[0-9]+\.[0-9]$/.test(blc)
        ) {
            //valid query amount 
            return true;
        } else {
            return false
        }

    } else {
        return false;
    }
}


function format_balance(blc_org, blc_new) {
    var sum = number(blc_org) + number(blc_new);
    sum = sum.toString();
    if (!/^[0-9]+\.[0-9][0-9]$/.test(sum)) {
        var d = sum.split('.')
        if (d.length == 1) {
            sum = d + '.00'
        } else if (d.length == 2) {
            if (d[1].length > 2) {
                sum = d[0] + '.' + d[1].slice(0, 2)
            }
            else if (d[1].length == 1) {
                sum = d[0] + '.' + d[1] + '0';
            }
        }
    }
    return sum
}

function p_insert(insert_query, mongo_url) {
    return new Promise((resolve, reject) => {
        MongoClient.connect(mongo_url, function (err, db) {
            if (err) {
                process.exit(5);
            }
            var dbo = db.db(config_json.db);
            dbo.collection(config_json.collection).insertOne(insert_query, function (err, result) {
                if (result) {
                    resolve(result);
                } else {
                    reject(new Error('fuck'));
                }
                db.close()
            });
        });
    })
}


///////////////////////////////////////////////////////////////////////////////////////








//////////////////////////////////////////////////////////////////////////////////////////////////
const server = http.createServer(

    function (req, res) {

        const parsed_obj = url.parse(req.url, true);
        const pathname = parsed_obj.pathname;
        const query = parsed_obj.query;


        //1.  get /ping 
        if (req.method == 'GET' && req.url == '/ping') {
            res.writeHead(204);
            res.end();
        }


        // 2.  get /player 
        // sort by player name, filter active users
        // return 200 
        else if (req.method == 'GET' && req.url == '/player') {
            MongoClient.connect(mongo_url, function (err, db) {
                if (err) process.exit(5);

                var dbo = db.db(config_json.db);
                dbo.collection(config_json.collection).find({}).toArray(function (err, result) {
                    var data = [];
                    for (var obj of result) {
                        data.push(convert_db_to_json_player(obj));
                    }
                    // sorting the data
                    data.sort(function (p1, p2) {
                        if (p1.name < p2.name) return -1;
                        if (p1.name > p2.name) return 1;
                    })
                    res.writeHead(200);
                    res.write(JSON.stringify(data));
                    res.end();
                    db.close();
                })
            })
        }


        //3.  get /player/:pid
        //return 200 if exist, 404 if not exist
        else if (req.method == 'GET' && /\/player\/\d/.test(pathname)) {
            const pid = pathname.split('/').slice(-1)[0];

            p_find(pid, mongo_url).then(
                (data) => {
                    var rdata = convert_db_to_json_player(data);
                    res.writeHead(200);
                    res.write(JSON.stringify(rdata));
                    res.end();
                },
                (err) => {
                    res.writeHead(404);
                    res.end();
                });

        }

        //4.  delete /player/:pid  
        // succeed -> redirect 303
        // fail -> 404
        else if (req.method == 'DELETE' && /\/player\/\d/.test(pathname)) {

            const pid = pathname.split('/').slice(-1)[0];
            MongoClient.connect(mongo_url, function (err, db) {
                var dbo = db.db(config_json.db);
                var ido = new ObjectId(pid);
                var coll = config_json.collection;

                dbo.collection(coll).deleteOne({ _id: ido }, function (err, result) {
                    if (result.deletedCount == 1) {
                        res.writeHead(303, { 'Location': '/player' });
                    } else {
                        res.writeHead(404);
                    }
                    res.end();
                })
            })

        }

        //5.  post /player
        // success -> 303 redict to get /player/:pid
        // fail -> 422 must tell all the invalid fields
        else if (req.method == 'POST' && pathname == '/player') {
            // print(query)
            var checked = check_invalid_query(query);

            var invalids = checked;
            fill_empty_fields(query);

            if (invalids.length == 0) {
                // valid query  
                var date = new Date();
                var document = {
                    fname: query.fname,
                    lname: query.lname,
                    handed: handed_query_to_db[query.handed],
                    is_active: query.active,
                    balance_usd: check_balance(query.initial_balance_usd),
                    created_at: date,
                }

                p_insert(document, mongo_url).then(
                    (data) => {
                        var new_id = data.insertedId.toString();
                        res.writeHead(303, { 'Location': '/player/' + new_id.toString() });
                        res.end();
                    },
                    (err) => {
                        print('fucking err:')
                        print(err)
                    }
                )
            } else {
                res.writeHead(422);
                res.write('invalid fields: ' + invalids.join())
                res.end();

            }
            // res.writeHead(888);
            // res.end();

        }

        // 6.  post /player/:pid
        // update player 
        // alter succeed -> 303  to 
        // fail -> 404 

        else if (req.method == 'POST' && /^\/player\/\d/.test(pathname)) {
            const pid = pathname.split('/').slice(-1)[0];
            // print(pid)
            // print(query)
            p_find(pid, mongo_url).then(
                (data) => {
                    var update_query = {};
                    if (query['active'] == 'f') {
                        query['active'] = false
                    }
                    if (query['active'] in { 't': 1, '1': 1, 'true': 1, 'T': 1, 'TRUE': 1 }) {
                        query['active'] = true
                    }
                    if ('fname' in query) {
                        update_query['fname'] = query['fname'];
                    }
                    if ('lname' in query) {
                        update_query['lname'] = query['lname'];
                    }
                    if ('handed' in query) {
                        update_query['handed'] = handed_query_to_db[query['handed']];
                    }
                    if ('active' in query) {
                        update_query['is_active'] = query['active'];
                    }

                    p_update(pid, mongo_url, update_query).then((data) => {
                        // res.writeHead(303, { 'Location': '/player/' + pid });
                        // res.end();
                        res.writeHead(303, { 'Location': '/player/' + pid });
                        res.end();
                    }, (err) => {
                        // res.writeHead(404);
                        // res.end();
                        res.writeHead(303, { 'Location': '/player/' + pid });
                        res.end();
                    });
                    
                },
                (err) => {
                    res.writeHead(404);
                    res.end();
                }
            )
        }


        //7.  post /deposit/player/:pid
        else if (req.method == 'POST' && /^\/deposit\/player/.test(pathname)) {
            const pid = pathname.split('/').slice(-1)[0];

            p_find(pid, mongo_url).then(
                (data) => { // player found 
                    var blc = data.balance_usd;
                    // check balance

                    // check amount valid 
                    if (!check_valid_amount_in_query(query)) {
                        res.writeHead(400);
                        res.end();
                    } else {

                        // format the new balance to string 
                        var new_blc = format_balance(blc, query.amount_usd);

                        // update the blc 
                        p_update(pid, mongo_url, { balance_usd: new_blc }).then(
                            (data) => {
                                res.writeHead(200);
                                res.write(JSON.stringify({
                                    old_balance_usd: blc,
                                    new_balance_usd: new_blc,
                                }))
                                res.end();
                            }, (err) => {
                                res.writeHead(888);
                                res.end();
                            })
                    }


                }, (err) => {
                    // player not found 
                    res.writeHead(404);
                    res.end();
                })

        }


        // others
        else {
            // player not exist
            res.writeHead(404);
            res.end()

        }


    }


)

server.listen(3000);

exports.f = check_valid_amount_in_query