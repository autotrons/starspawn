const {
  failure,
  success,
  isFailure,
  payload,
} = require('@pheasantplucker/failables')
const { json2gsd } = require('./json2gsd.js')
const flow = require('xml-flow')
const sanitizeHtml = require('sanitize-html')
const fs = require('fs')

async function parse(filePath) {
  return new Promise(resolve => {
    const readStream = fs.createReadStream(filePath)
    let output_file
    const flowStream = flow(readStream)
    flowStream.on('tag:job', (job, encoding, cb) => {
      let counter = 0
      const file_number = Math.floor(counter / 1000)
      output_file = `./cache/${file_number}.json`
      const cleanJobResult = process_job(job)
      if (isFailure(cleanJobResult)) {
        ///log or some shit
      }
      const jsonData = payload(cleanJobResult)
      if (counter > 100) return
      fs.appendFile(output_file, JSON.stringify(jsonData) + '\n', err => {
        if (err) throw err
      })
      counter += 1
    })
    flowStream.on('end', () => {
      resolve(success({ output_file }))
    })
    flowStream.on('error', () => {
      resolve(failure({ output_file }))
    })
  })
}

function process_job(job) {
  const r1 = cleanJobBody(job)
  if (isFailure(r1)) return r1
  const cleanJson = payload(r1)

  const updatedJob = addGoogleStructuredData(cleanJson)
  return success(updatedJob)
}

function addGoogleStructuredData(job) {
  const r1 = json2gsd(job)
  if (isFailure(r1)) return r1
  const gsdJob = payload(r1).rendered
  return Object.assign({}, job, { gsd: gsdJob })
}

function cleanJobBody(job) {
  const r1 = cleanHtmlBody(job.body)
  if (isFailure(r1)) return r1
  const cleanBody = payload(r1)
  return success(Object.assign({}, job, { body: cleanBody }))
}

function cleanHtmlBody(dirtyHtml) {
  try {
    return success(sanitizeHtml(dirtyHtml))
  } catch (e) {
    return failure(e.toString())
  }
}

module.exports = {
  parse,
  cleanHtmlBody,
  cleanJobBody,
}
