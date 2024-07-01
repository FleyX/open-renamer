export default interface BtListItemDto {
    hash: string;
    /**
     * 添加时间
     */
    added_on: number;
    /**
     * left bytes num
     */
    amount_left: number;
    /**
     *   Percentage of file pieces currently available
     */
    availability: number;
    category: string;
    /**
     * Amount of transfer data completed (bytes)
     */
    completed: number;
    /**
     * Time (Unix Epoch) when the torrent completed
     */
    completion_on: number;
    /**
     * Absolute path of torrent content (root path for multifile torrents, absolute file path for singlefile torrents)
     */
    content_path: string;
}