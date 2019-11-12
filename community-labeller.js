const puppeteer = require('puppeteer');
const fs = require('fs');

var input = fs.readFileSync(process.argv[2]).toString().split("\n");

var result;
try {
  result = JSON.parse(fs.readFileSync('result.json'));
} catch (e) {
  console.log("starting from scratch");
  result = {};
}

input = input.filter((line) => line.trim() != "");

var searchString = "https://www.google.com/search?q=";

(async () => {
  const opts = {headless:false, defaultViewport: null};
  const left = await puppeteer.launch(opts);
  const right = await puppeteer.launch(opts);

  var pLeft = await left.newPage();
  const pRight = await right.newPage();

  var output = [];

  for (var searchTerm of input) {
    searchTerm = searchTerm.trim();

    if (result[searchTerm] !== undefined) {
      continue;
    }

    pLeft.goto(searchString + encodeURIComponent(searchTerm.replace('Metro Area', '').trim()) + " reddit");
    pRight.goto("https://en.wikipedia.org/wiki/" + encodeURIComponent(searchTerm.replace('Metro Area', '')).trim() + " MSA");
    // no await ^
    
    let requestPromise = pLeft.waitForRequest((request) =>
      request.url().startsWith("https://www.reddit.com") || request.url().startsWith("https://www.google.com/webhp"),
      { timeout: 0 });

    try {
      let request = await requestPromise;
      let url = request.url();

      if (url.startsWith("https://www.google.com/webhp")) {
        console.log(searchTerm + "\t->\trejected");
        result[searchTerm] = null;
      } else {
        let sub = url.substring("https://www.reddit.com".length).split('/')[2];
        console.log(searchTerm + "\t->\t" + sub);
        result[searchTerm] = sub;
      }
    } catch (error) {
      console.log("!! Failed: " + error);
    }

    fs.writeFileSync('result.json', JSON.stringify(result));
  }



  await left.close();
  await right.close();
})();
