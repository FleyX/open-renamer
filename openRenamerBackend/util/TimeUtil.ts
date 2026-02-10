class TimeUtil {
  /**
   * 获取今天的零点
   */
  static getZeroTime(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  }

  static sleep(duration: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), duration);
    });
  }
}

export default TimeUtil;
