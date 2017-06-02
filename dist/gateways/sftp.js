"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("graceful-fs");
const node_ssh = require("node-ssh");
const uuid = require("uuid");
const co = require("co");
class SFTPGateway {
    constructor(basePath, host, username, password) {
        this.basePath = basePath;
        this.host = host;
        this.username = username;
        this.password = password;
        this.connection = null;
        this.sftpRequest = null;
    }
    createDirectory(dirPath) {
        dirPath = this.buildFullPath(dirPath);
        const self = this;
        return co(function* () {
            const connection = yield self.getSSHConnection();
            const result = yield connection.execCommand(`mkdir -p ${dirPath}`);
            return result.code === 0;
        });
    }
    listFiles() {
        const self = this;
        return co(function* () {
            const connection = yield self.getSSHConnection();
            const result = yield connection.execCommand(`find ${self.basePath} -type f`);
            return result.code === 0 ? result.stdout.split('\n').map((x) => path.relative(self.basePath, x)) : null;
        });
    }
    getFileReadStream(filePath) {
        const id = uuid.v4();
        const self = this;
        return co(function* () {
            const connection = yield self.getSSHConnection();
            const sftpRequest = yield self.getSFTPRequest();
            yield connection.getFile(`./temp/${id}`, self.buildFullPath(filePath), sftpRequest);
            return fs.createReadStream(`./temp/${id}`);
        });
    }
    getFileComparator(filePath) {
        filePath = this.buildFullPath(filePath);
        const self = this;
        return co(function* () {
            const connection = yield self.getSSHConnection();
            const result = yield connection.execCommand(`md5sum ${filePath}`);
            return result.code === 0 ? result.stdout.split(' ')[0] : null;
        });
    }
    deleteFile(filePath) {
        filePath = this.buildFullPath(filePath);
        const self = this;
        return co(function* () {
            const connection = yield self.getSSHConnection();
            const result = yield connection.execCommand(`rm -f ${filePath}`);
            return result.code === 0;
        });
    }
    deleteDirectory(dirPath) {
        dirPath = this.buildFullPath(dirPath);
        const self = this;
        return co(function* () {
            const connection = yield self.getSSHConnection();
            const result = yield connection.execCommand(`rm -R ${dirPath}`);
            return result.code === 0;
        });
    }
    directoryExist(dirPath) {
        dirPath = this.buildFullPath(dirPath);
        const self = this;
        return co(function* () {
            const connection = yield self.getSSHConnection();
            const result = yield connection.execCommand(`test -e ${dirPath}`);
            return result.code === 0;
        });
    }
    fileExist(filePath) {
        filePath = this.buildFullPath(filePath);
        const self = this;
        return co(function* () {
            const connection = yield self.getSSHConnection();
            const result = yield connection.execCommand(`test -e ${filePath}`);
            return result.code === 0;
        });
    }
    upload(stream, destination) {
        const id = uuid.v4();
        return new Promise((resolve, reject) => {
            const tempStream = fs.createWriteStream(`./temp/${id}`);
            stream.on('error', (err) => {
                reject(err);
            });
            tempStream.on('error', (err) => {
                reject(err);
            });
            stream.on('finish', function () {
            });
            tempStream.on('finish', function () {
                resolve(true);
            });
            stream.pipe(tempStream);
        }).then(() => {
            const self = this;
            return co(function* () {
                const connection = yield self.getSSHConnection();
                const sftpRequest = yield self.getSFTPRequest();
                yield connection.putFile(`./temp/${id}`, self.buildFullPath(destination), sftpRequest);
                return true;
            });
        });
    }
    close() {
        this.connection.dispose();
        return Promise.resolve(true);
    }
    getSSHConnection() {
        if (this.connection !== null) {
            return Promise.resolve(this.connection);
        }
        this.connection = new node_ssh();
        return this.connection.connect({
            host: this.host,
            username: this.username,
            password: this.password,
        }).then(() => {
            return this.connection;
        });
    }
    getSFTPRequest() {
        if (this.sftpRequest !== null) {
            return Promise.resolve(this.sftpRequest);
        }
        const self = this;
        return co(function* () {
            const connection = yield self.getSSHConnection();
            self.sftpRequest = yield connection.requestSFTP();
            return self.sftpRequest;
        });
    }
    buildFullPath(filePath) {
        filePath = path.join(this.basePath, filePath);
        filePath = filePath.replace(new RegExp('\\' + path.sep, 'g'), '/');
        return filePath;
    }
}
exports.SFTPGateway = SFTPGateway;
