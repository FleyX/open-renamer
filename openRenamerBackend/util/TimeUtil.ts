import * as datetime from "std/datetime/mod.ts";

class TimeUtil {
  /**
   * 获取今天的零点
   */
  static getZeroTime(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  }

  static async sleep(duration: number): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => resolve(), duration);
    });
  }
}

export default TimeUtil;
