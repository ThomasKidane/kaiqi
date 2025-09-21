/**
 * Component Tagger Loader
 * A webpack loader for development tooling that tags React components
 */

module.exports = function(source) {
  // For now, just return the source unchanged
  // This loader can be extended later for component tagging functionality
  return source;
};
