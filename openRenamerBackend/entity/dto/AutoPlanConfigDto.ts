export default interface AutoPlanConfigDto {
	paths: Array<string>,
	version: Number,
	ignoreSeason0: Boolean,
	ignorePaths: Array<string>,
	deleteSmallVideo: boolean,
	rules: Array<string>,
	start: boolean
}