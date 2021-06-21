import moment from 'moment';
class TimeUtil {
  /**
   * 获取今天的零点
   */
  static getZeroTime(): Date {
    return moment()
      .millisecond(0)
      .second(0)
      .minute(0)
      .hour(0)
      .toDate();
  }

  static async sleep(duration: number): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => resolve(), duration);
    });
  }
}

export default TimeUtil;
