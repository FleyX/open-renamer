export default interface QbCommonDto {
    method: string;
    url: string;
    query: any;
    body: any;
    /**
     * 1:application/json 2:formdata 3:application/x-www-form-urlencoded
     */
    contentType: number;
}