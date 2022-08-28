const createStyleCollector = () => {
	let styles = {};

	const collectStyles = ((callback) => {
		const value = callback();
		return [value, styles];
	});
	
	const addStyles = (source, name) => {
		const newStyles = [...(styles[source] || []), name];
	
		styles = {
			...styles,
			[source]: [...new Set(newStyles)],
		}
	}

	return {
		collectStyles,
		addStyles
	}
}

export const styleCollector = createStyleCollector();