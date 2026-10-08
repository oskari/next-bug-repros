// A no-op 'use cache' handler: any custom cacheHandlers entry triggers the bug.
module.exports = {
  async get() {},
  async set() {},
  async refreshTags() {},
  async getExpiration() {
    return 0
  },
  async updateTags() {},
}
