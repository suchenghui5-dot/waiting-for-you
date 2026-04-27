/**
 * 人格测评题库
 *
 * 包含：
 *   - 大五人格 IPIP-50（50 题，5 维度 × 10 题）
 *   - ECR-R 亲密关系体验量表（36 题，2 维度 × 18 题）
 *   - 瑞文推理（16 题，图案矩阵）
 */

// ─── 大五人格 (Big Five IPIP-50) ───

export type BigFiveFactor = 'extraversion' | 'agreeableness' | 'conscientiousness' | 'neuroticism' | 'openness';

export interface BigFiveItem {
  id: number;
  factor: BigFiveFactor;
  text: string;
  reverse: boolean;
}

export const BIG_FIVE_QUESTIONS: BigFiveItem[] = [
  // ── Extraversion (10 items: 1-5 reverse, 6-10 regular) ──
  { id: 1,  factor: 'extraversion', text: '我是聚会的中心人物', reverse: false },
  { id: 2,  factor: 'extraversion', text: '我不太爱说话', reverse: true },
  { id: 3,  factor: 'extraversion', text: '我喜歡和別人在一起', reverse: false },
  { id: 4,  factor: 'extraversion', text: '我寧可自己待著', reverse: true },
  { id: 5,  factor: 'extraversion', text: '我在社交場合中感到不自在', reverse: true },
  { id: 6,  factor: 'extraversion', text: '我很容易和陌生人打成一片', reverse: false },
  { id: 7,  factor: 'extraversion', text: '我喜歡熱鬧的聚會', reverse: false },
  { id: 8,  factor: 'extraversion', text: '我很少主動找人聊天', reverse: true },
  { id: 9,  factor: 'extraversion', text: '我從社交中獲得能量', reverse: false },
  { id: 10, factor: 'extraversion', text: '我習慣保持安靜', reverse: true },

  // ── Agreeableness (10 items: 11-15 reverse, 16-20 regular) ──
  { id: 11, factor: 'agreeableness', text: '我容易信任別人', reverse: false },
  { id: 12, factor: 'agreeableness', text: '我很少考慮別人的感受', reverse: true },
  { id: 13, factor: 'agreeableness', text: '我喜歡與人合作', reverse: false },
  { id: 14, factor: 'agreeableness', text: '我傾向於批評他人', reverse: true },
  { id: 15, factor: 'agreeableness', text: '我經常和別人爭論', reverse: true },
  { id: 16, factor: 'agreeableness', text: '我對別人的困難感同身受', reverse: false },
  { id: 17, factor: 'agreeableness', text: '我尊重他人的決定', reverse: false },
  { id: 18, factor: 'agreeableness', text: '我喜歡指出別人的錯誤', reverse: true },
  { id: 19, factor: 'agreeableness', text: '我願意幫助有需要的人', reverse: false },
  { id: 20, factor: 'agreeableness', text: '我認為每個人都有善良的一面', reverse: false },

  // ── Conscientiousness (10 items: 21-25 reverse, 26-30 regular) ──
  { id: 21, factor: 'conscientiousness', text: '我做事總是按計劃進行', reverse: false },
  { id: 22, factor: 'conscientiousness', text: '我經常拖延該做的事', reverse: true },
  { id: 23, factor: 'conscientiousness', text: '我注重細節和精確性', reverse: false },
  { id: 24, factor: 'conscientiousness', text: '我常常把事情丟到最後一刻', reverse: true },
  { id: 25, factor: 'conscientiousness', text: '我經常忘記自己的承諾', reverse: true },
  { id: 26, factor: 'conscientiousness', text: '我喜歡有條理的環境', reverse: false },
  { id: 27, factor: 'conscientiousness', text: '我會為目標制定具體計劃', reverse: false },
  { id: 28, factor: 'conscientiousness', text: '我的房間/桌面經常很亂', reverse: true },
  { id: 29, factor: 'conscientiousness', text: '我做任何事都會盡力而為', reverse: false },
  { id: 30, factor: 'conscientiousness', text: '我容易分心', reverse: true },

  // ── Neuroticism (10 items: 31-35 reverse, 36-40 regular) ──
  { id: 31, factor: 'neuroticism', text: '我經常感到焦慮', reverse: false },
  { id: 32, factor: 'neuroticism', text: '我很少感到沮喪', reverse: true },
  { id: 33, factor: 'neuroticism', text: '我的情緒容易波動', reverse: false },
  { id: 34, factor: 'neuroticism', text: '我大部分時間心情平靜', reverse: true },
  { id: 35, factor: 'neuroticism', text: '我很容易感到壓力', reverse: false },
  { id: 36, factor: 'neuroticism', text: '我很少為小事煩惱', reverse: true },
  { id: 37, factor: 'neuroticism', text: '我經常擔心不好的事情會發生', reverse: false },
  { id: 38, factor: 'neuroticism', text: '我對自己很有信心', reverse: true },
  { id: 39, factor: 'neuroticism', text: '我有時會感到莫名的悲傷', reverse: false },
  { id: 40, factor: 'neuroticism', text: '我在壓力下能保持冷靜', reverse: true },

  // ── Openness (10 items: 41-45 reverse, 46-50 regular) ──
  { id: 41, factor: 'openness', text: '我對新事物充滿好奇', reverse: false },
  { id: 42, factor: 'openness', text: '我更喜歡熟悉的環境', reverse: true },
  { id: 43, factor: 'openness', text: '我喜歡思考抽象的概念', reverse: false },
  { id: 44, factor: 'openness', text: '我不太喜歡變化', reverse: true },
  { id: 45, factor: 'openness', text: '我對藝術和美感不感興趣', reverse: true },
  { id: 46, factor: 'openness', text: '我喜歡嘗試新的體驗', reverse: false },
  { id: 47, factor: 'openness', text: '我經常有豐富的想像力', reverse: false },
  { id: 48, factor: 'openness', text: '我對新想法持開放態度', reverse: false },
  { id: 49, factor: 'openness', text: '我喜歡深入探討哲學問題', reverse: false },
  { id: 50, factor: 'openness', text: '我更願意按慣例行事', reverse: true },
];

