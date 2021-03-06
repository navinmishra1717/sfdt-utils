import get from 'lodash/get';
import filter from 'lodash/filter';
import forEach from 'lodash/forEach';
// DEPRECATED, use sfdt/blocksProcess
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (sfdt, callback, listConditionCallback = (arg) => true) => {
	if (!sfdt.sections) {
		console.warn('Missing: sfdt.sections', sfdt);
		return false;
	}

	forEach(sfdt.sections, (section) => {
		if (!section.blocks && !section.headersFooters) {
			return false;
		}

		const newBlocks = filter(section.blocks, (block) => {
			if (!block.inlines) {
				if (block.rows) {
					const rows = block.rows;
					forEach(rows, function(row: any) {
						if (Object.prototype.hasOwnProperty.call(row, 'cells')) {
							const cells = row.cells;
							forEach(cells, function(cell: any) {
								if (Object.prototype.hasOwnProperty.call(cell, 'blocks')) {
									const cellBlocks = cell.blocks;
									forEach(cellBlocks, function(cellBlock: any) {
										cellBlock.inlines = callback(cellBlock.inlines);
										return true;
									});
								}
							});
						}
					});
				}
				return true;
			}

			const canAddBlock = listConditionCallback(block);
			if (!canAddBlock) {
				return false;
			} else {
				// block.inlines = callback(block.inlines)
				const newInlines = callback(block.inlines);
				// Remove the blocks if the inline is removed i.e [] from the condition in callback function
				if (!newInlines || (newInlines.length === 0 && block.inlines.length > 0)) {
					return false;
				}
				block.inlines = newInlines;
				return true;
			}
		});
		section.blocks = newBlocks;

		if (get(section, 'headersFooters')) {
			for (const eachKey in section.headersFooters) {
				const child = section.headersFooters[eachKey];

				if (child.blocks) {
					child.blocks.forEach((block) => {
						if (!block.inlines) {
							return false;
						}
						child.inlines = callback(block.inlines);
					});
				}
			}
		}
	});

	return true;
};
