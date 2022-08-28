const path = require('path');

module.exports.pitch = function(remainingRequest) {
	this.cacheable(false);
	const filename = path.basename(this.resourcePath);
	const { source } = this.getOptions();

	console.log(this);

	return `
		var {styleCollector} = require('@optimaxdev/utils');

		styleCollector.addStyles('${source}', '${filename}');

		var cssModules = require(${JSON.stringify(this.utils.contextify(this.context || this.rootContext,  `!!${remainingRequest}`))}).default;

		export default cssModules;
	`;
}