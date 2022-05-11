const fs = require('fs');
const appConfig = require('./appcfg_stb_features.json');
let tab = 0;

// console.log(JSON.stringify(appConfig, null, 5));
console.log(JSON.stringify(appConfig, function (key, value) {
      return value;
  }, 5));

// featureFileReader(appConfig);

function exitHandler(next) {
    fs.writeFile("config.json", JSON.stringify(appConfig), 'utf8', function (err) {
        if (err) {
            next(err);
        }
     
        console.log("JSON file has been saved.");
        process.exit(0);
    });
}

function featureFileReader(file) {
    for (const feature in file){
        console.log(feature);
        if(typeof(file[feature]) === "object"){
            tab++;
            featureFileReader(file[feature])
        }else{
            console.log(file[feature] + " tab " + tab)
        }
    }
}