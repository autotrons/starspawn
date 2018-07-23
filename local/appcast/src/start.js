const { processFeed } = require('./process-feed')
const input_url = process.argv[2]
console.log(`input_url:`, input_url)
processFeed(input_url).then(r => {
  console.log('hey, it finished!')
})
