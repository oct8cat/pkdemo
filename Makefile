bin = bin
doc = doc
index.js = index.js
lib = lib
node_modules = node_modules
vkapi.log = vkapi.log

jsdoc = $(node_modules)/.bin/jsdoc
jshint = $(node_modules)/.bin/jshint

python = $(shell which python2)
npm = $(shell which npm)

all: lint

clean:
	rm -rf $(doc) $(vkapi.log)

$(doc):
	$(jsdoc) -r -d $@ $(bin) $(lib) $(index.js)

lint:
	$(jshint) $(bin) $(lib) $(index.js)

install:
	$(npm) --python=$(python) i

uninstall:
	rm -rf $(node_modules)

.PHONY: all clean $(doc) lint install uninstall
