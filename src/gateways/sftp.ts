import * as path from 'path';
import * as fs from 'graceful-fs';
import * as node_ssh from 'node-ssh';
import * as uuid from 'uuid';
import * as co from 'co';
import { IGateway } from './gateway';

export class SFTPGateway implements IGateway {

    private connection: any = null;
    private sftpRequest: any = null;

    constructor(private basePath, private host: string, private username: string, private password: string) {

    }

    public createDirectory(dirPath): Promise<boolean> {
        dirPath = this.buildFullPath(dirPath);

        const self = this;
        return co(function* () {
            const connection = yield self.getSSHConnection();
            const result = yield connection.execCommand(`mkdir -p ${dirPath}`)

            return result.code === 0;
        });
    }

    public listFiles(): Promise<string[]> {
        const self = this;
        return co(function* () {
            const connection = yield self.getSSHConnection();
            const result = yield connection.execCommand(`find ${self.basePath} -type f`)

            return result.code === 0 ? result.stdout.split('\n').map((x) => path.relative(self.basePath, x)) : null;
        });
    }

    public getFileReadStream(filePath: string): Promise<any> {
        const id = uuid.v4();
        const self = this;
        return co(function* () {
            const connection = yield self.getSSHConnection();
            const sftpRequest = yield self.getSFTPRequest();
            yield connection.getFile(`./temp/${id}`, self.buildFullPath(filePath), sftpRequest);

            return fs.createReadStream(`./temp/${id}`);
        });
    }

    public getFileComparator(filePath: string): Promise<string> {
        filePath = this.buildFullPath(filePath);

        const self = this;
        return co(function* () {
            const connection = yield self.getSSHConnection();
            const result = yield connection.execCommand(`md5sum ${filePath}`)

            return result.code === 0 ? result.stdout.split(' ')[0] : null;
        });
    }

    public deleteFile(filePath: string): Promise<boolean> {
        filePath = this.buildFullPath(filePath);

        const self = this;
        return co(function* () {
            const connection = yield self.getSSHConnection();
            const result = yield connection.execCommand(`rm -f ${filePath}`)

            return result.code === 0;
        });
    }

    public deleteDirectory(dirPath: string): Promise<boolean> {
        dirPath = this.buildFullPath(dirPath);

        const self = this;
        return co(function* () {
            const connection = yield self.getSSHConnection();
            const result = yield connection.execCommand(`rm -R ${dirPath}`)

            return result.code === 0;
        });
    }

    public directoryExist(dirPath: string): Promise<boolean> {
        dirPath = this.buildFullPath(dirPath);

        const self = this;
        return co(function* () {
            const connection = yield self.getSSHConnection();
            const result = yield connection.execCommand(`test -e ${dirPath}`)

            return result.code === 0;
        });
    }

    public fileExist(filePath: string): Promise<boolean> {
        filePath = this.buildFullPath(filePath);

        const self = this;
        return co(function* () {
            const connection = yield self.getSSHConnection();
            const result = yield connection.execCommand(`test -e ${filePath}`)

            return result.code === 0;
        });
    }

    public upload(stream: fs.ReadStream, destination: string): Promise<boolean> {

        const id = uuid.v4();

        return new Promise((resolve, reject) => {

            const tempStream = fs.createWriteStream(`./temp/${id}`);

            stream.on('error', (err: Error) => {
                reject(err);
            });

            tempStream.on('error', (err: Error) => {
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

    public close(): Promise<boolean> {
        this.connection.dispose();
        return Promise.resolve(true);
    }

    private getSSHConnection(): Promise<any> {

        if (this.connection !== null) {
            return Promise.resolve(this.connection);
        }

        this.connection = new node_ssh()

        return this.connection.connect({
            host: this.host,
            username: this.username,
            password: this.password,
        }).then(() => {
            return this.connection;
        });
    }

    private getSFTPRequest(): Promise<any> {

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

    private buildFullPath(filePath: string): string {
        filePath = path.join(this.basePath, filePath);
        filePath = filePath.replace(new RegExp('\\' + path.sep, 'g'), '/');

        return filePath;
    }
}