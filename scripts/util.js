const glob = require('glob')
const path = require('path')
const fs = require('fs')
const grayMatter = require('gray-matter')

const pagesDirpath = path.join(__dirname, '..', 'pages')

/**
 * @returns {string[]} - filenames
 */
exports.getDocFilenames = function getDocFilenames() {
  return glob.sync('**/*.md', { cwd: pagesDirpath, absolute: false })
}

/**
 * A file content parses with gray-matter
 *
 * @param {string} filename
 * @returns {filePath: string; {data: {title: string}; content: string}}
 */
exports.parseFileContents = function parseFileContents(filename) {
  const fileContents = fs.readFileSync(path.join(pagesDirpath, filename))
  return { ...grayMatter(fileContents), filePath: filename }
}

/**
 * Predicate for Guide
 *
 * @param {{filePath: string}} filenames
 * @param {boolean}
 */
exports.isGuide = function isGuide({ filePath }) {
  return (
    filePath.startsWith('contributing') ||
    filePath.startsWith('intro') ||
    filePath.startsWith('resources') ||
    filePath.startsWith('spec')
  )
}

/**
 * Predicate for Module
 *
 * @param {{filePath: string}} filename
 * @param {boolean}
 */
exports.isModule = function isModule({ filePath }) {
  return filePath.startsWith('packages')
}

/**
 * Predicate for Tag
 *
 * @param {{filePath: string}} filename
 * @param {boolean}
 */
exports.isTag = function isTag({ filePath }) {
  return filePath.startsWith('tags')
}
