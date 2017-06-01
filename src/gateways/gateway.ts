export interface IGateway {
    createDirectory(dirPath): Promise<boolean>;
    listFiles(): Promise<string[]>;
    listFileObjects(): Promise<any[]>;
    getFileReadStream(filePath: string);
    getFileWriteStream(filePath: string);
    getFileComparator(filePath: string): Promise<string>;
    deleteFile(filePath: string): Promise<boolean>;
    deleteDirectory(dirPath: string): Promise<boolean>;
    directoryExist(dirPath: string): Promise<boolean>;
    fileExist(filePath: string): Promise<boolean>;
    copy(streamSrc: any, streamDest: any): Promise<boolean>;
}