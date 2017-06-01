import * as co from 'co';
import * as path from 'path';
import { IGateway } from './gateways/gateway';

import { FileSystemGateway } from './gateways/file-system';

co(function* () {
    const sourceGateway: IGateway = new FileSystemGateway('C:\\Temp\\a');
    const destinationGateway: IGateway = new FileSystemGateway('C:\\Temp\\b');

    const sourceFiles: string[] = yield sourceGateway.listFiles();

    log(`Source contains '${sourceFiles.length}' files`);

    for (const sourceFile of sourceFiles) {
        const sourceDirectory: string = path.dirname(sourceFile);

        const directoryExistOnDestination: boolean = yield destinationGateway.directoryExist(sourceDirectory);

        if (!directoryExistOnDestination) {
            yield destinationGateway.createDirectory(sourceDirectory);
            log(`Created directory '${sourceDirectory}' on destination`);
        }

        let shouldCopyToDestination = true;

        const fileExistOnDestination: string = yield destinationGateway.fileExist(sourceFile);

        if (fileExistOnDestination) {
            const sourceFileComparator: string = yield sourceGateway.getFileComparator(sourceFile);
            const destinationFileComparator: string = yield destinationGateway.getFileComparator(sourceFile);

            if (sourceFileComparator === destinationFileComparator) {
                shouldCopyToDestination = false;
            }
        }

        if (shouldCopyToDestination) {
            log(`Queuing '${sourceFile}' for copying to destination`);
            const sourceFileStream = yield sourceGateway.getFileReadStream(sourceFile);
            const destinationFileStream = yield destinationGateway.getFileWriteStream(sourceFile);

            yield sourceGateway.copy(sourceFileStream, destinationFileStream);

            log(`Successfully copied '${sourceFile}' to destination`);
        }
    }
});


function log(message: string) {
    console.log(message);
}