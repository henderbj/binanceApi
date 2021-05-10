// Created by https://github.com/henderbj

// https://github.com/henderbj/webClient
// webClient dir must be at same level as binanceApi dir for this require to work
const webClient = require('../../webClient/src/webClient');

const apiUnblocked = null; //value of blockedTil when is unblocked

exports.blockedTil = apiUnblocked;
exports.keys = {};
exports.host = '';

exports.request = function (options = {}, callback) {
  if (!options) {
    return null;
  }
  if (exports.blockedTil) {
    const timestamp = Date.now();
    if (timestamp > exports.blockedTil) {
      exports.blockedTil = apiUnblocked;
    } else {
      return null;
    }
  }
  if (
    options.binance &&
    options.binance.timestamp &&
    !options.params.timestamp
  ) {
    const timestamp = Date.now();
    options.params.timestamp = timestamp;
  }
  if (options.binance && options.binance.signed) {
    const crypto = require('crypto');
    const apiParams = webClient.getParams(options.params);
    const signature = crypto
      .createHmac('sha256', options.binance.keys.secretKey)
      .update(apiParams)
      .digest('hex');
    options.params.signature = signature;
    if (
      !options.network.headers ||
      !Object.keys(options.network.headers).length
    ) {
      options.network.headers = {};
    }
    options.network.headers['X-MBX-APIKEY'] = options.binance.keys.apiKey;
  }
  let network, params;
  ({ network, params } = options);
  const request = webClient.request({ network, params }, callback);
  return request;
};

exports.manageNetError = function(error){
  console.error('Caught Error: error=', error);
  if(error.code === 'ENOTFOUND'){
    process.exit(error.errno);
  }
}

exports.checkLimits = function (message) {
  const headers = message.headers;
  console.log(
    'checkLimits: headers[x-mbx-used-weight]=',
    headers['x-mbx-used-weight']
  );
  let delay, timestamp;
  switch (message.statusCode) {
  case 200:
    return null;
  case 418:
  case 429:
    console.log('statusCode=', message.statusCode);
    delay = headers['Retry-After'];
    timestamp = Date.now();
    return timestamp + delay * 1000;
  }
};

exports.callTypes = Object.freeze({
  klines: 1,
  avgPrice: 2,
  openOrders: 3,
  newOrder: 4,
  allCoins: 5,
  account: 6,
  myTrades: 7,
});
exports.sides = Object.freeze({ buy: 'BUY', sell: 'SELL' });

exports.options = function (type, host = '', params = {}, binance = {}) {
  let invalidInput = !host || !host.length;
  const result = { network: {} };
  result.network.host = host;
  result.network.protocol = 'https:';
  switch (type) {
  case exports.callTypes.klines:
    invalidInput =
        !params ||
        typeof params !== 'object' ||
        !params.symbol ||
        !params.interval;
    result.network.path = '/api/v3/klines';
    result.network.method = 'GET';
    break;
  case exports.callTypes.avgPrice:
    invalidInput = !params || typeof params !== 'object' || !params.symbol;
    result.network.path = '/api/v3/avgPrice';
    result.network.method = 'GET';
    break;
  case exports.callTypes.openOrders:
    if (typeof binance === 'object') {
      binance.timestamp = true;
      binance.signed = true;
    }
    invalidInput =
        invalidInput ||
        !binance ||
        typeof binance !== 'object' ||
        typeof binance.keys !== 'object' ||
        !binance.keys.apiKey ||
        !binance.keys.secretKey;
    result.network.path = '/api/v3/openOrders';
    result.network.method = 'GET';
    break;
  case exports.callTypes.newOrder:
    if (typeof binance === 'object') {
      binance.timestamp = true;
      binance.signed = true;
    }
    invalidInput =
        invalidInput ||
        !binance ||
        !typeof binance === 'object' ||
        !typeof binance.keys === 'object' ||
        !binance.keys.apiKey ||
        !binance.keys.secretKey ||
        !params ||
        typeof params !== 'object' ||
        !params.symbol ||
        !params.side ||
        !params.type;
    result.network.path = '/api/v3/order';
    result.network.method = 'POST';
    break;
  case exports.callTypes.allCoins:
    invalidInput =
        invalidInput ||
        !binance ||
        !typeof binance === 'object' ||
        !typeof binance.keys === 'object' ||
        !binance.keys.apiKey ||
        !binance.keys.secretKey;
    result.network.path = '/sapi/v1/capital/config/getall';
    result.network.method = 'GET';
    break;
  case exports.callTypes.account:
    if (typeof binance === 'object') {
      binance.timestamp = true;
      binance.signed = true;
    }
    invalidInput =
        invalidInput ||
        !binance ||
        !typeof binance === 'object' ||
        !typeof binance.keys === 'object' ||
        !binance.keys.apiKey ||
        !binance.keys.secretKey;
    result.network.path = '/api/v3/account';
    result.network.method = 'GET';
    break;
  case exports.callTypes.myTrades:
    if (typeof binance === 'object') {
      binance.timestamp = true;
      binance.signed = true;
    }
    invalidInput =
        invalidInput ||
        !binance ||
        !typeof binance === 'object' ||
        !typeof binance.keys === 'object' ||
        !binance.keys.apiKey ||
        !binance.keys.secretKey;
    result.network.path = '/api/v3/myTrades';
    result.network.method = 'GET';
    break;
  default:
    throw new Error(
      'Invalid api call type. Valid values are in exports.types object of binanceApi'
    );
  }
  if (invalidInput) {
    return null;
  }
  result.params = params;
  result.binance = binance;
  return result;
};

