const sqlite3 = require('sqlite3').verbose()
const fs = require('fs')
const path = require('path')
const util = require('./util')
const { DOCSET_NAME } = require('./constants')
const glob = require('glob')

const dbFilePath = path.join(
  __dirname,
  '..',
  DOCSET_NAME,
  'Contents/Resources/docSet.dsidx'
)
try {
  fs.unlinkSync(dbFilePath)
} catch {}
const db = new sqlite3.Database(dbFilePath)

db.serialize(() => {
  db.run(
    'CREATE TABLE searchIndex(id INTEGER PRIMARY KEY, name TEXT, type TEXT, path TEXT)'
  )
  db.run('CREATE UNIQUE INDEX anchor ON searchIndex (name, type, path);')

  const stmt = db.prepare(
    'INSERT OR IGNORE INTO searchIndex(name, type, path) VALUES (?, ?, ?)'
  )
  const items = util.getDocFilenames().map(util.parseFileContents)
  items.filter(util.isGuide).forEach(item => {
    stmt.run(
      item.data.title,
      'Guide',
      item.filePath.replace('.md', '.html')
    )
  })
  items.filter(util.isModule).forEach(item => {
    stmt.run(
      item.data.title,
      'Module',
      item.filePath.replace('.md', '.html')
    )
  })
  items.filter(util.isTag).forEach(item => {
    stmt.run(
      item.data.title,
      'Tag',
      item.filePath.replace('.md', '.html')
    )
  })
  stmt.finalize()
})

db.close()
