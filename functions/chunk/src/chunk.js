const uuid = require("uuid");
var storage = require("@google-cloud/storage")();
var myBucket = storage.bucket("datafeeds");

const chunk = async event => {
  const id = uuid.v4();
  console.log(`${id} starting`);
  const file = event.data;
  const context = event.context;
  const fileHandle = myBucket.file(file.name);

  console.log(`Event ${context.eventId}`);
  console.log(`Event Type: ${context.eventType}`);
  console.log(`Bucket: ${file.bucket}`);
  console.log(`File: ${file.name}`);
  console.log(`Metageneration: ${file.metageneration}`);
  console.log(`Created: ${file.timeCreated}`);
  console.log(`Updated: ${file.updated}`);
  console.log(`ResourceState: ${file.resourceState}`);
  return { id, status: "complete" };
};

module.exports = {
  chunk
};
