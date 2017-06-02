"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const recursive = require("recursive-readdir");
const path = require("path");
const fs = require("graceful-fs");
const md5File = require("md5-file");
const co = require("co");
class FileSystemGateway {
    constructor(basePath) {
        this.basePath = basePath;
    }
    createDirectory(dirPath) {
        dirPath = this.formatAndBuildFullPath(dirPath);
        let parts = dirPath.split(path.sep);
        for (let i = 1; i <= parts.length; i++) {
            this.mkdirSync(path.join.apply(null, parts.slice(0, i)));
        }
        return Promise.resolve(true);
    }
    listFiles() {
        return new Promise((resolve, reject) => {
            recursive(this.basePath, (err, files) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(files.map(x => path.relative(this.basePath, x).replace(new RegExp('\\' + path.sep, 'g'), '/')));
                }
            });
        });
    }
    getFileReadStream(filePath) {
        filePath = this.formatAndBuildFullPath(filePath);
        return Promise.resolve(fs.createReadStream(filePath));
    }
    getFileComparator(filePath) {
        filePath = this.formatAndBuildFullPath(filePath);
        const result = md5File.sync(filePath);
        return Promise.resolve(result);
    }
    deleteFile(filePath) {
        filePath = this.formatAndBuildFullPath(filePath);
        fs.unlinkSync(filePath);
        return Promise.resolve(true);
    }
    deleteDirectory(dirPath) {
        dirPath = this.formatAndBuildFullPath(dirPath);
        fs.unlinkSync(dirPath);
        return Promise.resolve(true);
    }
    directoryExist(dirPath) {
        dirPath = this.formatAndBuildFullPath(dirPath);
        try {
            fs.statSync(dirPath);
            return Promise.resolve(true);
        }
        catch (e) {
            return Promise.resolve(false);
        }
    }
    fileExist(filePath) {
        filePath = this.formatAndBuildFullPath(filePath);
        try {
            fs.statSync(filePath);
            return Promise.resolve(true);
        }
        catch (e) {
            return Promise.resolve(false);
        }
    }
    upload(stream, destination) {
        const self = this;
        return co(function* () {
            const streamDest = yield self.getFileWriteStream(destination);
            yield new Promise((resolve, reject) => {
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
            return true;
        });
    }
    close() {
        return Promise.resolve(true);
    }
    getFileWriteStream(filePath) {
        filePath = this.formatAndBuildFullPath(filePath);
        return Promise.resolve(fs.createWriteStream(filePath));
    }
    mkdirSync(dirPath) {
        let result;
        try {
            fs.mkdirSync(dirPath);
            result = true;
        }
        catch (e) {
            result = false;
        }
        return result;
    }
    formatAndBuildFullPath(filePath) {
        filePath = path.join(this.basePath, filePath);
        filePath = filePath.replace(new RegExp('\\' + '/', 'g'), path.sep);
        return filePath;
    }
}
exports.FileSystemGateway = FileSystemGateway;
