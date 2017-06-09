// Imports
import * as co from 'co';
import * as path from 'path';
import * as yargs from 'yargs';
import { IGateway } from './gateways/gateway';

// Imports gateways
import { FileSystemGateway } from './gateways/file-system';
import { SFTPGateway } from './gateways/sftp';
import { RackspaceGateway } from './gateways/rackspace';

const argv = (<any>yargs)
    .usage('Usage: $0 [options]')

    .describe('sourceBasePath', 'Base Path for Source [Required for "filesytem", "sftp"]')
    .describe('sourceHost', 'Host for Source [Required for "sftp"]')
    .describe('sourceUsername', 'Username for Source [Required for "sftp", "rackspace"]')
    .describe('sourcePassword', 'Password for Source [Required for "sftp"]')
    .describe('sourceApiKey', 'API Key for Source [Required for "rackspace"]')
    .describe('sourceContainerName', 'Container Name for Source [Required for "rackspace"]')
    .describe('sourceRegion', 'Region for Source [Required for "rackspace"]')

    .describe('destinationBasePath', 'Base Path for Destination [Required for "filesytem", "sftp"]')
    .describe('destinationHost', 'Host for Destination [Required for "sftp"]')
    .describe('destinationUsername', 'Username for Destination [Required for "sftp", "rackspace"]')
    .describe('destinationPassword', 'Password for Destination [Required for "sftp"]')
    .describe('destinationApiKey', 'API Key for Destination [Required for "rackspace"]')
    .describe('destinationContainerName', 'Container Name for Destination [Required for "rackspace"]')
    .describe('destinationRegion', 'Region for Destination [Required for "rackspace"]')

    .describe('sourceType', 'Type for Source ["filesystem" | "sftp" | "rackspace"]')
    .describe('destinationType', 'Type for Destination ["filesystem" | "sftp" | "rackspace"]')

    .demandOption('sourceType')
    .demandOption('destinationType')
    .argv;

co(function* () {
    let sourceGateway: IGateway = null;
    let destinationGateway: IGateway = null;

    switch (argv.sourceType) {
        case 'filesystem':
            sourceGateway = new FileSystemGateway(argv.sourceBasePath);
            break;
        case 'sftp':
            sourceGateway = new SFTPGateway(argv.sourceBasePath, argv.sourceHost, argv.sourceUsername, argv.sourcePassword);
            break;
        case 'rackspace':
            sourceGateway = new RackspaceGateway(argv.sourceUsername, argv.sourceApiKey, argv.sourceRegion, argv.sourceContainerName);
            break;
    }

    switch (argv.destinationType) {
        case 'filesystem':
            destinationGateway = new FileSystemGateway(argv.destinationBasePath);
            break;
        case 'sftp':
            destinationGateway = new SFTPGateway(argv.destinationBasePath, argv.destinationHost, argv.destinationUsername, argv.destinationPassword);
            break;
        case 'rackspace':
            destinationGateway = new RackspaceGateway(argv.destinationUsername, argv.destinationApiKey, argv.destinationRegion, argv.destinationContainerName);
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