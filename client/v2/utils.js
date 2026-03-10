// Invoking strict mode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode#invoking_strict_mode
'use strict';


/**
 * 
 * @param {Array} deals - list of deals
 * @returns {Array} list of lego set ids
 */
const getIdsFromDeals = deals => {
    return deals.map(deal => deal.id)
}

/**
 * Calculate the percentile value from an array of numbers
 * @param {Array} values - array of numbers
 * @param {Number} percentile - percentile value (0-100)
 * @returns {Number} percentile value
 */
const calculatePercentile = (values, percentile) => {
    if (!values || values.length === 0) return 0;
    
    const sorted = values.slice().sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;
    
    if (lower === upper) {
        return sorted[lower];
    }
    
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Calculate the average of an array of numbers
 * @param {Array} values - array of numbers
 * @returns {Number} average value
 */
const calculateAverage = (values) => {
    if (!values || values.length === 0) return 0;
    
    const sum = values.reduce((acc, val) => acc + parseFloat(val), 0);
    return sum / values.length;
}
