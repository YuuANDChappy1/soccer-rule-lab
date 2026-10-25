/* 座標は 0〜100、攻撃方向は右。表示や DOM に依存しない判定。 */
(function (root) {
  function evaluatePosition({ forwardX, ballX, defenders }) {
    if (!Number.isFinite(forwardX) || !Number.isFinite(ballX) ||
        !Array.isArray(defenders) || defenders.length < 2 ||
        !defenders.every(Number.isFinite)) {
      throw new TypeError('FW・ボールの座標と、2人以上の守備側の座標が必要です。');
    }
    const secondLastX = [...defenders].sort((a, b) => b - a)[1];
    const conditions = [forwardX > 50, forwardX > ballX, forwardX > secondLastX];
    const offside = conditions.every(Boolean);
    let reason = '味方がパスを出す瞬間、FWは3つの条件すべてに当てはまり、オフサイドポジションにいます。その位置にいるだけでは反則になりません。その後、このパスのボールに触れるなどしてプレーに関わると、オフサイドの反則になります。';
    if (!conditions[0]) reason = forwardX === 50
      ? 'FWはハーフウェーライン上にいます。このライン上は相手陣内に含まれないので、オンサイドです。'
      : 'FWは自陣にいます。自陣にいる選手は、オフサイドポジションにはなりません。';
    else if (!conditions[1]) reason = forwardX === ballX
      ? 'FWはボールと同じラインにいます。ボールより前に出ていないので、オンサイドです。'
      : 'FWはボールより後ろにいます。守備側より前にいても、ボールより後ろならオンサイドです。';
    else if (!conditions[2]) reason = forwardX === secondLastX
      ? 'FWは後ろから2人目の相手競技者と同じラインにいます。同じラインはオンサイドです。'
      : 'FWは後ろから2人目の相手競技者より後ろにいます。オフサイドポジションではありません。';
    return { offside, secondLastX, conditions, reason, limitX: Math.max(50, ballX, secondLastX) };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { evaluatePosition };
  else root.OffsideRules = { evaluatePosition };
})(globalThis);
