all: test flotr2
test:
	jasmine-headless-webkit -j spec/jasmine.yml -c
flotr2:
	smoosh make/build.json
	cat build/lib.js build/flotr2.js > flotr2.js
	cat build/lib.min.js > flotr2.min.js
	echo ';' >> flotr2.min.js
	cat build/flotr2.min.js >> flotr2.min.js
	cp build/ie.min.js flotr2.ie.min.js
	cp build/examples.min.js flotr2.examples.min.js
	cp build/examples-types.js flotr2.examples.types.js
