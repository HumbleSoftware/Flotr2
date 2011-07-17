flotr2:
	smoosh build.json
	cat build/lib.js build/flotr2.js > flotr2.js
	cat build/lib.min.js build/flotr2.min.js > flotr2.min.js
	cp build/ie.min.js flotr2.ie.min.js
