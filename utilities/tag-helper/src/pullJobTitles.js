const { assertSuccess, payload } = require('@pheasantplucker/failables')
const {
  createDatastoreClient,
  createQueryObj,
  runQuery,
} = require('@pheasantplucker/gc-datastore')
const { writeFile, mkdirs } = require('fs-extra')

createDatastoreClient('starspawn-201921')

async function getJobs() {
  const r1 = createQueryObj('job')
  const query = payload(r1)
  const fullQuery = query
    .select('title')
    .limit(1000)
    .groupBy('title')
  const r2 = await runQuery(fullQuery)
  assertSuccess(r2)
  const responses = payload(r2)
  let justTitles = []
  Object.entries(responses).forEach(([key, value]) =>
    justTitles.push(value.title)
  )

  const fullPath = './titles.json'
  await writeFile(fullPath, JSON.stringify(justTitles, null, '\t'))
}

getJobs()
