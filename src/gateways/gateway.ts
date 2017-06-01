export interface IGateway {
    createDirectory(dirPath): Promise<boolean>;
    listFiles(): Promise<string[]>;
    // listFileObjects(): Promise<{name: string, md5: string}[]>;
    getFileReadStream(filePath: string): Promise<any>;
    getFileComparator(filePath: string): Promise<string>;
    deleteFile(filePath: string): Promise<boolean>;
    deleteDirectory(dirPath: string): Promise<boolean>;
    directoryExist(dirPath: string): Promise<boolean>;
    fileExist(filePath: string): Promise<boolean>;
    upload(stream: any, destination: string): Promise<boolean>;
    close(): Promise<boolean>;
}