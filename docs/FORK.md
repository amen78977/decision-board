# اشتقاق نسختك

> **لمن؟** من يريد نسخته الخاصة من طاولة القرار — بقواعد معدّلة، أو بلغة أخرى، أو تحت حسابه.
> **لست بحاجة إلى هذا** لمجرد الاستخدام. للتركيب راجع [`INSTALL.md`](INSTALL.md).

---

## ١. استنسخ واستبدل الهوية

```bash
git clone https://github.com/amen78977/decision-board.git
cd decision-board
grep -rl 'amen78977\|Muhammet Amin' . --exclude-dir=.git | xargs sed -i \
  -e 's/amen78977/اسم-حسابك/g' \
  -e 's/Muhammet Amin/اسمك/g'
```

على macOS استخدم `sed -i ''` بدل `sed -i`.

ثم احذف تاريخ المستودع الأصلي إن أردت بداية نظيفة: `rm -rf .git && git init`.

## ٢. أنشئ المستودع وارفع

على github.com → New repository → الاسم الذي تريد → **بلا** README ولا `.gitignore`.

```bash
git add .
git commit -m "طاولة القرار — نسختي"
git branch -M main
git remote add origin https://github.com/اسم-حسابك/decision-board.git
git push -u origin main
```

## ٣. تحقق قبل أي شيء

```bash
bash scripts/validate.sh        # يجب أن يمر بلا خطأ
node hooks/detector.test.js     # يجب أن تنجح كل الحالات
```

ثم:

```
/plugin marketplace add اسم-حسابك/decision-board
/plugin install decision-board@decision-board
/agents
```

يجب أن ترى الستة: `decision-board:diagnostician` · `verifier` · `advocate` · `opponent` · `executor` · `arbiter`.

---

## قبل أن تعدّل القواعد — اقرأ هذا

**[`PROTOCOL.md`](../PROTOCOL.md) هو المصدر الوحيد للحقيقة.** كل نسخة في المستودع مشتقة منه: المهارة، والملفان المستقلان، والوكلاء الستة.

عند تعديل قاعدة:

1. عدّلها في `PROTOCOL.md` **أولاً**
2. انشرها على المشتقات الأربعة
3. حدّث جدول المشتقات في `PROTOCOL.md`
4. شغّل `scripts/validate.sh` — هو من يكشف أنك نسيت واحداً

`validate.sh` ليس زينة: **١٠٨ فحوص** كثيرٌ منها وُلد من عيب حقيقي وقع فعلاً. الفحص الذي يبدو مبالَغاً فيه هو غالباً الذي سبق أن أنقذ الإصدار.

## ثلاثة تعديلات شائعة

| تريد | عدّل |
|---|---|
| **لغة أخرى** | الوكلاء الستة + `SKILL.md` + `standalone/*`. الأنماط في `hooks/decision-detector.js` عربية وإنجليزية — أضف لغتك هناك، وانتبه أن `\b` لا يعمل مع العربية في JS |
| **قواعد أشد أو أخف** | `PROTOCOL.md` ثم المشتقات. لا تحذف قاعدة دون تسجيل ذلك في جدول المشتقات — **قاعدة تسقط بصمت عيبٌ لا اختصار** |
| **نماذج أرخص** | جدول النماذج في `PROTOCOL.md` و`docs/ARCHITECTURE.md` و`frontmatter` الوكلاء. `validate.sh` يفرض تطابق الثلاثة. لكن اقرأ «تنويع النماذج مقصود لا عرَضي» أولاً — توحيدها على طبقة واحدة يُضعف المنظومة |

## ما لا يُنصح بتعديله

- **ج٤ العزل البنيوي وتناظر التسليح.** تمرير سياق إضافي لأحد الطرفين «لأنه يبدو مفيداً» هو بالضبط العيب الذي استغرق خمسة إصدارات لاكتشافه.
- **بوابة العمق ج٩.** حذفها يجعل كل سؤال يستدعي ستة وكلاء — والكلفة تنفلت بلا مقابل.
- **حظر التمييع ج٧.** أول قاعدة تُكسر عند التخفيف، وكسرها يُلغي قيمة المنظومة كلها.
