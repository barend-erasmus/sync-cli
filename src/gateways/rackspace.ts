import * as path from 'path';
import * as pkgcloud from 'pkgcloud';
import * as fs from 'graceful-fs';
import * as co from 'co';

import { IGateway } from './gateway';

export class RackspaceGateway implements IGateway {

    private client: any;

    constructor(private username: string, private apiKey: string, private region: string, private containerName: string) {
        this.client = pkgcloud.storage.createClient({
            provider: 'rackspace',
            username: username,
            apiKey: apiKey,
            region: region
        });
    }

    // NOT SUPPORTED
    public createDirectory(dirPath): Promise<boolean> {
        return Promise.resolve(true);
    }

    public listFiles(): Promise<string[]> {
        return new Promise((resolve, reject) => {
            this.client.getFiles(this.containerName, (err: Error, files: any[]) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(files.filter(x => x.contentType != 'application/directory').map(x => x.name));
                }
            });
        });
    }

    public getFileReadStream(filePath: string): Promise<any> {
        const stream = this.client.download({
            container: this.containerName,
            remote: filePath
        });

        return Promise.resolve(stream);
    }

    public getFileComparator(filePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            this.client.getFile(this.containerName, filePath, (err: Error, result: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result.etag);
                }
            });
        });
    }

    public deleteFile(filePath: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.client.removeFile(this.containerName, filePath, (err: Error, result: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(true);
                }
            });
        });
    }

    public deleteDirectory(dirPath: string): Promise<boolean> {
        return Promise.resolve(true);
    }

    public directoryExist(dirPath: string): Promise<boolean> {
        return Promise.resolve(true);
    }

    public fileExist(filePath: string): Promise<Boolean> {
        return new Promise((resolve, reject) => {
            this.client.getFile(this.containerName, filePath, (err: Error, result: any) => {
                if (err) {
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        });
    }

    public upload(stream: fs.ReadStream, destination: string): Promise<boolean> {
        const self = this;
        return co(function* () {

            const streamDest = yield self.getFileWriteStream(destination);

            return new Promise((resolve, reject) => {
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
        });
    }

    public close(): Promise<boolean> {
        return Promise.resolve(true);
    }

    private getFileWriteStream(filePath: string) {
        const stream = this.client.upload({
            container: this.containerName,
            remote: filePath
        });

        return Promise.resolve(stream);
    }

    private listFileObjects(): Promise<{ name: string, md5: string }[]> {
        return new Promise((resolve, reject) => {
            this.client.getFiles(this.containerName, (err: Error, files: any[]) => {
                if (err) {
                    reject(err);
                } else {
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