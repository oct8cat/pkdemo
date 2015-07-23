# pkdemo

## Requirements

* Node.js + NPM
* MongoDB
* Python2

## Installation

```
git clone http://github.com/oct8cat/pkdemo
cd pkdemo
make install
```

## Running

```
DEBUG=pkdemo:* ./bin/daemon.js
```

## Logs

* `vkapi.log` - VK API emulaiton log.

## Examples

### Simple message
```
curl --data template=hello! http://localhost:3000/send
```

### Name substitution
```
curl --data template=hello,%20%25name%25! http://localhost:3000/send
```


## Helpers

```
./bin/seed.js <N>
```
Populates `players` collection with *N* records.

```
make doc
```
Generates API docs in `doc` directory.
