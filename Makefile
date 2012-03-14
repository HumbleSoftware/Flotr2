all: test flotr2

test:
	cd spec; jasmine-headless-webkit -j jasmine.yml -c

libraries:
	cat ./lib/bean.js > build/lib.js
	cat ./lib/underscore.js >> build/lib.js
	cat ./lib/bean-min.js > build/lib.min.js
	echo ";" >> build/lib.min.js
	cat ./lib/underscore-min.js >> build/lib.min.js

ie:
	smoosh make/ie.json

flotr2: libraries ie
	smoosh make/flotr2.json
	cat build/lib.js build/flotr2.js > flotr2.js
	cat build/lib.min.js > flotr2.min.js
	cat build/flotr2.min.js >> flotr2.min.js
	cp build/ie.min.js flotr2.ie.min.js

flotr2-basic: libraries ie
	smoosh make/basic.json
	cat build/lib.min.js > flotr2-basic.min.js
	cat build/flotr2-basic.min.js >> flotr2-basic.min.js

flotr-examples:
	smoosh make/examples.json
	cp build/examples.min.js flotr2.examples.min.js
	cp build/examples-types.js flotr2.examples.types.js

