export default interface QbConfigDto {
    address: string;
    username: string;
    password: string;
    valid: boolean;
    version: string | null;
    qbDownloadPath: string;
    renameQbDownloadPath: string;
    configPaths: Array<string>;
}
