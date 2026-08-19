# أوامر الرفع على GitHub

## ١. استبدل اسمك (٦ ملفات)

```bash
cd decision-board
grep -rl 'amen78977\|Muhammet Amin' . | xargs sed -i \
  -e 's/amen78977/اسم-حسابك-على-github/g' \
  -e 's/Muhammet Amin/اسمك/g'
```

على macOS استخدم `sed -i ''` بدل `sed -i`.

## ٢. أنشئ المستودع

على github.com → New repository → الاسم `decision-board` → **بلا** README ولا .gitignore.

## ٣. ارفع

```bash
git init
git add .
git commit -m "طاولة القرار — الإصدار الأول"
git branch -M main
git remote add origin https://github.com/اسم-حسابك/decision-board.git
git push -u origin main
```

## ٤. تحقق

```
/plugin marketplace add اسم-حسابك/decision-board
/plugin install decision-board@decision-board
/agents
```

يجب أن ترى الخمسة: `decision-board:diagnostician` وأخواته.
