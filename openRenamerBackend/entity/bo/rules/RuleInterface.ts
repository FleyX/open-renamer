import FileObj from "../../vo/FileObj";

export default interface RuleInterface {

	deal(file: FileObj): void;
}