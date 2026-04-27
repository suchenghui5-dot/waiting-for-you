'use client';

import { useState, useMemo } from 'react';
import {
  NVC_TEMPLATES,
  fillTemplate,
  validateNvc,
  type NvcTemplate,
} from '@/lib/nvc-templates';

type ModalView = 'list' | 'form' | 'preview';

interface NvcModalProps {
  matchName: string;
  onSend: (text: string, templateId: string) => void;
  onClose: () => void;
}

export default function NvcModal({ matchName, onSend, onClose }: NvcModalProps) {
  const [view, setView] = useState<ModalView>('list');
  const [selectedTemplate, setSelectedTemplate] = useState<NvcTemplate | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});

  // 按 category 分组
  const categories = useMemo(() => {
    const map = new Map<string, NvcTemplate[]>();
    NVC_TEMPLATES.forEach((t) => {
      const list = map.get(t.category) || [];
      list.push(t);
      map.set(t.category, list);
    });
    return Array.from(map.entries());
  }, []);

  const handleSelectTemplate = (template: NvcTemplate) => {
    setSelectedTemplate(template);
    setValues({});
    setView('form');
  };

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const isFormValid = selectedTemplate ? validateNvc(selectedTemplate, values) : false;

  const previewText = selectedTemplate ? fillTemplate(selectedTemplate, values) : '';

  const handleSend = () => {
    if (!selectedTemplate || !isFormValid) return;
    onSend(previewText, selectedTemplate.id);
    onClose();
  };

  // ─── 列表页 ───
  if (view === 'list') {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div className="absolute inset-0 bg-ink-black/40" onClick={onClose} />
        <div className="relative bg-paper-white w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[80vh] flex flex-col shadow-xl">
          {/* 头部 */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-paper-aged">
            <h2 className="text-base font-medium text-ink-black">选择 NVC 模板</h2>
            <button onClick={onClose} className="text-ink-light hover:text-ink-black text-lg leading-none">&times;</button>
          </div>

          {/* 模板列表 */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {categories.map(([category, templates]) => (
              <div key={category}>
                <p className="text-xs text-ink-light mb-2">{category}</p>
                <div className="space-y-2">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTemplate(t)}
                      className="w-full text-left garden-card hover:border-ink-black/20 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl shrink-0 mt-0.5">{t.icon}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-ink-black">{t.label}</p>
                          <p className="text-xs text-ink-light mt-0.5">{t.description}</p>
                        </div>
                        <span className="text-ink-light shrink-0 mt-1">→</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-ink-light text-center pb-4">
            NVC 非暴力沟通 · 帮助你更清晰地表达自己
          </p>
        </div>
      </div>
    );
  }

  // ─── 表单/预览页 ───
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-ink-black/40" onClick={onClose} />
      <div className="relative bg-paper-white w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[80vh] flex flex-col shadow-xl">
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-paper-aged">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('list')}
              className="text-ink-light hover:text-ink-black text-sm"
            >
              ← 返回
            </button>
            <span className="text-ink-light text-sm">/</span>
            <span className="text-sm text-ink-black font-medium">
              {selectedTemplate?.icon} {selectedTemplate?.label}
            </span>
          </div>
          <button onClick={onClose} className="text-ink-light hover:text-ink-black text-lg leading-none">&times;</button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Tab: 填写 / 预览 */}
          <div className="flex gap-4 border-b border-paper-aged">
            <button
              onClick={() => setView('form')}
              className={`pb-2 text-sm border-b-2 transition-colors ${
                view === 'form'
                  ? 'border-ink-black text-ink-black font-medium'
                  : 'border-transparent text-ink-light'
              }`}
            >
              填写
            </button>
            <button
              onClick={() => setView('preview')}
              className={`pb-2 text-sm border-b-2 transition-colors ${
                view === 'preview'
                  ? 'border-ink-black text-ink-black font-medium'
                  : 'border-transparent text-ink-light'
              }`}
            >
              预览
            </button>
          </div>

          {/* 表单 */}
          {view === 'form' && selectedTemplate && (
            <div className="space-y-4">
              {selectedTemplate.fields.map((field) => (
                <div key={field.key}>
                  <label className="text-xs text-ink-light mb-1.5 block">
                    {field.label}
                    {field.required && <span className="text-seal-red ml-0.5">*</span>}
                    {field.maxLength && (
                      <span className="text-[10px] text-ink-light ml-2">
                        {(values[field.key] || '').length}/{field.maxLength}
                      </span>
                    )}
                  </label>
                  <textarea
                    value={values[field.key] || ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    maxLength={field.maxLength}
                    rows={field.key === 'observation' || field.key === 'theirWords' || field.key === 'myUnderstanding' ? 3 : 2}
                    className="input-field w-full resize-none text-sm"
                    autoFocus={field.key === selectedTemplate.fields[0]?.key}
                  />
                </div>
              ))}
            </div>
          )}

          {/* 预览 */}
          {view === 'preview' && (
            <div className="space-y-3">
              <div className="bg-paper-cream rounded-petal p-4">
                <p className="text-xs text-ink-light mb-2">发送给 {matchName}</p>
                <p className="text-sm text-ink-black leading-relaxed whitespace-pre-wrap">
                  {previewText || '填写内容后，这里会显示完整的消息...'}
                </p>
              </div>
              <p className="text-xs text-ink-light">
                NVC 消息在对话中会带有标记，帮助对方理解你的表达方式
              </p>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="px-5 pb-5 pt-3 border-t border-paper-aged">
          <button
            onClick={handleSend}
            disabled={!isFormValid}
            className={`btn-primary w-full ${
              !isFormValid ? 'opacity-30 cursor-not-allowed' : ''
            }`}
          >
            {isFormValid ? `发送给 ${matchName}` : '请填写所有必填项'}
          </button>
          <p className="text-[10px] text-ink-light text-center mt-2">
            NVC 消息会让对方知道你在用结构化沟通表达自己
          </p>
        </div>
      </div>
    </div>
  );
}
