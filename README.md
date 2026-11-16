# clawd-buddy 小螃蟹 🦀

一只像素小螃蟹 Clawd，住在 Claude Code 输入框上方的小海滩上，一直陪着你。

- **Claude 思考时**：它边横着走边说可爱的思考词（*Scuttling…*、*Tidepooling…*），每隔一会儿停下来做个小动作。
- **回答完成时**：它会原地蹦蹦跳跳地庆祝（*Nailed it!*）。
- **空闲时**：它在沙滩上走走停停，挥钳子、伸懒腰、挖沙子、哼小曲、打哈欠……还会说一套自己的可爱词（*Sunbathing…*、*Cloud-gazing…*、*Puddle-jumping…*）。
- **每一轮换一顶帽子**（水手帽、草帽、皇冠、圣诞帽、魔法帽），偶尔还会变成稀有的粉色、薄荷绿或天蓝色。
- 输入 `/crab` 可以让它回去睡觉，再输一次就叫它回来。

适用于 Claude Code 的桌面 App（Code 标签页）、终端和 VS Code，需要比较新的 Claude Code 版本。聊天（Chat）模式里没有。

## 安装

打开终端，运行：

```bash
claude plugin install clawd-buddy --marketplace hhllkksd/clawd-buddy
```

或者在终端的 Claude Code 对话里输入：

```
/plugin install clawd-buddy --marketplace hhllkksd/clawd-buddy
```

提示 `Add marketplace?` 时输入 `y`，选择范围时直接回车。装好后**新开一个对话**就能看到小螃蟹了。

在桌面 App 里也可以这样装：点输入框旁边的 **+** → **Plugins** → **Add marketplace**，填 `hhllkksd/clawd-buddy`，然后 **Add plugin**。

## 卸载

```bash
claude plugin uninstall clawd-buddy
```

## 改着玩

- 空闲时说的可爱词：`hooks/clawd/lines.ts` 里的 `IDLE_WORDS`
- 思考时说的词：`hooks/clawd/forms.ts` 里的 `VERBS`
- 小动作：`hooks/clawd/acts.ts`

## 来源

最初的版本来自朋友分享的 clawd-buddy，这一版在它的基础上改了空闲时的散步、小动作和英文台词。
