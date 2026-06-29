const fs = require('fs');
const path = require('path');

module.exports = function inlineSvgSprite() {
  const spritePath = path.resolve(__dirname, '../../dist/img/sprite.svg');
  try {
    return fs.readFileSync(spritePath, 'utf8');
  } catch (err) {
    return '<!-- SVG sprite not found -->';
  }
};