// ─── ECR-R 亲密关系体验 (36 题) ───

export type AttachmentDimension = 'anxiety' | 'avoidance';

export interface EcrrItem {
  id: number;
  dimension: AttachmentDimension;
  text: string;
}

export const ECRR_QUESTIONS: EcrrItem[] = [
  // ── Anxiety (18 题: 1-18) ──
  { id: 1,  dimension: 'anxiety',   text: '我擔心自己不夠好，配不上伴侶的愛。' },
  { id: 2,  dimension: 'anxiety',   text: '我經常擔心伴侶不再愛我。' },
  { id: 3,  dimension: 'anxiety',   text: '我害怕一旦敞開心扉，對方會離開。' },
  { id: 4,  dimension: 'anxiety',   text: '我擔心自己不是對方心中最重要的人。' },
  { id: 5,  dimension: 'anxiety',   text: '我經常害怕失去伴侶。' },
  { id: 6,  dimension: 'anxiety',   text: '我需要反覆確認伴侶是愛我的。' },
  { id: 7,  dimension: 'anxiety',   text: '我擔心伴侶會對別人產生興趣。' },
  { id: 8,  dimension: 'anxiety',   text: '我對伴侶的態度變化很敏感。' },
  { id: 9,  dimension: 'anxiety',   text: '我經常覺得自己比別人更需要安全感。' },
  { id: 10, dimension: 'anxiety',   text: '當伴侶不在身邊時，我感到不安。' },
  { id: 11, dimension: 'anxiety',   text: '我經常擔心被拋棄。' },
  { id: 12, dimension: 'anxiety',   text: '我希望伴侶能完全接納我的一切。' },
  { id: 13, dimension: 'anxiety',   text: '我擔心自己的愛對伴侶來說不夠。' },
  { id: 14, dimension: 'anxiety',   text: '我經常需要伴侶的安慰。' },
  { id: 15, dimension: 'anxiety',   text: '我害怕一個人面對孤獨。' },
  { id: 16, dimension: 'anxiety',   text: '我經常因為小事而擔心關係的穩定性。' },
  { id: 17, dimension: 'anxiety',   text: '當伴侶沒有及時回應時，我很容易焦慮。' },
  { id: 18, dimension: 'anxiety',   text: '我非常需要伴侶的關注和確認。' },

  // ── Avoidance (19-36) ──
  { id: 19, dimension: 'avoidance', text: '我不太願意和伴侶分享內心深處的感受。' },
  { id: 20, dimension: 'avoidance', text: '當伴侶想靠近時，我會本能地退縮。' },
  { id: 21, dimension: 'avoidance', text: '我覺得過於親密會失去自我。' },
  { id: 22, dimension: 'avoidance', text: '我寧可自己處理情緒，不想依賴對方。' },
  { id: 23, dimension: 'avoidance', text: '我對伴侶的依賴感到不自在。' },
  { id: 24, dimension: 'avoidance', text: '我不太習慣和伴侶有過多親密接觸。' },
  { id: 25, dimension: 'avoidance', text: '我覺得伴侶對我太親密時，會想拉開距離。' },
  { id: 26, dimension: 'avoidance', text: '我很少主動尋求伴侶的安慰。' },
  { id: 27, dimension: 'avoidance', text: '我覺得一個人比兩個人在一起更自在。' },
  { id: 28, dimension: 'avoidance', text: '我對伴侶的關心和照顧感到壓力。' },
  { id: 29, dimension: 'avoidance', text: '當關係變得親密時，我會感到緊張。' },
  { id: 30, dimension: 'avoidance', text: '我傾向於保持自己的獨立空間。' },
  { id: 31, dimension: 'avoidance', text: '我不太信任伴侶會一直在身邊。' },
  { id: 32, dimension: 'avoidance', text: '我對伴侶的情緒需求感到負擔。' },
  { id: 33, dimension: 'avoidance', text: '我覺得表達情感是一件困難的事。' },
  { id: 34, dimension: 'avoidance', text: '我很難完全依賴另一個人。' },
  { id: 35, dimension: 'avoidance', text: '當伴侶心情不好時，我不知道該如何應對。' },
  { id: 36, dimension: 'avoidance', text: '我認為自己照顧自己比依靠他人更可靠。' },
];

