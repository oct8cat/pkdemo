# pkdemo

## Requirements

* Node.js + NPM
* MongoDB
* Python2

## Installation

```
git clone http://bitbucket.org/oct8cat/pkdemo
cd pkdemo
make install
```

## Running

```
DEBUG=pkdemo:* ./bin/daemon
```

## Logs

* `vkapi.log` - VK API emulaiton log.

## Examples

### Simple message
```
curl --data template=hello! http://localhost:3000/send
```

### Name substition
```
curl --data template=hello,%20%25name%25! http://localhost:3000/send
```


## API Docs

```
make doc
```
Then see `docs` directory.
