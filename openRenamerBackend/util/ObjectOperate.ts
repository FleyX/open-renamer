/* 
    合并node对象，对于相同的属性后面覆盖前面
*/
class ObjectOperation {
    static combineObject(...objs) {
        if (objs.length == 1 && objs[0] instanceof Array) {
            objs = objs[0];
        }
        let sum = {};
        let length = objs.length;
        for (let i = 0; i < length; i++) {
            sum = Object.assign(sum,objs[i]);
        }
        return sum;
    }
}

export default ObjectOperation