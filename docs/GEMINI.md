# التركيب على Gemini CLI

صيغة البلَغن الأصلية خاصة بـ Claude Code، لكن البروتوكول نفسه مستقل عن المضيف. لدمجه مع أي agent استخدم [`standalone/UNIVERSAL.md`](../standalone/UNIVERSAL.md) أو [`UNIVERSAL.ar.md`](../standalone/UNIVERSAL.ar.md)، ولربط orchestrator ذي subagents راجع [`ADAPTERS.md`](ADAPTERS.md). ملفات الوكلاء تعمل في Gemini CLI بلا تعديل.

## الخطوات

```bash
git clone https://github.com/amen78977/decision-board.git
cd decision-board

# على مستوى المستخدم (كل المشاريع)
mkdir -p ~/.gemini/agents
cp agents/*.md ~/.gemini/agents/

# أو على مستوى المشروع
mkdir -p .gemini/agents
cp agents/*.md .gemini/agents/
```

ثم ضع محتوى `skills/decision-board/SKILL.md` في ملف `GEMINI.md` بجذر المشروع.

للتحقق: `/agents`

## أي وكيل آخر

إذا لم يكن المضيف Claude Code أو Gemini CLI، لا تحاول تقليد أوامر `/plugin`. الصق المحول العالمي في تعليمات النظام أو المطوّر، ودع المضيف يختار بين الوكلاء الفرعيين المستقلين والتتابع داخل السياق. يجب أن يصرّح المضيف إذا كان العزل مُحاكى، وأن يمرر `الحزمة_المحايدة` نفسها حرفيًا إلى أدوار التحليل.

## فروق يجب معرفتها

| | Claude Code | Gemini CLI |
|---|---|---|
| تركيب بأمر واحد | ✅ بلَغن | ❌ نسخ يدوي |
| حقل `memory` للحَكَم | ✅ | ❌ — استخدم ملف `decision-journal.md` يدوياً |
| حقل `model` | ✅ | يختلف — راجع توثيق Gemini |
| العزل بنافذة سياق مستقلة | ✅ | ✅ |

> الفروق في التغليف لا في الجوهر. العزل — وهو أهم ما في التصميم — يعمل في الاثنين.
