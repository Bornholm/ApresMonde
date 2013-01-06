var csv = require('csv'),
	fs = require('fs');

var skills = {},
	skillsFr = {};

function capitalize(str) {
	return str.charAt(0).toUpperCase()+str.slice(1);
}

csv()
	.from('skills.csv')
	.transform(function(data, index) {
		if(index !== 0) {
			var cat = skills[data[0].toLowerCase()] = skills[data[0].toLowerCase()] || [];
			cat.push({
				name: data[1].toLowerCase(),
				base: data[2]
			})
		}
	})
	.on('end', function() {
		fs.writeFile('skills.json', JSON.stringify(skills, null, '\t'));
	})

csv()
	.from('skills-fr.csv')
	.transform(function(data, index) {
		if(index !== 0) {
			skillsFr[data[0].toLowerCase()] = capitalize(data[1]);
		}
	})
	.on('end', function() {
		fs.writeFile('skills-fr.json', JSON.stringify(skillsFr, null, '\t'));
	})

