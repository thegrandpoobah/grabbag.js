var fs = require('fs'),
	sys = require('util'),
	uglify = require('uglify-js');

function makeDirectoryIfNotExists(path) {
	try {
		var stats = fs.statSync(path);
		if (!stats.isDirectory()) {
			fs.mkdirSync(path, 0);
		}
	} catch (e) {
		fs.mkdirSync(path, 0);
	}
}

function concatenate(files, outputFile, withPreamble) {
	var output = '',
		license = fs.readFileSync('src/license.tmpl').toString(),
		template = fs.readFileSync('src/result.tmpl').toString();

	var all = '';
	files.forEach(function(file, i) {
		all += fs.readFileSync('src/' + file).toString();
		all += '\n';
	});

	if (withPreamble) {
		output += license;
		output += template.replace('{{CONTENT}}', all);
	} else {
		output = all;
	}

	makeDirectoryIfNotExists('output');
	
	fs.openSync('output/' + outputFile, 'w+');
	
	var out = fs.openSync('output/' + outputFile, 'w+');
	fs.writeSync(out, output);
}

desc('Concatenation');
task('concatenate', function(params) {
	concatenate([
		'ancestorscroll.js'
		, 'events-capture.js'
		, 'string-measurement.js'
		, 'z-manager.js'
	], 'grabbag.js', true);
});

desc('Obfuscation and Compression');
task({'minify': ['concatenate']}, function(params) {
	function minify(inputFile, outputFile) {
		try {
			var all = fs.readFileSync('output/' + inputFile).toString(),
				out = fs.openSync('output/' + outputFile, 'w+'),
				ast = uglify.parser.parse(all);

			ast = uglify.uglify.ast_mangle(ast);
			ast = uglify.uglify.ast_squeeze(ast);

			fs.writeSync(out, uglify.uglify.gen_code(ast));
		} catch(e) {
			console.error(e);
		}
	}

	minify('grabbag.js', 'grabbag.min.js');
});