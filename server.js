var coap    = require('coap'),
url         = require('url'),
http        = require('http'),
querystring = require('querystring');

//TODO ver opcion de proxy Coap segun la norma
//TODO ver como generar .well-known/core
//TODO validations
//TODO volverlo parametrizable


var server         = coap.createServer();
var sosfulHostname = 'localhost';
var sosfulPort     = 3000;
var sosContentType = 'application/json';

mappingStatus = function (httpCode, httpMethod) {
  switch (httpCode) {
    //2xx -> 2.xx: Success
    case 200: //OK
    return  '2.05'; //Content
    case 201: //Created
    return  '2.01'; //Created
    case 204: //No Content
    if('DELETE' == httpMethod) return  '2.02'; //Deleted
    if('PUT' == httpMethod) return  '2.04'; //Changed
    break;
    case 304: //Not Modified
    return  '2.03'; //Valid
    //4xx -> 4.xx: Client Error
    case 400: //Bad Request
    return  '4.00'; //Bad Request
    case 401: //Unauthorized
    return  '4.01'; //Unauthorized
    case 403: //Forbidden
    return  '4.03'; //Forbidden
    case 404: //Not Found
    return  '4.04';  //Not Found
    case 405: //Method Not Allowed
    return  '4.05';  //Method Not Allowed
    case 406: //Not Acceptable
    return  '4.06';  //Not Acceptable
    case 412: //Precondition Failed
    return  '4.12';  //Precondition Failed
    case 415: //Unsupported Content-Format
    return  '4.15';  //Unsupported Content-Format
    //5xx -> 5.xx: Server Error
    case 500: //Internal Server Error
    return  '5.00';  //Internal Server Error
    case 501: //Not Implemented
    return  '5.01';  //Not Implemented
    case 502: //Bad Gateway
    return  '5.02';  //Bad Gateway
    case 503: //Service Unavailable
    return  '5.03';  //Service Unavailable
    case 504: //Gateway Timeout
    return  '5.04';  //Gateway Timeout
    //5.05 Proxying Not Supported
  }
};

server.on('request', function(req, res) {
  if (req.headers.Accept != 'application/json' || req.headers['Content-Format'] != 'application/json') {
    res.code = '4.06';
    return res.end();
  }

  var postData = req.payload;

  var options = {
    hostname: sosfulHostname,
    port    : sosfulPort,
    path    : req.url,
    method  : req.method,
    headers: {
      'Content-Type': sosContentType,
      'Content-Length': postData.length
    }
  };

  var reqHttp = http.request(options, function (resHttp) {
    resHttp.setEncoding('utf8');

    var response = '';
    resHttp.on('data', function (data) {
      response = data;
    });

    resHttp.on('end', function () {
      res.code = mappingStatus(resHttp.statusCode, req.method);
      if (0 < response.length) {
        res.setOption('Content-Format', 'application/json');
        return res.end(response);
      } else {
        return res.end();
      }
    });
  });

  reqHttp.on('error', function (e) {
    res.code = '5.00';
    return res.end();
  });

  // write data to request body
  reqHttp.write(postData);
  reqHttp.end();
});

// Begin accepting connections
// the default address is localhost
// the default CoAP port is 5683
server.listen(function() {
  console.log('CoAP/SOSful proxy running on coap://localhost:5683');
});

//Closes the server
//server.close()
