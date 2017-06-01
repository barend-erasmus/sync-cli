import * as co from 'co';
import * as path from 'path';
import * as yargs from 'yargs';
import { IGateway } from './gateways/gateway';

import { FileSystemGateway } from './gateways/file-system';
import { SFTPGateway } from './gateways/sftp';

const argv = (<any>yargs).argv;

co(function* () {
    let sourceGateway: IGateway = null;
    let destinationGateway: IGateway = null;

    switch (argv.sourceType) {
        case 'filesystem':
            sourceGateway = new FileSystemGateway(argv.sourceBasePath);
            break;
    }

    switch (argv.destinationType) {
        case 'filesystem':
            destinationGateway = new FileSystemGateway(argv.destinationBasePath);
            break;
    }

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
                log(`No changes found '${sourceFile}'`);
                shouldCopyToDestination = false;
            }
        }

        if (shouldCopyToDestination) {
            log(`Queuing '${sourceFile}' for copying to destination`);
            const sourceFileStream = yield sourceGateway.getFileReadStream(sourceFile);

            yield destinationGateway.upload(sourceFileStream, sourceFile);

            log(`Successfully copied '${sourceFile}' to destination`);
        }
    }

    sourceGateway.close();
    destinationGateway.close();
});


function log(message: string) {
    console.log(message);
}