const fs = require('fs');
const { clearInterval } = require('timers');


exports.fileCat = function (file1, file2, callback) {
    this.SEPARATOR = ' '; // space
    this.TIMEOUT_MS = 2000; // 2.0 sec
    const interval = 100;
    var counter = 0

    const itv_id = setInterval(() => {
        var ef1 = fs.existsSync(file1);
        var ef2 = fs.existsSync(file2);
        if (ef1 && ef2) {
            clearInterval(itv_id);
            var data = fs.readFileSync(file1) +
                this.SEPARATOR +
                fs.readFileSync(file2);
            callback(null, data)
        } else if (counter <= 20) {
            counter += 1;
        } else {
            clearInterval(itv_id);
            var msg = "";
            if (!ef1 && !ef2) {
                msg = 'file1 and file2 not exist'
            } else if (!ef1) {
                msg = 'file1 not exist'
            } else {
                msg = 'file2 not exist'
            }
            callback(new Error(msg), null);
        }
    }, interval);
}