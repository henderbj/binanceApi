const assert = require('assert');
const mocha = require('mocha');
const describe = mocha.describe;
const it = mocha.it;
const api = require('../src/binanceApi');
const userOptions = require('./userOptions');

const setFree = function(account, baseCoin, free) {
  const index = account.balances.findIndex(item => item.asset === baseCoin);
  account.balances[index].free = free;
};

describe('tradeStrategy function tests', function() {
  describe('#tradeStrategy)', function() {
    it('should return --nothing-- if klines are not moving much', function() {
      const bot = new api.Bot();
      assert.equal(bot.id, 1);
      const account = require('./account.json');
      api.Bot.setAccount(account);
      const klines = require('./klines-nothing.json');
      const interval = '1d';
      const strategy = api.tradeStrategy(userOptions, bot, klines, interval, 1621814399999);
      assert.equal(strategy, api.tradeStatuses.nothing);
    });
    it('should return --buy-- if klines are down and growing', function() {
      const bot = new api.Bot();
      bot.setCummulativeQuoteQty(0.00);
      const klines = require('./klines-buy.json');
      const interval = '1d';
      const strategy = api.tradeStrategy(userOptions, bot, klines, interval, 1621814399999);
      assert.equal(strategy, api.tradeStatuses.buy);
    });
    it('should return --sell-- if klines are up and reducing', function() {
      const account = require('./account.json');
      const bot = new api.Bot();
      bot.setCummulativeQuoteQty(440.00);
      setFree(account, bot.getBaseCoin(), 0.01);
      const klines = require('./klines-sell.json');
      const interval = '1d';
      const strategy = api.tradeStrategy(userOptions, bot, klines, interval, 1621814399999);
      assert.equal(strategy, api.tradeStatuses.sell);
    });
    it('should return --sellLowPrice-- if klines are up and reducing but valueNow < valueBuy', function() {
      const account = require('./account.json');
      const bot = new api.Bot();
      bot.setCummulativeQuoteQty(490.00);
      setFree(account, bot.getBaseCoin(), 0.01);
      const klines = require('./klines-sellLowPrice.json');
      const interval = '1d';
      const strategy = api.tradeStrategy(userOptions, bot, klines, interval, 1621814399999);
      assert.equal(strategy, api.tradeStatuses.sellLowPrice);
    });
    it('should return --sell-- if klines are over max gain', function() {
      const account = require('./account.json');
      const bot = new api.Bot();
      bot.setCummulativeQuoteQty(40.00);
      setFree(account, bot.getBaseCoin(), 0.01);
      const klines = require('./klines-nothing.json');
      const interval = '1d';
      const strategy = api.tradeStrategy(userOptions, bot, klines, interval, 1621814399999);
      assert.equal(strategy, api.tradeStatuses.sell);
    });
  });
});