exports.Bot = class {
  constructor(
    baseCoin = 'BTC',
    quoteCoin = 'USDT',
    interval = '1d',
    quoteMax = '15',
    cummulativeQuoteQty = null
  ) {
    if (typeof exports.Bot.instances === 'undefined') {
      exports.Bot.instances = [];
    }
    this.id = exports.Bot.instances.length + 1;
    this.baseCoin = baseCoin;
    this.quoteCoin = quoteCoin;
    this.symbol = baseCoin + quoteCoin;
    this.interval = interval;
    this.quoteMax = quoteMax;
    this.cummulativeQuoteQty = cummulativeQuoteQty;
    exports.Bot.instances.push(this.id);
  }
  getId() {
    return this.id;
  }
  getBaseCoin() {
    return this.baseCoin;
  }
  getCummulativeQuoteQty() {
    return this.cummulativeQuoteQty;
  }
  setCummulativeQuoteQty(cummulativeQuoteQty) {
    this.cummulativeQuoteQty = cummulativeQuoteQty;
  }
  getQuoteCoin() {
    return this.quoteCoin;
  }
  getSymbol() {
    return this.symbol;
  }
  getInterval() {
    return this.interval;
  }
  getQuoteMax() {
    return this.quoteMax;
  }
  setquoteMax(quoteMax) {
    this.quoteMax = quoteMax;
  }
  getStatus() {
    return this.status;
  }
  setStatus(status) {
    this.status = status;
  }
  processMyTrades(input) {
    let data = JSON.parse(input.body);
    const freeBaseCoin = exports.Bot.freeCoin(this.baseCoin);
    let baseQtyAccumulator = 0;
    let quoteQtyAccumulator = 0;
    let baseQtyMax = 0;
    let quoteQtyMax = 0;
    let approxQuoteQty = 0;
    for (
      let index = data.length - 1;
      index >= 0 && baseQtyAccumulator < freeBaseCoin;
      index--
    ) {
      const item = data[index];
      if (item.isBuyer) {
        baseQtyAccumulator += parseFloat(item.qty);
        quoteQtyAccumulator += parseFloat(item.quoteQty);
        if (baseQtyAccumulator > baseQtyMax) {
          baseQtyMax = baseQtyAccumulator;
          quoteQtyMax = quoteQtyAccumulator;
        }
      } else {
        baseQtyAccumulator -= parseFloat(item.qty);
        quoteQtyAccumulator -= parseFloat(item.quoteQty);
      }
    }
    if (baseQtyMax > 0) {
      approxQuoteQty = (quoteQtyMax / baseQtyMax) * freeBaseCoin;
    }
    this.setCummulativeQuoteQty(approxQuoteQty);
  }
  static refreshAccount() {
    let options = exports.options(
      exports.callTypes.account,
      exports.host,
      {},
      { keys: exports.keys }
    );
    return exports.request(options, exports.Bot.processAccount);
  }
  static getAccount() {
    return exports.Bot.account;
  }
  static setAccount(accounData) {
    exports.Bot.account = accounData;
  }
  //freeCoin(asset) gets free or available quantity of asset
  static freeCoin(asset) {
    if (
      typeof exports.Bot.account !== 'object' ||
      !Array.isArray(exports.Bot.account.balances)
    ) {
      throw new Error('freeCoin: Invalid account data');
    }
    const found = exports.Bot.account.balances.find((balance) => {
      if (typeof balance === 'object') {
        return balance.asset === asset;
      }
    });
    if (typeof found === 'object') {
      return found.free;
    } else {
      return null;
    }
  }
  static getValueInQuote(baseCoin, tradePrice) {
    const freeBaseCoin = exports.Bot.freeCoin(baseCoin);
    const quoteValue = parseFloat(freeBaseCoin) * parseFloat(tradePrice);
    return quoteValue;
  }
  static processAccount(input) {
    if (typeof input === 'object') {
      exports.blockedTil = exports.checkLimits(input.message);
    } else {
      throw new Error('processAccount: Invalid input parameter');
    }
    const account = JSON.parse(input.body);
    if (typeof account !== 'object') {
      throw new Error('processAccount: account is no an object');
    }
    //set binance account information and latest balance
    exports.Bot.setAccount(account);
  }
};
