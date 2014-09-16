# com.timocom.aurora.node.worker

The AURORA API Worker.
Please report bugs there [on JIRA](http://jira.timocom.net/browse/AUR#selectedTab=com.atlassian.jira.plugin.system.project%3Aissues-panel).

## Install
You can do it manually as described bellow or use the [com.timocom.node.adminitration](http://stash.timocom.net/projects/AUR/repos/com.timocom.node.adminitration/browse) script library calling:
```sh
node_deploy com.timocom.aurora.node.api
```

### Clone Repository
Clone the repository to your Node.js Root Directory
```sh
# Install zeromq
wget http://download.zeromq.org/zeromq-3.2.4.tar.gz
tar -xfz zeromq-3.2.4.tar.gz
cd zeromq-3.2.4
./configure --with-pgm --without-documentation
make install

# Create directory for ZMQ IPC
# http://api.zeromq.org/3-2:zmq-ipc
mkdir /opt/nodejs/ipc
chown nodejs:nodejs /opt/nodejs/ipc


# Clone repository
git clone http://stash.timocom.net/scm/aur/com.timocom.aurora.node.worker.git
```

### Install dependencies
```sh
cd com.timocom.aurora.node.worker

# without DEV dependencies
npm install --production
# with DEV dependencies
# npm install

bower install
```


## Start API Server

### Test Run

```sh
node lib/com.timocom.aurora.node.worker.js
```

### Run as Deamon
Use [forever](https://github.com/nodejitsu/forever) to deamonise your server:
```sh
# Install forever package
sudo npm install forever -g

# Run server instance
forever start lib/com.timocom.aurora.node.worker.js
```


## Usage

### Hello World Service
The API has a mandatory version number in the URL path:

```html
http://localhost:3000/aurora/api/v0.1/helloworld
```
shoud return
```html
{"message":"Hello World v0.0.1!"}
```

### Hello World Service Version selection
You can optionaly request an other version of the service.
The default is

```html
http://localhost:3000/aurora/api/v0.1/helloworld/v0.0.2
```
shoud return
```html
{"message":"Hello World v0.0.2!"}
```

## API Structure
The API is structured using files on the filesystem:

```
 API ROOT     api_lib/
 API Vesion        |_ vX.Y/
 Service Nane           |_ service[/subservice]{0,*}
 Service Version              |_ vX.Y.Z/
 Service HTTP Method          |      |_ HTTP_METHOD.js
 Service LIB for processing   |      |_ [lib/]
 Service Information          |_ service_config.js
```
