/**
 * NVC（非暴力沟通）模板库
 *
 * 基于 NVC 四要素：观察 → 感受 → 需要 → 请求
 * 帮助用户在对话中更清晰地表达自己
 */

export interface NvcField {
  key: string;
  label: string;
  placeholder: string;
  required: boolean;
  maxLength?: number;
}

export interface NvcTemplate {
  id: string;
  category: string;
  label: string;
  description: string;
  icon: string;
  fields: NvcField[];
  template: string;   // 用 {{key}} 占位
}

export interface NvcFilled {
  templateId: string;
  filled: Record<string, string>;
}

/** 填充模板 */
export function fillTemplate(template: NvcTemplate, values: Record<string, string>): string {
  let result = template.template;
  for (const field of template.fields) {
    result = result.replace(
      new RegExp(`\\{\\{${field.key}\\}\\}`, 'g'),
      values[field.key]?.trim() || '______'
    );
  }
  return result;
}

/** 验证必填字段是否已填 */
export function validateNvc(template: NvcTemplate, values: Record<string, string>): boolean {
  return template.fields
    .filter((f) => f.required)
    .every((f) => values[f.key]?.trim().length > 0);
}

export const NVC_TEMPLATES: NvcTemplate[] = [
  // ───────── 表达感受 ─────────
  {
    id: 'express-feeling',
    category: '表达感受',
    label: '表达感受',
    description: '温和地表达你的感受，不指责对方',
    icon: '💗',
    fields: [
      { key: 'observation', label: '观察（事实）', placeholder: '发生了什么事？尽量客观描述', required: true, maxLength: 200 },
      { key: 'feeling', label: '感受', placeholder: '你的感受是什么？如：开心、担心、失落...', required: true, maxLength: 80 },
      { key: 'need', label: '需要', placeholder: '你在乎的是什么？如：被理解、安全感、信任...', required: true, maxLength: 80 },
      { key: 'request', label: '请求', placeholder: '你希望对方做什么？', required: false, maxLength: 200 },
    ],
    template: '当你{{observation}}，我感到{{feeling}}，因为我需要{{need}}。{{request ? "你愿意" + request + "吗？" : ""}}',
  },

  // ───────── 表达欣赏 ─────────
  {
    id: 'express-appreciation',
    category: '表达欣赏',
    label: '表达欣赏',
    description: '让对方知道你在乎什么、感谢什么',
    icon: '🌷',
    fields: [
      { key: 'action', label: '对方做的事', placeholder: '对方做了什么让你欣赏的事', required: true, maxLength: 200 },
      { key: 'feeling', label: '你的感受', placeholder: '这让你感到怎样？', required: true, maxLength: 80 },
      { key: 'value', label: '你重视的价值', placeholder: '这体现了什么价值？如：真诚、用心、勇气...', required: false, maxLength: 80 },
    ],
    template: '当你{{action}}，我感到{{feeling}}。{{value ? "因为我真的很重视" + value + "。" : ""}}谢谢你。',
  },

  // ───────── 表达需要 ─────────
  {
    id: 'express-need',
    category: '表达需要',
    label: '表达需要',
    description: '坦诚地表达你在关系中的需要',
    icon: '💧',
    fields: [
      { key: 'observation', label: '背景', placeholder: '最近发生了什么？', required: false, maxLength: 200 },
      { key: 'need', label: '你的需要', placeholder: '你需要什么？如：更多的交流、独处的时间...', required: true, maxLength: 100 },
      { key: 'why', label: '为什么重要', placeholder: '这个需要对你意味着什么？', required: false, maxLength: 200 },
    ],
    template: '{{observation ? "我注意到" + observation + "。" : ""}}对我来说，{{need}}很重要。{{why ? "因为" + why + "。" : ""}}你愿意和我聊聊这个吗？',
  },

  // ───────── 温和澄清 ─────────
  {
    id: 'gentle-clarify',
    category: '温和澄清',
    label: '温和澄清',
    description: '不确定对方意思时，友好地确认',
    icon: '🔍',
    fields: [
      { key: 'theirWords', label: '对方说过的话', placeholder: '对方说了什么？引用原话', required: true, maxLength: 200 },
      { key: 'myUnderstanding', label: '我的理解', placeholder: '你理解成了什么？', required: true, maxLength: 200 },
    ],
    template: '我听到你说"{{theirWords}}"。我理解的是{{myUnderstanding}}。我理解对了吗？',
  },

  // ───────── 表达边界 ─────────
  {
    id: 'express-boundary',
    category: '表达边界',
    label: '表达边界',
    description: '温和但坚定地表达自己的边界',
    icon: '🪷',
    fields: [
      { key: 'behavior', label: '具体行为', placeholder: '对方做了什么让你不舒服的事', required: true, maxLength: 200 },
      { key: 'feeling', label: '感受', placeholder: '这让你感到怎样？', required: true, maxLength: 80 },
      { key: 'need', label: '需要/边界', placeholder: '你需要什么？如：多一些空间、换一种沟通方式...', required: true, maxLength: 100 },
      { key: 'suggestion', label: '建议', placeholder: '你希望以后可以怎样？', required: false, maxLength: 200 },
    ],
    template: '当你{{behavior}}，我感到{{feeling}}，因为我需要{{need}}。{{suggestion ? "我希望我们可以" + suggestion + "。" : ""}}你愿意听听我的想法吗？',
  },

  // ───────── 道歉与修复 ─────────
  {
    id: 'apologize',
    category: '道歉与修复',
    label: '道歉与修复',
    description: '承认过失，表达修复的意愿',
    icon: '🕊️',
    fields: [
      { key: 'myAction', label: '我做了什么', placeholder: '你意识到自己做了什么', required: true, maxLength: 200 },
      { key: 'theirFeeling', label: '对方可能的感觉', placeholder: '你猜测对方可能感到什么', required: false, maxLength: 80 },
      { key: 'myCommitment', label: '我的改进承诺', placeholder: '你以后会怎么做？', required: true, maxLength: 200 },
    ],
    template: '我意识到{{myAction}}，{{theirFeeling ? "可能让你感到" + theirFeeling + "，" : ""}}我很抱歉。我会{{myCommitment}}。',
  },

  // ───────── 邀请对话 ─────────
  {
    id: 'invite-talk',
    category: '邀请对话',
    label: '邀请对话',
    description: '想聊一个话题时，给对方选择权',
    icon: '☕',
    fields: [
      { key: 'topic', label: '想聊的话题', placeholder: '你想聊什么？', required: true, maxLength: 100 },
      { key: 'reason', label: '为什么想聊', placeholder: '为什么觉得这个话题重要？', required: false, maxLength: 200 },
    ],
    template: '我想和你聊聊{{topic}}。{{reason ? "因为" + reason + "。" : ""}}你现在方便吗？如果不方便，我们可以另找时间。',
  },

  // ───────── 请求反馈 ─────────
  {
    id: 'request-feedback',
    category: '请求反馈',
    label: '请求反馈',
    description: '主动询问对方的感受和想法',
    icon: '🌱',
    fields: [
      { key: 'context', label: '关于什么', placeholder: '你想了解对方对什么的看法', required: true, maxLength: 100 },
      { key: 'openQuestion', label: '开放问题', placeholder: '具体想问什么？', required: true, maxLength: 200 },
    ],
    template: '关于{{context}}，我想听听你的真实感受。{{openQuestion}}',
  },
];
