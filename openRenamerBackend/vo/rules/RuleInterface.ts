import FileObj from "../FileObj";

export default interface RuleInterface {

	deal(file: FileObj): string;
}