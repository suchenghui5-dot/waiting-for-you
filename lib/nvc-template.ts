/**
 * NVC 极简句子模板 — Esther Perel 设计
 *
 * 聊天框上方常驻模板，用户填空发送
 */
export const NVC_TEMPLATE = {
  parts: [
    { placeholder: '______', label: '当……的时候', key: 'observation' as const },
    { placeholder: '______', label: '我感到', key: 'feeling' as const },
    { placeholder: '______', label: '因为我需要', key: 'need' as const },
    { placeholder: '______', label: '你愿意……吗？', key: 'request' as const },
  ],
  assemble: (values: Record<string, string>) =>
    `当${values.observation}的时候，\n我感到${values.feeling}，\n因为我需要${values.need}。\n你愿意${values.request}吗？`,
  empty: '当______的时候，\n我感到______，\n因为我需要______。\n你愿意______吗？',
};
