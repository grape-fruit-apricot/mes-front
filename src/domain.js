export const statuses = { READY: '작업 대기', IN_PROGRESS: '생산 중', COMPLETED: '생산 완료' };
export function validateProduction(plannedQty, goodQty, defectQty, reason) {
  if (goodQty === '' || defectQty === '') return '양품과 불량 수량을 모두 입력해 주세요.';
  const good = Number(goodQty), defect = Number(defectQty);
  if (![good, defect].every(n => Number.isSafeInteger(n) && n >= 0 && n <= 9999999999)) return '수량은 0 이상 9,999,999,999 이하의 정수여야 합니다.';
  if (good + defect !== plannedQty) return '양품과 불량 수량의 합계가 지시 수량과 같아야 합니다.';
  if (defect > 0 && !reason.trim()) return '불량 수량이 있으면 불량 사유를 입력해 주세요.';
  return '';
}
export function canReceive(row) { return row.resultId != null && row.receiptId == null && row.goodQty > 0; }
