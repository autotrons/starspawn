const uuid = require("uuid");
var storage = require("@google-cloud/storage")();
var myBucket = storage.bucket("datafeeds");
const get = require("simple-get");

const download = async (req, downloadResponse) => {
  const id = uuid.v4();
  console.log(`${id} starting`);
  const file = myBucket.file(`full_feed/${id}.xml.gz`);
  get(
    "https://exchangefeeds.s3.amazonaws.com/9d2dcb702d7d6b801f34227c04c8bb23/feed.xml.gz",
    function(err, getResponse) {
      if (err) {
        console.error(`${id} ${err.toString()}`);
        downloadResponse.status(500).send({ id, status: err.toString() });
      }
      console.log(`${id} getResponse ${getResponse.statusCode}`);
      getResponse
        .pipe(file.createWriteStream())
        .on("error", function(err) {
          console.error(`${id} ${err.toString()}`);
          downloadResponse.status(500).send({ id, status: err.toString() });
        })
        .on("finish", function() {
          console.log(`${id} complete`);
          downloadResponse.status(200).send({ id, status: "complete" });
        });
    }
  );
};

module.exports = {
  download
};
