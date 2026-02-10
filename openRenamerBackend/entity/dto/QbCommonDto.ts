export default interface QbCommonDto {
    method: string;
    url: string;
    query: Record<string, string> | null;
    body: object | null;
    /**
     * 1:application/json 2:formdata 3:application/x-www-form-urlencoded
     */
    contentType: number;
}
