const marked = require('marked')
const ejs = require('ejs')
const prism = require('prismjs')
const loadLanguages = require('prismjs/components/')
const fs = require('fs')
const path = require('path')
const grayMatter = require('gray-matter')
const util = require('./util')
const { DOCSET_NAME } = require('./constants')
const mkdirp = require('mkdirp')
const jsdom = require('jsdom')
const { JSDOM } = jsdom

loadLanguages([
  'bash',
  'json',
  'javascript',
  'jsx',
  'tsx',
  'typescript',
  'yaml'
])

const renderer = {
  heading(_text, level) {
    let type = 'Section'
    if (_text.startsWith('--')) {
      type = 'Option'
    }

    const text = new JSDOM(_text).window.document.documentElement.textContent
    const name = `//apple_ref/cpp/Section/${'›'.repeat(level - 1)}${
      level > 1 ? ' ' : ''
    }${text.replace('/', '∕').replace(/"(.+)"/, (_, p1) => {
      return `‟${p1}”`
    })}`

    return `
      <a name="${name}" class="dashAnchor">
        <h${level}>
          ${text}
        </h${level}>
      </a>
    `
  },
  link(_href, title, text) {
    // Modify like /docs/.../foo.md#bar into ../../docs/.../foo.html#bar
    const [hash] = _href.match(/#.+/) || ['']
    let href = `${_href.replace('.md', '').replace(hash, '')}.html${hash}`
    if (href.startsWith('/docs')) {
      href = path.join(
        href
          .slice(1)
          .split('/')
          .slice(1)
          .map(() => '..')
          .join('/'),
        href
      )
    }

    return `<a title="${title}" href="${href}">${text}</a>`
  }
}

marked.setOptions({
  highlight: function (code, _lang) {
    let lang = _lang
    if (lang === 'sh') {
      lang = 'bash'
    } else if (lang === 'text' && code.startsWith('pnpm')) {
      lang = 'bash'
    } else if (lang === 'text') {
      lang = 'none'
    }

    if (prism.languages[lang]) {
      return prism.highlight(
        code.replace(/&lt;/g, '<'),
        prism.languages[lang],
        lang
      )
    } else {
      return code
    }
  }
})

marked.use({ renderer })

const templateString = fs.readFileSync(
  path.join(__dirname, 'template.ejs'),
  'utf8'
)
const template = ejs.compile(templateString)

// guideNames.forEach((name) => {
//   const docPath = path.join(__dirname, '../docs', `${name}.md`)
//   const {
//     data: { title },
//     content
//   } = grayMatter(fs.readFileSync(docPath, 'utf8'))
//   const contents = marked.parse(content)
//   const outputPath = path.join(
//     __dirname,
//     `../pnpm.docset/Contents/Resources/Documents/${name}.html`
//   )
//   const html = template({ baseUrl: '.', title, html: contents })

//   fs.writeFileSync(outputPath, html)
// })
util
  .getDocFilenames()
  .map(util.parseFileContents)
  .map((item) => {
    item.content = item.content.replace(/{% link ([^\s]+) %}/g, (_, p1) => {
      return p1.replace('pages', '..')
    })
    item.content = marked(item.content)

    return item
  })
  .map(createDocPage)

function createDocPage(item) {
  // const docPath = path.join(__dirname, '../pages', dirname, `${fileBaseName}.md`)
  // const { content } = grayMatter(fs.readFileSync(docPath, 'utf8'))
  // const contents = marked.parse(content)
  const outputPath = path.join(
    __dirname,
    '..',
    DOCSET_NAME,
    'Contents/Resources/Documents',
    item.filePath.replace('.md', '.html')
  )

  const outputDir = path.dirname(outputPath)
  mkdirp.sync(outputDir)

  const html = template({
    baseUrl: item.filePath
      .split('/')
      .slice(1)
      .map(() => '..')
      .join('/'),
    title: item.data.title,
    html: item.content
  })

  fs.writeFileSync(outputPath, html)
}
