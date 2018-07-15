const express = require('express')

const currStopWords = require(`../../../services/etl2/templates/stopwords.json`)
const stopword = require('stopword')
const longTitleList = require('../titles.json')

const app = express()

app.get('/', (req, res) => {
  res.status(200).send(fullPage())
})

function titleToKeywords(title) {
  const cleanTitle = title.toLowerCase().replace(/[^a-z ]+/g, '')
  const titleArray = cleanTitle.split(' ')
  const noEmptyTitleArray = titleArray.filter(Boolean)
  const noShortTitles = noEmptyTitleArray.filter(e => {
    return e.length > 2
  })
  const cleaned = stopword.removeStopwords(noShortTitles, currStopWords)
  return cleaned
}

function cleanAndClickable(title) {
  const keywords = titleToKeywords(title)
  const uniqueArray = keywords.filter(function(elem, pos) {
    return keywords.indexOf(elem) == pos
  })
  const html = uniqueArray.map(e => {
    return `<input
      type="button"
      class="button"
      value="${e}"
      onclick="var thisText = document.createTextNode('<br>${e}');getElementById('exclude').appendChild(thisText)"
      ></input>`
  })
  const allTogether = html.join(' ')
  return allTogether
}

// Start the server
const PORT = process.env.PORT || 8080

let server
const start = async () => {
  return new Promise(resolve => {
    server = app.listen(PORT, () => {
      console.log(`App listening on port ${PORT}`)
      console.log('Press Ctrl+C to quit.')
      resolve()
    })
  })
}

const stop = async () => {
  server.close()
}

start()

function fullPage() {
  const html = `<!doctype html>
  <html AMP lang="en">
    <head>
      <meta charset="utf-8">
      <style amp-custom>
      body {
        background-color: white;
        font-family: Helvetica, Arial, sans-serif;
        margin: 0;
        padding: 0;
      }
      .button {
        border-radius: 4px;
        moz-border-radius: 4px;
        webkit-border-radius: 4px;
        height: 30px;
        width: 100px;
        background-color: #007dad;
        vertical-align: middle;
        text-align: center;
        align-items: center;
        justify-content: center;
        display: flex;
        margin: 5px 5px 5px 5px;
        color: white;
        text-decoration: none;
        font-family: Helvetica, Arial, sans-serif;
        font-weight: bold;
      }
      .centerContent {
        margin:0 auto;
        max-width: 70%;
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        flex: 1 1 auto;
      }
      .flexRow {
        display: flex;
        flex-direction: row;
        justify-content: space-around;
        flex-wrap: wrap;
      }
      </style>
    </head>
      <body><div class="flexRow">
        <div class="centerContent">`

  const cleanedTitlesArray = cleanAndClickable(longTitleList.join(' '))
  const endHtml = `</div><div class="centerContent" id="exclude"></div></div></body></html>`
  return html + cleanedTitlesArray + endHtml
}

module.exports = {
  start,
  stop,
  cleanAndClickable,
  fullPage,
}
