"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pkgcloud = require("pkgcloud");
const co = require("co");
class RackspaceGateway {
    constructor(username, apiKey, region, containerName) {
        this.username = username;
        this.apiKey = apiKey;
        this.region = region;
        this.containerName = containerName;
        this.client = pkgcloud.storage.createClient({
            provider: 'rackspace',
            username: username,
            apiKey: apiKey,
            region: region
        });
    }
    // NOT SUPPORTED
    createDirectory(dirPath) {
        return Promise.resolve(true);
    }
    listFiles() {
        return new Promise((resolve, reject) => {
            this.client.getFiles(this.containerName, (err, files) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(files.filter(x => x.contentType != 'application/directory').map(x => x.name));
                }
            });
        });
    }
    getFileReadStream(filePath) {
        const stream = this.client.download({
            container: this.containerName,
            remote: filePath
        });
        return Promise.resolve(stream);
    }
    getFileComparator(filePath) {
        return new Promise((resolve, reject) => {
            this.client.getFile(this.containerName, filePath, (err, result) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(result.etag);
                }
            });
        });
    }
    deleteFile(filePath) {
        return new Promise((resolve, reject) => {
            this.client.removeFile(this.containerName, filePath, (err, result) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(true);
                }
            });
        });
    }
    deleteDirectory(dirPath) {
        return Promise.resolve(true);
    }
    directoryExist(dirPath) {
        return Promise.resolve(true);
    }
    fileExist(filePath) {
        return new Promise((resolve, reject) => {
            this.client.getFile(this.containerName, filePath, (err, result) => {
                if (err) {
                    resolve(false);
                }
                else {
                    resolve(true);
                }
            });
        });
    }
    upload(stream, destination) {
        const self = this;
        return co(function* () {
            const streamDest = yield self.getFileWriteStream(destination);
            return new Promise((resolve, reject) => {
                stream.on('error', (err) => {
                    reject(err);
                });
                streamDest.on('error', (err) => {
                    reject(err);
                });
                stream.on('finish', function () {
                });
                streamDest.on('finish', function () {
                    resolve(true);
                });
                stream.pipe(streamDest);
            });
        });
    }
    close() {
        return Promise.resolve(true);
    }
    getFileWriteStream(filePath) {
        const stream = this.client.upload({
            container: this.containerName,
            remote: filePath
        });
        return Promise.resolve(stream);
    }
    listFileObjects() {
        return new Promise((resolve, reject) => {
            this.client.getFiles(this.containerName, (err, files) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(files.filter(x => x.contentType != 'application/directory').map(x => {
                        return {
                            name: x.name,
                            md5: x.etag
                        };
                    }));
                }
            });
        });
    }
}
exports.RackspaceGateway = RackspaceGateway;
