const gulp = require("gulp");
const glob = require('glob');
const nunjucksRender = require("gulp-nunjucks-render");
const data = require("gulp-data");
const posthtml = require("gulp-posthtml");
const posthtmlBem = require("posthtml-bem");
const stylus = require("gulp-stylus");
const postcss = require('gulp-postcss');
const autoprefixer = require("autoprefixer");
const sortMQ = require("postcss-sort-media-queries");
const svgSprite = require("gulp-svg-sprite");
const svgmin = require('gulp-svgmin');
const plumber = require("gulp-plumber");
const del = require("del");
const concat = require("gulp-concat");
const browserSync = require("browser-sync").create();
const icons = require('./template/helpers/icons.js');
const fs = require('fs');
const path = require('path');
const cheerio = require('gulp-cheerio');
const fm = require('front-matter');
const siteData = require('./template/site-data.js');
const sizeOf = require('image-size');
const uglify = require("gulp-uglify");     // для минификации JS
const cleanCSS = require("gulp-clean-css"); // для минификации CSS
const formatHtml = require('gulp-format-html').default;
const discardComments = require('postcss-discard-comments');
const discardDuplicates = require('postcss-discard-duplicates');

// Подключаем новый JS-плагин для жидкого адаптива
const layoutFucker = require('./template/helpers/postcss-layout-fucker');

// Пути
const paths = {
  pages: "template/pages/**/*.html",
  blocks: "template/blocks/**/*.html",
  styles: "template/styles/**/*.styl",
  blockStyles: "template/blocks/**/*.styl",
  scripts: "template/js/**/*.js",
  svg: "template/svg-for-sprite/**/*.svg",
  static: "template/static/**/*",
  dist: "dist/",
  createBlock: "template/.create-block"
};

// --- Marmelad-style сортировка атрибутов ---
function classFirstAttrsPlugin() {
  const order = [
    'id', 'class', 'name',
    'loading', 'alt', 'title',
    'data-.+', 'aria-.+',
    '$unknown$'
  ];

  return tree => {
    tree.match({ attrs: /./ }, node => {
      if (!node.attrs) return node;

      const attrs = { ...node.attrs };
      const sorted = {};

      // Всегда первым class
      if (attrs.class) {
        sorted.class = attrs.class;
        delete attrs.class;
      }

      // Остальные по Marmelad
      function findAttrs(pattern) {
        if (pattern === '$unknown$') return Object.keys(attrs);
        const regex = new RegExp(`^${pattern}$`);
        return Object.keys(attrs).filter(a => regex.test(a));
      }

      order.forEach(pattern => {
        const keys = findAttrs(pattern);
        keys.forEach(k => {
          sorted[k] = attrs[k];
          delete attrs[k];
        });
      });

      node.attrs = sorted;
      return node;
    });
  };
}

// Очистка dist
function clean() { return del([paths.dist]); }

// --- Создание и минификация SVG спрайта ---
function sprite() {
  const svgmin = require('gulp-svgmin');

  return gulp.src(paths.svg)
    .pipe(plumber())
    .pipe(svgmin({
      plugins: [
        {
          name: 'preset-default',
          params: {
            overrides: {
              removeDoctype: true,
              removeComments: true,
              removeMetadata: true,
              removeXMLProcInst: true,
              removeDimensions: true,
              cleanupIDs: true,
              collapseGroups: true,
              convertPathData: true,
              removeAttrs: { attrs: '(fill|stroke|style)' }
            }
          }
        }
      ]
    }))
    .pipe(svgSprite({
      mode: {
        symbol: {
          sprite: "../sprite.svg"
        }
      }
    }))
    .pipe(cheerio({
      run: ($) => { $('[fill]').removeAttr('fill'); },
      parserOptions: { xmlMode: true }
    }))
    .pipe(gulp.dest(paths.dist + "img"));
}

