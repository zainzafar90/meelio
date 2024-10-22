module.exports.readVersion = function (contents) {
  return contents.match(/VERSION\s*=\s*['"](.*)['"];?/)[1];
};

module.exports.writeVersion = function (contents, version) {
  return contents.replace(
    /VERSION\s*=\s*['"](.*)['"];?/,
    `VERSION = '${version}';`
  );
};
