function sleep(ms) {
  return new Promise(res => {
    setTimeout(() => {
      res()
    }, ms)
  })
}

async function waitUntilTrue(checkFunction, ms) {
  while (checkFunction() !== true) {
    await sleep(ms)
  }
  return
}

module.exports = {
  sleep,
  waitUntilTrue
}
