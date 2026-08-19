# التركيب على Gemini CLI

صيغة البلَغن خاصة بـ Claude Code. لكن ملفات الوكلاء نفسها تعمل في Gemini CLI بلا تعديل.

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

## فروق يجب معرفتها

| | Claude Code | Gemini CLI |
|---|---|---|
| تركيب بأمر واحد | ✅ بلَغن | ❌ نسخ يدوي |
| حقل `memory` للحَكَم | ✅ | ❌ — استخدم ملف `decision-journal.md` يدوياً |
| حقل `model` | ✅ | يختلف — راجع توثيق Gemini |
| العزل بنافذة سياق مستقلة | ✅ | ✅ |

> الفروق في التغليف لا في الجوهر. العزل — وهو أهم ما في التصميم — يعمل في الاثنين.
