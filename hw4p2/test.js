const fs = require('fs')



async function asd(file){
    var d = null;
    var f = await setInterval(()=>{
        
        if (fs.existsSync(file)){
            console.log(d)

            d = fs.readFileSync(file);
            clearInterval(this)
        }
    }, 500);
    
    return d;
}
console.log(fs.existsSync('./s1'))
console.log(asd('./s1'))