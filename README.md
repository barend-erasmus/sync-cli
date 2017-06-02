# sync-cli

```
Usage: sync-cli [options]

Options:
  --sourceBasePath            Base Path for Source [Required for "filesytem", "sftp"]
  --sourceHost                Host for Source [Required for "sftp"]
  --sourceUsername            Username for Source [Required for "sftp", "rackspace"]
  --sourcePassword            Password for Source [Required for "sftp"]
  --sourceApiKey              API Key for Source [Required for "rackspace"]
  --sourceContainerName       Container Name for Source [Required for "rackspace"]
  --sourceRegion              Region for Source [Required for "rackspace"]
  --destinationBasePath       Base Path for Destination [Required for "filesytem", "sftp"]
  --destinationHost           Host for Destination [Required for "sftp"]
  --destinationUsername       Username for Destination [Required for "sftp", "rackspace"]
  --destinationPassword       Password for Destination [Required for "sftp"]
  --destinationApiKey         API Key for Destination [Required for "rackspace"]
  --destinationContainerName  Container Name for Destination [Required for "rackspace"]
  --destinationRegion         Region for Destination [Required for "rackspace"]
  --sourceType                Type for Source ["filesystem" | "sftp" | "rackspace"]      [required]
  --destinationType           Type for Destination ["filesystem" | "sftp" | "rackspace"]  [required]
```