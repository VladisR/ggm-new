const nunjucks = require('nunjucks');

module.exports = function(name, options = {}) {
  const tag = options.tag || 'span';
  const mod = `svg-icon--${name}`;
  const html = `
<${tag} block="svg-icon ${mod}" aria-hidden="true">
  <svg class="svg-icon__link">
    <use xlink:href="#${name}"></use>
  </svg>
</${tag}>
  `;
  return new nunjucks.runtime.SafeString(html);
};
