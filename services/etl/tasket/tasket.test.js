const equal = require('assert').deepEqual
const tasket = require('./tasket')
const { try_until, sleep } = require('./tasket')
const uuid = require('uuid')
const log = console.log

describe('tasket.js', function() {
  describe('ok()', () => {
    it('create a new tasket from nothing', () => {
      const t1 = tasket.ok()
      tasket.assert(t1)
      tasket.assert_empty(t1)
    })
    it('create tasket with some fields', () => {
      const id = uuid.v4()
      const source = 'worker1'
      const trace = true
      const test = false
      const callback = 'https://foo/bar'
      const path = ['foo', 'bar']
      const timeout = 42
      const data = { job: 12345 }
      const meta = { cache_hit: false }
      const t1 = tasket.ok(
        id,
        source,
        callback,
        path,
        data,
        meta,
        timeout,
        trace,
        test
      )
      tasket.assert_ok(t1)
      equal(tasket.id(t1), id)
    })
    it('take a previous task and a payload', () => {
      const id = uuid.v4()
      const source = 'worker1'
      const trace = true
      const test = false
      const callback = 'https://foo/bar'
      const path = ['foo', 'bar']
      const timeout = 42
      const data = { job: 'abcd-efgh' }
      const meta = { cache_hit: false }
      const t1 = tasket.ok(
        id,
        source,
        callback,
        path,
        data,
        meta,
        timeout,
        trace,
        test
      )
      tasket.assert_ok(t1)
      const data2 = { job: '1234-5678' }
      const [prev, next] = tasket.complete_ok(t1, data2)
      tasket.assert_ok(next)
      equal(tasket.completed(prev) >= tasket.created(prev), true)
      equal(tasket.path(prev), path)
      equal(tasket.path(next), ['bar'])
    })
  })
  describe('fail()', () => {
    it('create a new tracer from nothing', () => {
      const t1 = tasket.fail()
      tasket.assert(t1)
    })
    it('has some fields', () => {
      const id = uuid.v4()
      const source = 'worker1'
      const trace = true
      const test = false
      const callback = 'https://foo/bar'
      const path = ['foo', 'bar']
      const timeout = 42
      const data = { job: 12345 }
      const meta = { cache_hit: false }
      const t1 = tasket.fail(
        id,
        source,
        callback,
        path,
        data,
        meta,
        timeout,
        trace,
        test
      )
      tasket.assert_fail(t1)
      equal(tasket.id(t1), id)
    })
  })
  describe('complete_fail()', () => {
    it('complete with a failure', () => {
      const id = uuid.v4()
      const source = 'worker1'
      const trace = true
      const test = false
      const callback = 'https://foo/bar'
      const path = ['foo', 'bar']
      const timeout = 42
      const data = { job: 'abcd-efgh' }
      const meta = { cache_hit: false }
      const t1 = tasket.ok(
        id,
        source,
        callback,
        path,
        data,
        meta,
        timeout,
        trace,
        test
      )
      tasket.assert_ok(t1)
      const error = 'something bad happened'
      const [prev, next] = tasket.complete_fail(t1, error)
      tasket.assert_fail(next)
      equal(tasket.completed(prev) >= tasket.created(prev), true)
      equal(tasket.path(prev), path)
      equal(tasket.path(next), ['bar'])
    })
  })
  describe('try_until()', () => {
    it('try it until it is true', async () => {
      let i = 0
      let checks = 0
      const handle = setInterval(() => {
        i++
      }, 10)
      const result = await try_until(10, 110, async () => {
        await sleep(20)
        checks++
        return i > 10
      })
      clearInterval(handle)
      equal(checks > 3, true)
      equal(checks < 6, true)
    })
  })
  describe('trace_wait()', () => {
    it('wait for all taskets to arrive', async () => {
      const id = uuid.v4()
      const source = 'worker1'
      const trace = true
      const test = false
      const callback = 'https://foo/bar'
      const path = ['foo', 'bar']
      const timeout = 42
      const data = { job: 12345 }
      const meta = { cache_hit: false }
      const t1 = tasket.ok(
        id,
        source,
        callback,
        path,
        data,
        meta,
        timeout,
        trace,
        test
      )
      tasket.assert_ok(t1)
      equal(tasket.id(t1), id)
    })
  })
})
