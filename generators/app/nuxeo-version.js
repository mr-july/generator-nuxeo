const KEY = '_nuxeo_version';
const VERSION = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:\.(?:0|[1-9]\d*))?(?:-[\dA-Z-]+)?$/i;
const PACKAGE = /^org\.nuxeo\.?/i;
const debug = require('debug')('nuxeo:app:version');

function validate(version) {
  if (typeof version !== 'string') {
    throw new TypeError('Invalid argument expected string');
  }
  return VERSION.test(version);
}

// module as function ?
function isUndefined(o) {
  return o === undefined || typeof o === 'undefined';
}

function isNuxeoPackage(pkg) {
  return !isUndefined(pkg) && PACKAGE.test(pkg);
}

module.exports = {
  _hasNuxeoVersion: function() {
    return !isUndefined(this.config.get(KEY));
  },

  _getNuxeoVersion: function() {
    return this.config.get(KEY);
  },

  _setNuxeoVersion: function(version) {
    this.config.set(KEY, version);
  },

  _findNuxeoVersion: function(answers) {
    if (!isUndefined(answers.nuxeo_version)) {
      debug(`Found version in answers: ${answers.nuxeo_version}`);
      return this._storeVersion(answers.nuxeo_version);
    }

    if (isNuxeoPackage(answers.super_package) && !isUndefined(answers.super_version)) {
      debug(`Found version Package: ${answers.super_package}`);
      return this._storeVersion(answers.super_version);
    }

    if (isNuxeoPackage(answers.parent_package) && !isUndefined(answers.parent_version)) {
      debug(`Found version parent Package: ${answers.parent_package}`);
      return this._storeVersion(answers.parent_version);
    }

    debug('Did not find any Nuxeo version in: %O', answers);
    return false;
  },

  _storeVersion: function(version) {
    debug(`Try to store version: ${version}`);
    if (validate(version)) {
      if (!isUndefined(this._getNuxeoVersion())) {
        this.log.info('Trying to override current version: ' + this._getNuxeoVersion() + ' with: ' + version);
        return false;
      }

      this._setNuxeoVersion(version);
      return true;
    } else {
      this.log.error('Unable to parse version: ' + version);
      return false;
    }
  }
};
