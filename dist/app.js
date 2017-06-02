"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const co = require("co");
const path = require("path");
const yargs = require("yargs");
const file_system_1 = require("./gateways/file-system");
const sftp_1 = require("./gateways/sftp");
const rackspace_1 = require("./gateways/rackspace");
const argv = yargs
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
    let sourceGateway = null;
    let destinationGateway = null;
    switch (argv.sourceType) {
        case 'filesystem':
            sourceGateway = new file_system_1.FileSystemGateway(argv.sourceBasePath);
            break;
        case 'sftp':
            sourceGateway = new sftp_1.SFTPGateway(argv.sourceBasePath, argv.sourceHost, argv.sourceUsername, argv.sourcePassword);
            break;
        case 'rackspace':
            sourceGateway = new rackspace_1.RackspaceGateway(argv.sourceUsername, argv.sourceApiKey, argv.sourceRegion, argv.sourceContainerName);
            break;
    }
    switch (argv.destinationType) {
        case 'filesystem':
            destinationGateway = new file_system_1.FileSystemGateway(argv.destinationBasePath);
            break;
        case 'sftp':
            destinationGateway = new sftp_1.SFTPGateway(argv.destinationBasePath, argv.destinationHost, argv.destinationUsername, argv.destinationPassword);
            break;
        case 'rackspace':
            destinationGateway = new rackspace_1.RackspaceGateway(argv.destinationUsername, argv.destinationApiKey, argv.destinationRegion, argv.destinationContainerName);
            break;
    }
    const sourceFiles = yield sourceGateway.listFiles();
    log(`Source contains '${sourceFiles.length}' files`);
    for (const sourceFile of sourceFiles) {
        const sourceDirectory = path.dirname(sourceFile);
        const directoryExistOnDestination = yield destinationGateway.directoryExist(sourceDirectory);
        if (!directoryExistOnDestination) {
            yield destinationGateway.createDirectory(sourceDirectory);
            log(`Created directory '${sourceDirectory}' on destination`);
        }
        let shouldCopyToDestination = true;
        const fileExistOnDestination = yield destinationGateway.fileExist(sourceFile);
        if (fileExistOnDestination) {
            const sourceFileComparator = yield sourceGateway.getFileComparator(sourceFile);
            const destinationFileComparator = yield destinationGateway.getFileComparator(sourceFile);
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
function log(message) {
    console.log(message);
}
