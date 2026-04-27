interface FeedbackTemplate {
  trigger_keywords: string[];
  template_text: string;
}

/**
 * 规则引擎：答题反馈匹配
 * 替代 OpenAI — 李飞飞方案
 */
export function matchFeedback(
  answerText: string,
  templates: FeedbackTemplate[]
): string {
  for (const tpl of templates) {
    for (const kw of tpl.trigger_keywords) {
      if (answerText.includes(kw)) {
        return tpl.template_text;
      }
    }
  }
  return '谢谢你认真写下这段话。它很重要。';
}
