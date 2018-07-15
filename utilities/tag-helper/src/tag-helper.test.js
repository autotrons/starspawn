const {
  PORT,
  start,
  stop,
  cleanAndClickable,
  fullPage,
} = require('./tag-helper')
const equal = require('assert').deepEqual

describe(`tag-helper.js`, () => {
  describe(`server()`, () => {
    it(`should start`, async () => {
      await start()
    })
    it(`should stop`, async () => {
      await stop()
    })
  })

  describe(`cleanAndClickable()`, () => {
    it(`should create a list of clickable texts from one title.`, () => {
      const title = '#459-Diesel Mechanic Apprentice - Tire Care'
      const html = cleanAndClickable(title)
      equal(
        html,
        '<a class="button">diesel</a> <a class="button">mechanic</a> <a class="button">apprentice</a> <a class="button">tire</a> <a class="button">care</a>'
      )
    })
  })

  describe(`fullPage()`, () => {
    it(`should return the whole page`, () => {
      const ret = fullPage()
    })
  })
})
