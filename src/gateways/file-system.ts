import * as recursive from 'recursive-readdir';
import * as path from 'path';
import * as fs from 'graceful-fs';
import * as md5File from 'md5-file';
import * as co from 'co';
import { IGateway } from './gateway';

export class FileSystemGateway implements IGateway {

    constructor(private basePath: string) {

    }

    public createDirectory(dirPath): Promise<boolean> {
        dirPath = this.formatAndBuildFullPath(dirPath);

        let parts = dirPath.split(path.sep);
        for (let i = 1; i <= parts.length; i++) {
            this.mkdirSync(path.join.apply(null, parts.slice(0, i)));
        }

        return Promise.resolve(true);
    }

    public listFiles(): Promise<string[]> {
        return new Promise((resolve, reject) => {
            recursive(this.basePath, (err: Error, files: string[]) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(files.map(x => path.relative(this.basePath, x).replace(new RegExp('\\' + path.sep, 'g'), '/')));
                }
            });
        });
    }

    public getFileReadStream(filePath: string): Promise<any> {
        filePath = this.formatAndBuildFullPath(filePath);
        return Promise.resolve(fs.createReadStream(filePath));
    }

    public getFileComparator(filePath: string): Promise<string> {
        filePath = this.formatAndBuildFullPath(filePath);

        const result = (<any>md5File).sync(filePath);

        return Promise.resolve(result);
    }

    public deleteFile(filePath: string): Promise<boolean> {
        filePath = this.formatAndBuildFullPath(filePath);
        fs.unlinkSync(filePath);

        return Promise.resolve(true);
    }

    public deleteDirectory(dirPath: string): Promise<boolean> {
        dirPath = this.formatAndBuildFullPath(dirPath);
        fs.unlinkSync(dirPath);

        return Promise.resolve(true);
    }

    public directoryExist(dirPath: string): Promise<boolean> {
        dirPath = this.formatAndBuildFullPath(dirPath);

        try {
            fs.statSync(dirPath);
            return Promise.resolve(true);
        } catch (e) {
            return Promise.resolve(false);
        }
    }

    public fileExist(filePath: string): Promise<boolean> {
        filePath = this.formatAndBuildFullPath(filePath);

        try {
            fs.statSync(filePath);
            return Promise.resolve(true);
        } catch (e) {
            return Promise.resolve(false);
        }
    }

    public upload(stream: fs.ReadStream, destination: string): Promise<boolean> {
        const self = this;
        return co(function* () {

            const streamDest = yield self.getFileWriteStream(destination);

            yield new Promise((resolve, reject) => {
                stream.on('error', (err: Error) => {
                    reject(err);
                });

                streamDest.on('error', (err: Error) => {
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

    public close(): Promise<boolean> {
        return Promise.resolve(true);
    }

    private getFileWriteStream(filePath: string): Promise<any> {
        filePath = this.formatAndBuildFullPath(filePath);
        return Promise.resolve(fs.createWriteStream(filePath));
    }

    private mkdirSync(dirPath): boolean {
        let result: boolean;

        try {
            fs.mkdirSync(dirPath);
            result = true;
        } catch (e) {
            result = false;
        }

        return result;
    }

    private formatAndBuildFullPath(filePath: string): string {
        filePath = path.join(this.basePath, filePath);
        filePath = filePath.replace(new RegExp('\\' + '/', 'g'), path.sep);

        return filePath;
    }
}