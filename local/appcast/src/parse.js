const {
  failure,
  success,
  isFailure,
  payload,
} = require('@pheasantplucker/failables')
const { json2gsd } = require('./json2gsd.js')
const flow = require('xml-flow')
const sanitizeHtml = require('sanitize-html')
const fs = require('fs-extra')
const he = require('he')
const md5 = require('md5')

const JOBS_PER_FILE = 500

async function parse(filePath) {
  const file_name = filePath.substr(filePath.lastIndexOf('/') + 1)
  const temp_dir = `./cache/parse_${file_name}`
  await fs.emptyDir(temp_dir)

  return new Promise(resolve => {
    const readStream = fs.createReadStream(filePath)
    let output_file
    const flowStream = flow(readStream)
    let counter = 0
    let file_number = 0
    let jobFiles = []
    let cityFiles = {}
    flowStream.on('tag:job', async (job, encoding, cb) => {
      file_number = Math.floor(counter / JOBS_PER_FILE)
      job_output_file = `${temp_dir}/${file_name}_${file_number}.json`
      
      if (counter % JOBS_PER_FILE === 0) {
        jobFiles.push(job_output_file)
      }
      
      const cleanJobResult = process_job(job)
      if (isFailure(cleanJobResult)) {
        ///log or some shit
      }
      const jsonData = payload(cleanJobResult)
      // if (counter > 100) return
      
      const city = jsonData.city
      const clean_city = city.replace(' ', '_')
      const state = jsonData.state
    
      const city_key = `${state}_${clean_city}`
      city_output_file = `${temp_dir}/${file_name}_${state}_${clean_city}.json`
      cityFiles[city_key] = city_output_file
      fs.appendFile(job_output_file, JSON.stringify(jsonData) + '\n', err => {
        if (err) throw err
      })      

      fs.appendFile(city_output_file, JSON.stringify(jsonData) + '\n', err => {
        if (err) throw err
      })

      counter += 1
    })
    flowStream.on('end', () => {
      resolve(success({ jobFiles, cityFiles }))
    })
    flowStream.on('error', () => {
      resolve(failure({ jobFiles, cityFiles }))
    })
  })
}

function process_job(job) {
  const r1 = cleanJobBody(job)
  if (isFailure(r1)) return r1
  const cleanJson = payload(r1)

  const updatedJob = addGoogleStructuredData(cleanJson)

  const schemaJob = appcast_datastore_job(updatedJob)
  return success(schemaJob)
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

function appcast_hash(j) {
  return md5(j.body)
}
function appcast_id(j) {
  return md5(j.job_reference)
}

function appcast_to_url(j) {
  const t0 = `${j.title.slice(0, 25)}_${j.city}_${j.state}`
  const t1 = t0.replace(/\s+/g, '_')
  const t2 = t1.replace(/[^a-z0-9_+]+/gi, '')
  const t3 = t2.replace(/_+/g, '_')
  const t4 = t3.replace(/_+/g, '-')
  const id = `${t4}-${md5(j.job_reference).slice(0, 4)}`
  return id
}

function appcast_datastore_job(j, is_test = false) {
  const id = appcast_id(j)
  const sanitizedDescription = removeEscapeCharacters(j.gsd.description)
  if (isFailure(sanitizedDescription)) return sanitizedDescription
  const gsd = Object.assign({}, j.gsd, {
    description: payload(sanitizedDescription),
  })
  return {
    id: id,
    version: 1,
    body: j.body,
    category: j.category,
    city: j.city,
    company: j.company,
    country: j.country,
    cpc: j.cpc,
    cpa: j.cpa,
    html_jobs: j.html_jobs,
    job_reference: j.job_reference,
    job_type: j.job_type,
    location: j.location,
    mobile_friendly_apply: j.mobile_friendly_apply,
    posted_at: new Date(j.posted_at),
    created_at: new Date(Date.now()),
    state: j.state,
    title: j.title,
    apply_url: j.url,
    zip: j.zip,
    gsd: JSON.stringify(gsd),
    hash: appcast_hash(j),
    source: 'appcast',
    url: appcast_to_url(j),
    is_test,
  }
}

const removeEscapeCharacters = html => {
  try {
    const decodedHtml = he.unescape(html)
    return success(decodedHtml)
  } catch (e) {
    return failure(e.toString())
  }
}

module.exports = {
  parse,
  cleanHtmlBody,
  cleanJobBody,
  appcast_datastore_job,
}
