const Jimp = require('jimp')
const avatarConfig = require('./avatarConfig.js')

const outputConfig = {}

const colorBackgrounds = {}
var writePromises = []

outputConfig.backgroundColors = []
avatarConfig.backgroundColors.forEach((color) => {
	const hexColor = color.toString(16).padStart(8, '0')
	colorBackgrounds[hexColor] = new Jimp(256, 256, color)
	outputConfig.backgroundColors.push(hexColor)
	writePromises.push(colorBackgrounds[hexColor].write(`dist/${hexColor}.png`))
}, this)

Promise.all(writePromises)
console.log("Created images")

var fs = require('fs')
fs.writeFileSync('dist/scavatar.json', JSON.stringify(outputConfig, null, 4));
console.log("Created scavatar.json")

function colorIterator(color) {
  return function (x, y, offset) {
    this.bitmap.data.writeUInt32BE(color, offset, true)
  }
};