'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SERVER_TIME_MAP = undefined;
exports.getCurrentServerTime = getCurrentServerTime;

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _urijs = require('urijs');

var _urijs2 = _interopRequireDefault(_urijs);

var _package = require('../package.json');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// keep a local map of server times
// (export this purely for testing purposes)
var SERVER_TIME_MAP = exports.SERVER_TIME_MAP = {};

var HorizonAxiosClient = _axios2.default.create({
  headers: {
    'X-Client-Name': 'js-stellar-sdk',
    'X-Client-Version': _package.version
  }
});

function _toSeconds(ms) {
  return Math.floor(ms / 1000);
}

HorizonAxiosClient.interceptors.response.use(function (response) {
  var hostname = (0, _urijs2.default)(response.config.url).hostname();
  var serverTime = _toSeconds(Date.parse(response.headers.Date));
  var localTimeRecorded = _toSeconds(new Date().getTime());

  // eslint-disable-next-line no-restricted-globals
  if (!isNaN(serverTime)) {
    SERVER_TIME_MAP[hostname] = {
      serverTime: serverTime,
      localTimeRecorded: localTimeRecorded
    };
  }

  return response;
});

exports.default = HorizonAxiosClient;

/**
 * Given a hostname, get the current time of that server (i.e., use the last-
 * recorded server time and offset it by the time since then.) If there IS no
 * recorded server time, or it's been 5 minutes since the last, return null.
 * @param {string} hostname Hostname of a Horizon server.
 * @returns {number} The UNIX timestamp (in seconds, not milliseconds)
 * representing the current time on that server, or `null` if we don't have
 * a record of that time.
 */

function getCurrentServerTime(hostname) {
  var _ref = SERVER_TIME_MAP[hostname] || {},
      serverTime = _ref.serverTime,
      localTimeRecorded = _ref.localTimeRecorded;

  if (!serverTime || !localTimeRecorded) {
    return null;
  }

  var currentTime = _toSeconds(new Date().getTime());

  // if it's been more than 5 minutes from the last time, then null it out
  if (currentTime - localTimeRecorded > 60 * 5) {
    return null;
  }

  return currentTime - localTimeRecorded + serverTime;
}