// Inline SVG спрайт
function inlineSvgSprite() {
  const spritePath = path.resolve(paths.dist, "img/sprite.svg");
  try {
    let content = fs.readFileSync(spritePath, "utf8");
    content = content.replace(/<svg([^>]*)>/, '<svg$1 class="inline-svg-sprite">');
    return content;
  } catch { return ''; }
}

// Inline SVG
function inline(fileName) {
  if (!fileName) return '';
  const fullPath = path.join(__dirname, 'template/static', fileName);
  try {
    return fs.readFileSync(fullPath, 'utf8');
  } catch (err) {
    console.warn(`⚠️ SVG файл не найден: ${fullPath}`);
    return '';
  }
}

// Получение данных страницы
function getPageData(file) {
  try {
    const content = fs.readFileSync(file.path, 'utf8');
    const parsed = fm(content);
    return parsed.attributes || {};
  } catch { return {}; }
}

// Добавление размеров для <img>
function addImgSizePlugin() {
  const staticRoot = path.resolve(__dirname, 'template/static');
  return tree => {
    tree.match({ tag: 'img' }, node => {
      if (!node.attrs?.src) return node;

      // Если размеры уже заданы вручную, пропускаем
      if (node.attrs.width && node.attrs.height) return node;

      const src = node.attrs.src;
      if (/^(https?:)?\/\//.test(src)) return node; // пропускаем внешние ссылки

      const cleanSrc = src.split('?')[0].replace(/^\/+/, '');
      const imgPath = path.join(staticRoot, cleanSrc);

      if (fs.existsSync(imgPath)) {
        try {
          const dim = sizeOf(imgPath);
          if (!node.attrs.width && dim?.width) node.attrs.width = String(dim.width);
          if (!node.attrs.height && dim?.height) node.attrs.height = String(dim.height);
        } catch (e) {
          console.warn(`⚠️ ${imgPath} ${e.message}`);
        }
      }

      return node;
    });
  };
}

function sortImgAttrs() {
  return (tree) => {
    const walk = (nodes) => {
      nodes.forEach(node => {
        if (node.tag === 'img' && node.attrs) {
          const { class: cls, loading, width, height, src, alt, ...rest } = node.attrs;
          const dataAttrs = {};
          const otherAttrs = {};

          Object.keys(rest).forEach(key => {
            if (key.startsWith('data-')) dataAttrs[key] = rest[key];
            else otherAttrs[key] = rest[key];
          });

          node.attrs = {};
          if (cls) node.attrs.class = cls;
          if (loading) node.attrs.loading = loading;
          if (width) node.attrs.width = width;
          if (height) node.attrs.height = height;
          if (src) node.attrs.src = src;
          Object.assign(node.attrs, dataAttrs, otherAttrs);
          if (alt !== undefined) node.attrs.alt = alt;
        }

        if (node.content && Array.isArray(node.content)) walk(node.content);
      });
    };
    walk(tree);
    return tree;
  };
}

function sortAttrsMarmelad(order = null) {
  const defaultOrder = [
    'class', 'loading', 'href', 'src', 'id', 'name',
    'for', 'type',
    'values', 'title',
    'role', 'aria-.+',
    'data-.+', 'ng-.+',
    '$unknown$', 'alt'
  ];

  const sortOrder = order || defaultOrder;

  return tree => {
    const walk = nodes => {
      nodes.forEach(node => {
        if (node.attrs) {
          const attrs = { ...node.attrs };
          const sorted = {};

          const getKeys = pattern => {
            if (pattern === '$unknown$') return Object.keys(attrs);
            const regex = new RegExp(`^${pattern}$`);
            return Object.keys(attrs).filter(a => regex.test(a));
          };

          sortOrder.forEach(pat => {
            getKeys(pat).forEach(key => {
              sorted[key] = attrs[key];
              delete attrs[key];
            });
          });

          node.attrs = sorted;
        }

        if (node.content && Array.isArray(node.content)) walk(node.content);
      });
    };

    walk(tree);
    return tree;
  };
}

function html() {
  const nunjucksRender = require("gulp-nunjucks-render");
  const nunjucks = require("nunjucks");

  return gulp.src(paths.pages)
    .pipe(plumber())
    .pipe(data(file => {
      const pageData = getPageData(file);
      const blocksData = {};

      const blocksDir = path.join(__dirname, 'template/blocks');
      if (fs.existsSync(blocksDir)) {
        fs.readdirSync(blocksDir).forEach(block => {
          const jsonFile = path.join(blocksDir, block, `${block}.json`);
          if (fs.existsSync(jsonFile)) {
            try {
              const raw = fs.readFileSync(jsonFile, 'utf8');
              const cleaned = raw.replace(/,\s*(\]|\})/g, '$1');
              const content = JSON.parse(cleaned);

              Object.assign(pageData, content);
              blocksData[block] = content;

            } catch (err) {
              console.warn(`⚠️ JSON Error в блоке ${block}: ${err.message}`);
            }
          }
        });
      }

      return { ...pageData, page: pageData, ...blocksData };
    }))
    .pipe(nunjucksRender({
      path: ["template/", "template/blocks/"],
      manageEnv: env => {
        env.addGlobal('_icon', icons);
        env.addGlobal('inlineSvgSprite', inlineSvgSprite);
        env.addGlobal('site', siteData);
        env.addGlobal('_fns', { inline });
        env.opts.autoescape = false;

        env.addExtension('IncludeWithContext', new function() {
          this.tags = ['includeCtx'];
          this.parse = function(parser, nodes) {
            const tok = parser.nextToken();
            const args = parser.parseSignature(null, true);
            parser.advanceAfterBlockEnd(tok.value);
            const body = parser.parseUntilBlocks('endincludeCtx');
            parser.advanceAfterBlockEnd();
            return new nodes.CallExtension(this, 'run', args, [body]);
          };
          this.run = function(context, file, body) {
            if (!file) return "";
            try {
              const src = env.getTemplate(file, true);
              return new nunjucks.runtime.SafeString(src.render(context.ctx));
            } catch (e) {
              return "";
            }
          };
        });
      }
    }))
    .pipe(posthtml([
      addImgSizePlugin(),
      posthtmlBem({ shortElem: true, elemPrefix: "__", modPrefix: "--" }),
      sortAttrsMarmelad(),
      sortImgAttrs()
    ]))
    .pipe(formatHtml({
      indent_size: 2,
      end_with_newline: true,
      preserve_newlines: false,
      max_preserve_newlines: 1,
    }))
    .pipe(gulp.dest(paths.dist))
    .pipe(browserSync.stream());
}

