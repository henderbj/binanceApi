const webClient = require('../webClient/webClient');

exports.request =  function(options={}, callback){
	if(options.binance && options.binance.timestamp && !options.params.timestamp){
		const timestamp = Date.now();
		options.params.timestamp = timestamp;
	}

	if(options.binance && options.binance.signed){
		const crypto = require('crypto');
		const apiParams = webClient.getParams(options.params);
		const signature = crypto.createHmac('sha256', options.binance.keys.secretKey)
		.update(apiParams)
		.digest("hex");
	  options.params.signature = signature;
		if(!options.network.headers || !Object.keys(options.network.headers).length){
			options.network.headers = {};
		}
		options.network.headers['X-MBX-APIKEY'] =  options.binance.keys.apiKey;
	}

	({network, params, binance} = options);
	const request = webClient.request({network, params}, callback);
	return request;
}

exports.getKlines = function(params, host){
	// Read: https://github.com/binance/binance-spot-api-docs/blob/master/rest-api.md#klinecandlestick-data
	if(!params || !params.symbol || typeof params.symbol !== "string" 
		|| !params.interval || typeof params.interval !== "string" || typeof host !== "string"){
		return null;
	}
	
	const result = {};
	result.network = {
		host: host,
		path: '/api/v3/klines',
		protocol: 'https:',
		method: 'GET'
	};
	result.params = params;
  return result;
}
