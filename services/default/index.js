const {
  render
} = require("./src/render.js")


const express = require('express');
const app = express();

app.get('/:jobId', (req, res) => {
  render(req, res)
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});

module.exports = {
  render
}