// CSS таск
function css() {
    // Конфиг брейкпоинтов для жидких вычислений
    const fluidConfig = {
      mobileMin: 200,
      mobileDesign: 375,
      mobileMax: 1200,
      desktopMin: 1200,
      desktopMax: 1920
    };

    return gulp.src("template/styles/main.styl")
        .pipe(plumber())
        .pipe(stylus({
            compress: false
        }))
        .pipe(postcss([
            // Плагин встает ПЕРВЫМ, перехватывает строки lf() и рассчитывает clamp()
            layoutFucker(),
            autoprefixer(),
            sortMQ(),
            discardComments({
                removeAll: true
            }),
            discardDuplicates()
        ]))
        .pipe(concat("main.css"))
        .pipe(gulp.dest(paths.dist + "css"))
        .pipe(browserSync.stream());
}

// JS таск
function js() {
  const mainJs = 'template/js/app.js';

  const blockJsFiles = glob.sync('template/blocks/**/*.js')
    .filter(file => {
      const content = fs.readFileSync(file, 'utf8').trim();
      if (!content) return false;

      const withoutComments = content
        .replace(/\/\/.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .trim();

      return withoutComments.length > 0;
    });

  return gulp.src([mainJs, ...blockJsFiles])
    .pipe(plumber())
    .pipe(concat('app.js'))
    .pipe(gulp.dest(paths.dist + 'js'))
    .pipe(browserSync.stream());
}

// --- Plugins JS ---
function pluginsJs() {
  return gulp.src("template/js/plugins/**/*.js")
    .pipe(plumber())
    .pipe(concat("plugins.min.js"))
    .pipe(uglify())
    .pipe(gulp.dest(paths.dist + "js/plugins"))
    .pipe(browserSync.stream());
}

// --- Plugins CSS ---
function pluginsCss() {
  return gulp.src("template/js/plugins/**/*.css")
    .pipe(plumber())
    .pipe(concat("plugins.min.css"))
    .pipe(cleanCSS())
    .pipe(gulp.dest(paths.dist + "css"))
    .pipe(browserSync.stream());
}

// --- Vendors ---
function vendors() {
  return gulp.src("template/js/vendors/**/*", { base: "template/js/vendors" })
    .pipe(gulp.dest(paths.dist + "js/vendors"))
    .pipe(browserSync.stream());
}

// --- НОВЫЙ ТАСК: Копирование любых других папок из template/js/ ---
function copyJsFolders() {
  return gulp.src([
    "template/js/*/**/*",
    "!template/js/plugins/**/*",
    "!template/js/vendors/**/*"
  ], { base: "template/js" })
    .pipe(gulp.dest(paths.dist + "js"))
    .pipe(browserSync.stream());
}

// Статика
function staticFiles() {
  return gulp.src(paths.static, { base: "template/static" })
    .pipe(gulp.dest(paths.dist))
    .pipe(browserSync.stream());
}

// Watcher для создания блоков
function createBlockWatcher() {
  gulp.watch(paths.createBlock).on("change", () => {
    let content = fs.readFileSync(paths.createBlock, "utf8");

    content = content
      .split("\n")
      .map(line => line.trim())
      .filter(line => line && !line.startsWith("#") && !line.startsWith("//"))
      .join("\n");

    if (!content) return;

    const match = content.match(/cb\s+(\S+)(?:\s+-t\s+([\w,]+))?/);
    if (!match) return;

    const blockName = match[1];
    const extensions = match[2] ? match[2].split(",") : ["html", "styl", "js", "json"];
    const dirPath = path.join(__dirname, "template/blocks", blockName);

    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

    extensions.forEach(ext => {
      const filePath = path.join(dirPath, `${blockName}.${ext}`);
      if (!fs.existsSync(filePath)) {
        let fileContent =
          ext === "html"
            ? `<!-- start ${blockName} -->\n<div block="${blockName}"></div>\n<!-- end ${blockName} -->\n`
            : ext === "styl"
            ? `.${blockName} {}\n`
            : ext === "js"
            ? `// ${blockName}.js\n`
            : `{}\n`;

        fs.writeFileSync(filePath, fileContent);
        console.log(`✅ ${filePath}`);
      }
    });
  });
}

// BrowserSync
function reload(done) { browserSync.reload(); done(); }

// Генерация index.html
function indexPage(done) {
  const pagesDir = path.join(__dirname, 'template/pages');

  const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html') && !f.startsWith('_'));

  const list = files.map(file => {
    const filePath = path.join(pagesDir, file);
    const parsed = fm(fs.readFileSync(filePath, 'utf8'));
    const pageTitle = parsed.attributes.pageTitle || file;
    const stats = fs.statSync(filePath);

    return {
      file,
      url: file.replace(/\.html$/, ".html"),
      title: pageTitle,
      lastModified: stats.mtime.toLocaleDateString("ru-RU", {
        year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit"
      })
    };
  });

const htmlContent = `
<head>
  <meta charset="UTF-8">
  <title>Список страниц</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {margin: 0; font-family: Arial; font-size: 16px; color: #555; } h3{margin-bottom: 40px; font-size: 24px; } .container{padding: 20px 40px; margin: 40px auto; max-width:960px; background-color: #f9f9f9; } /* links */ a {text-decoration: none; color: #FF69B4; } a:hover {border-bottom: 1px solid; } a.done {color: #008000; pointer-events: all; } a.progress {color: #08B405 !important; border-bottom: 1px dashed #08B405; text-decoration: none !important; } /* lists */ ol {-webkit-column-count: 3; -moz-column-count: 3; -column-count: 3; counter-reset: heading; padding: 0; margin-left: -25px } li {font-size: 16px; margin-bottom: 8px; list-style: none; page-break-inside:avoid; } li:before {counter-increment: heading; content: counter(heading) "."; font-size: 14px; color: #aaa; display: inline-block; width: 25px; margin-right: 5px; text-align: right; } li.deprecated {opacity: 0.4; text-decoration: line-through; } li.deprecated a{color: #708d7e; } li.deprecated:before{color: #708d7e; } .legend {position: absolute; top: 20px; right: 20px; } .legend p{margin: 0 0 15px; } .author{display: inline-block; margin: 0; } /* Media */ @media only screen and (max-width: 1023px){ol {-webkit-column-count: 3; -moz-column-count: 3; -column-count: 3; } } @media only screen and (max-width: 767px){ol {-webkit-column-count: 2; -moz-column-count: 2; -column-count: 2; } } @media only screen and (max-width: 575px) {.container{margin: 20px  auto; } ol {-webkit-column-count: 1; -moz-column-count: 1; -column-count: 1; } } a.done--green {color: #228B22;} a.done--green:hover, a.done--green:visited {color: #3CB371 !important;}
  </style>
</head>
<body>
  <!--
  <div class="legend">
    Верстка:
    <br>
    <span class="author" style="color: #008000;">Владислав</span>
  </div>
  -->
  <div class="container">
    <h3>Список страниц "${siteData.app.name}"</h3>
    <ol>
      ${list.map(p => `
        <li>
          <a href="${p.url}" class="page-link done" target="_blank">${p.title}</a>
        </li>
      `).join('')}
    </ol>
  </div>
</body>
</html>
`;
fs.writeFileSync(path.join(paths.dist, 'index.html'), htmlContent, 'utf8');
done();
}

// Watcher
function watch() {
  browserSync.init({ server: { baseDir: paths.dist } });
  gulp.watch([ "template/pages/**/*.html","template/blocks/**/*.html","template/blocks/**/*.json","template/layout.html" ], gulp.series(html,indexPage));
  gulp.watch([paths.styles, paths.blockStyles], css);
  gulp.watch(["template/js/**/*.js", "template/blocks/**/*.js"], js);
  gulp.watch("template/js/plugins/**/*.js", pluginsJs);
  gulp.watch("template/js/plugins/**/*.css", pluginsCss);
  gulp.watch("template/js/vendors/**/*", vendors);

  // --- ОБНОВЛЕНО: Отслеживаем кастомные папки плагинов ---
  gulp.watch([
    "template/js/*/**/*",
    "!template/js/plugins/**/*",
    "!template/js/vendors/**/*"
  ], copyJsFolders);

  gulp.watch(paths.svg, gulp.series(sprite, html, reload));
  gulp.watch(paths.static, staticFiles);
  createBlockWatcher();
}

// --- ОБНОВЛЕНО: Добавлен copyJsFolders в build ---
const build = gulp.series(clean, sprite, gulp.parallel(html, css, js, staticFiles, pluginsJs, pluginsCss, vendors, copyJsFolders), indexPage);

exports.clean = clean;
exports.html = html;
exports.css = css;
exports.js = js;
exports.sprite = sprite;
exports.static = staticFiles;
exports.index = indexPage;
exports.copyJsFolders = copyJsFolders; // Экспорт нового таска
exports.build = build;
exports.default = gulp.series(build, watch);
