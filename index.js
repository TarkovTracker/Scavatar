const Jimp = require('jimp')
const fsExtra = require('fs-extra')
const glob = require("glob")
const path = require('path')
const avatarConfig = require('./avatarConfig.js')
const cliProgress = require('cli-progress');

async function run() {
	const outputConfig = {}

	const colorBackgrounds = {}
	var readPromises = []
	var writePromises = []

	// Empty the dist directory for a new batch of writes
	fsExtra.emptyDirSync(avatarConfig.outputDir)

	// Loop through each background color and create a baseline
	outputConfig.backgroundColors = []
	avatarConfig.backgroundColors.forEach((color) => {
		const hexColor = color.toString(16).padStart(8, '0')
		colorBackgrounds[hexColor] = new Jimp(avatarConfig.size, avatarConfig.size, color)
		outputConfig.backgroundColors.push(hexColor)
	}, this)

	// Loop through each primary prop, and combine with the backgrounds
	outputConfig.primaryProps = []
	var primaryPropFiles = glob.sync(avatarConfig.props.primary)

	const totalPermutations = Object.keys(colorBackgrounds).length * primaryPropFiles.length
	console.log(`Generating ${ totalPermutations } Scavatars for ${Object.keys(colorBackgrounds).length} colors and ${primaryPropFiles.length} primary props`)
	const scavatarProgress = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
	scavatarProgress.start(totalPermutations, 0, {
    speed: "N/A"
	})

	primaryPropFiles.forEach((primaryProp) => {
		readPromises.push(Jimp.read(primaryProp).then((scavatarProp) => {
		  const propName = path.parse(primaryProp).name
		  scavatarProp
		    .resize(avatarConfig.size, Jimp.AUTO)
		    .pixelate(2)

		  Object.entries(colorBackgrounds).forEach(([colorString, colorCanvas]) => {
		  	writePromises.push(
		  		colorCanvas
		  			.clone() // Create a copy of the original canvas
		  			//.composite(scavatarProp, 0, avatarConfig.size - scavatarProp.bitmap.height)
			  		.composite(scavatarProp, 0, avatarConfig.size - scavatarProp.bitmap.height, { // Add the prop on, respecting the height
			  			mode: Jimp.BLEND_MULTIPLY,
			  			opacitySource: 0.5,
			  		})
			  		.gaussian( 5 ) // Add a blur
			  		.composite(scavatarProp, 0, avatarConfig.size - scavatarProp.bitmap.height, { // Add the prop on, respecting the height
			  			mode: Jimp.BLEND_EXCLUSION,
			  			opacitySource: 1,
			  		})
			  	)
		  			scavatarProgress.increment()
		  }, this)
		  outputConfig.primaryProps.push(propName)
		})
		.catch(console.error)
		)
	}, this)

	await Promise.all(readPromises)
	await Promise.all(writePromises)
	scavatarProgress.stop()
	console.log("Created images")
	


	fsExtra.writeFileSync('dist/scavatar.json', JSON.stringify(outputConfig, null, 4));
	console.log("Created scavatar.json")
}

run()