const { assertSuccess, payload } = require('@pheasantplucker/failables')
const assert = require('assert')
const equal = assert.deepEqual
const { parse } = require('himalaya')
const {
  createDatastoreClient,
  makeEntityByName,
  deleteEntity,
  writeEntity,
} = require('@pheasantplucker/gc-datastore')

const {
  render,
  getDataFromDatastore,
  unsanitizeDescriptionHtml,
  timeAgo,
  getByUrl,
} = require('./render')

const realJob = require('./realJobSchemaed.json')
const realJobKey = realJob.id
const projectFullName = 'starspawn-201921'
// this jobid will need to get updated as it may get deleted at some point
const jobid = '0043c6ceb907eaea2d639e0fcfa4ca8b'

let writtenEntities = []

describe('render.js ', function() {
  this.timeout(10 * 1000)
  before(async () => {
    const r1 = await createDatastoreClient(projectFullName)
    assertSuccess(r1)
    const r2 = makeEntityByName('testKind', realJobKey, realJob)
    assertSuccess(r2)
    const jobEntity = payload(r2)
    const writeJob = await writeEntity(jobEntity)
    assertSuccess(writeJob)
    writtenEntities.push(jobEntity)
  })

  after(async () => {
    writtenEntities.map(async ent => {
      const removal = await deleteEntity(ent)
      assertSuccess(removal)
    })
  })

  describe('getDataFromDatastore()', function() {
    this.timeout(540 * 1000)
    it('Should get a job by id / key', async () => {
      const result = await getDataFromDatastore(jobid)
      assertSuccess(result)
      const job = payload(result)
      equal(job.id, jobid)
    })
    it('Should get a job by url too', async () => {
      // this may fail as we wipe the database
      const url = 'RN-in-St-Paul-Cottage-Grove-MN-0043'
      const result = await getDataFromDatastore(url)
      assertSuccess(result)
      const job = payload(result)
      equal(job.url, url)
    })
  })

  describe('unsanitizeDescriptionHtml()', () => {
    it(`should take a piece of sanitized html and make it renderable`, () => {
      const sanHtml = '&lt;li&gt;Minimum'
      const html = '<li>Minimum'
      const r1 = unsanitizeDescriptionHtml(sanHtml)
      assertSuccess(r1)
      const ret = payload(r1)
      equal(ret, html)
    })
  })

  describe('render()', () => {
    it('Should render an AMP page from a query string', async () => {
      const { req, res } = make_req_res()
      const result = await render(req, res)
      assertSuccess(result)
      const renderedAmp = payload(result)
      const parsed = parse(renderedAmp)
      assert(typeof renderedAmp === 'string')
      assert(parsed[0].tagName === '!doctype')
    })
  })
  describe('getByUrl()', () => {
    it('Should get a job by the url', async () => {
      const url = 'RN-in-St-Paul-Cottage-Grove-MN-0043'
      const result = await getByUrl(url)
      assertSuccess(result)
      const job = payload(result)
      equal(job.url, url)
    })
  })
  describe(`timeAgo()`, () => {
    it(`should return the english time ago equiv given a date`, () => {
      const result = timeAgo(new Date() - 1000)
      assertSuccess(result)
      const val = payload(result)
      const last3Letters = val.substring(val.length - 3)
      equal(last3Letters, 'ago')
    })
  })
})

function make_req_res() {
  const req = {
    params: {
      jobId: jobid,
    },
  }
  const res = {
    status: function() {
      return {
        send: () => {},
      }
    },
    send: () => {},
  }
  return {
    req,
    res,
  }
}
