export default interface QbConfigDto {
    address: string;
    username: string;
    password: string;
    valid: boolean;
    /**
     * qb version,null if config is error
     */
    version: string;
    /**
     * Qbittorrent's download
     */
    qbDownloadPath: string;
    /**
     * Qbittorrent's download path corresponds to current system path
     */
    renameQbDownloadPath: string;
    /**
     * config path to select convenient
     */
    configPaths: Array<string>;
}