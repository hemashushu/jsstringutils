const CaseType = require('./src/casetype');
const HashAlgorithm = require('./src/hashalgorithm');
const StringUtils = require('./src/stringutils');
const UnicodeCharType = require('./src/unicodechartype');

const StringUtils = {
    CaseType: CaseType,
    HashAlgorithm: HashAlgorithm,
    StringUtils: StringUtils,
    UnicodeCharType: UnicodeCharType
};

module.exports = StringUtils;