// ─── 瑞文推理 (16 题) ───

export interface RavenItem {
  id: number;
  /** 3×3 矩阵，用 null 表示缺失格 */
  matrix: (string | null)[];
  /** 选项 */
  options: string[];
  /** 正确答案的索引 */
  correctIndex: number;
  /** 推理类型说明 */
  type: string;
}

// 使用 ASCII 和 Unicode 符号构建图案矩阵
export const RAVEN_QUESTIONS: RavenItem[] = [
  {
    id: 1,
    type: '图形递推',
    matrix: ['△', '△', '△', '○', '○', '○', '□', '□', null],
    options: ['△', '○', '□', '◇'],
    correctIndex: 2,
  },
  {
    id: 2,
    type: '数量递变',
    matrix: ['●', '●●', '●●●', '●●', '●●●', '●●●●', '●●●', '●●●●', null],
    options: ['●●●', '●●●●', '●●●●●', '●●●●●●'],
    correctIndex: 2,
  },
  {
    id: 3,
    type: '旋转变化',
    matrix: ['↑', '→', '↓', '→', '↓', '←', '↓', '←', null],
    options: ['↑', '→', '↓', '←'],
    correctIndex: 0,
  },
  {
    id: 4,
    type: '组合叠加',
    matrix: ['▲', '●', '▲●', '■', '◆', '■◆', '▲■', '●◆', null],
    options: ['▲◆', '▲●', '■●', '◆▲'],
    correctIndex: 0,
  },
  {
    id: 5,
    type: '交替变化',
    matrix: ['◐', '◑', '◐', '◑', '◐', '◑', '◐', '◑', null],
    options: ['◐', '◑', '◒', '◓'],
    correctIndex: 1,
  },
  {
    id: 6,
    type: '图案叠加',
    matrix: ['＋', '－', '＋－', '－', '＋', '－＋', '＋－', '－＋', null],
    options: ['＋－', '－＋', '＋＋', '－－'],
    correctIndex: 0,
  },
  {
    id: 7,
    type: '维度递增',
    matrix: ['•', '••', '•••', '◦', '◦◦', '◦◦◦', '•◦', '••◦◦', null],
    options: ['•••◦', '••◦◦◦', '•••◦◦◦', '••••'],
    correctIndex: 2,
  },
  {
    id: 8,
    type: '形状变化',
    matrix: ['○', '◯', '●', '□', '▢', '■', '◇', '⬇', null],
    options: ['◆', '⬇', '◇', '⬟'],
    correctIndex: 0,
  },
  {
    id: 9,
    type: '镜像对称',
    matrix: ['←→', '→←', '←→', '↑↓', '↓↑', '↑↓', '↖↗', '↗↖', null],
    options: ['↖↗', '↗↖', '↘↙', '↙↘'],
    correctIndex: 0,
  },
  {
    id: 10,
    type: '数量与方向',
    matrix: ['←', '←←', '←←←', '→', '→→', '→→→', '↑', '↑↑', null],
    options: ['↑↑↑', '↑↑', '↑', '↓↓↓'],
    correctIndex: 0,
  },
  {
    id: 11,
    type: '图案嵌套',
    matrix: ['[○]', '((○))', '[[[○]]]', '<○>', '<<○>>', '<<<○>>>', '{○}', '{{○}}', null],
    options: ['{{○}}', '{{{○}}}', '{○}', '{{{{○}}}}'],
    correctIndex: 1,
  },
  {
    id: 12,
    type: '交替排列',
    matrix: ['1●', '2○', '3●', '2○', '3●', '4○', '3●', '4○', null],
    options: ['4○', '5●', '5○', '4●'],
    correctIndex: 1,
  },
  {
    id: 13,
    type: '图案分裂',
    matrix: ['◇', '◆', '◇◆', '△', '▲', '△▲', '○', '●', null],
    options: ['●○', '○●', '●●', '○○'],
    correctIndex: 1,
  },
  {
    id: 14,
    type: '图形变化',
    matrix: ['⊙', '◉', '◍', '◎', '◉', '◍', '○', '●', null],
    options: ['◍', '◎', '⊙', '◉'],
    correctIndex: 0,
  },
  {
    id: 15,
    type: '复合递推',
    matrix: ['A', 'AA', 'AAA', 'B', 'BB', 'BBB', 'C', 'CC', null],
    options: ['CCC', 'CC', 'C', 'DDD'],
    correctIndex: 0,
  },
  {
    id: 16,
    type: '抽象递进',
    matrix: ['⬜', '⬛', '⬜⬛', '⬛⬜', '⬛⬛', '⬜⬜⬛', '⬜⬛', '⬛⬜⬛', null],
    options: ['⬜⬜⬛', '⬛⬛⬜', '⬜⬛⬛', '⬛⬜⬜'],
    correctIndex: 1,
  },
];

// ─── 测试配置 ───

export interface TestConfig {
  bigFive: { total: number };
  ecrr: { total: number };
  raven: { total: number };
}

export const TEST_CONFIG: TestConfig = {
  bigFive: { total: BIG_FIVE_QUESTIONS.length },
  ecrr: { total: ECRR_QUESTIONS.length },
  raven: { total: RAVEN_QUESTIONS.length },
};

export type TestSection = 'big-five' | 'ecrr' | 'raven';
export const TOTAL_QUESTIONS = BIG_FIVE_QUESTIONS.length + ECRR_QUESTIONS.length + RAVEN_QUESTIONS.length;
