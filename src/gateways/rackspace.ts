import * as path from 'path';
import * as pkgcloud from 'pkgcloud';
import * as fs from 'graceful-fs';

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


    public createDirectory(dirPath): Promise<Boolean> {
        return Promise.resolve(true);
    }

    public listFileObjects(): Promise<string[]> {
        return new Promise((fulfill, reject) => {
            this.client.getFiles(this.containerName, (err: Error, files: any[]) => {
                if (err) {
                    reject(err);
                } else {
                    fulfill(files.filter(x => x.contentType != 'application/directory').map(x => {
                        return {
                            name: x.name,
                            md5: x.etag
                        };
                    }));
                }
            });
        });
    }

    public listFiles(): Promise<string[]> {
        return new Promise((fulfill, reject) => {
            this.client.getFiles(this.containerName, (err: Error, files: any[]) => {
                if (err) {
                    reject(err);
                } else {
                    fulfill(files.filter(x => x.contentType != 'application/directory').map(x => x.name));
                }
            });
        });
    }

    public getFileReadStream(filePath: string) {
        let stream = this.client.download({
            container: this.containerName,
            remote: filePath
        });

        return Promise.resolve(stream);
    }

    public getFileWriteStream(filePath: string) {
        let stream = this.client.upload({
            container: this.containerName,
            remote: filePath
        });

        return Promise.resolve(stream);
    }

    public getFileComparator(filePath: string): Promise<string> {
        return new Promise((fulfill, reject) => {
            this.client.getFile(this.containerName, filePath, (err: Error, result: any) => {
                if (err) {
                    reject(err);
                } else {
                    fulfill(result.etag);
                }
            });
        });
    }

    public deleteFile(filePath: string): Promise<Boolean> {
        return new Promise((fulfill, reject) => {
            this.client.removeFile(this.containerName, filePath, (err: Error, result: any) => {
                if (err) {
                    reject(err);
                } else {
                    fulfill(true);
                }
            });
        });
    }

    public deleteDirectory(dirPath: string): Promise<Boolean> {
        return Promise.resolve(true);
    }

    public directoryExist(dirPath: string): Promise<Boolean> {
        return Promise.resolve(true);
    }

    public fileExist(filePath: string): Promise<Boolean> {
        return new Promise((fulfill, reject) => {
            this.client.getFile(this.containerName, filePath, (err: Error, result: any) => {
                if (err) {
                    fulfill(false);
                } else {
                    fulfill(true);
                }
            });
        });
    }

    public copy(streamSrc: fs.ReadStream, streamDest: fs.WriteStream) {
        return new Promise((fulfill, reject) => {


            streamSrc.on('error', (err: Error) => {
                reject(err);
            });

            streamDest.on('error', (err: Error) => {
                reject(err);
            });

            streamSrc.on('finish', function () {
                
            });

            streamDest.on('finish', function () {
                fulfill(true);
            });

            streamSrc.pipe(streamDest);
        });
    }
}