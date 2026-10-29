## Demo

**Live:** [chinesegreek.vercel.app](https:// https://chinesegreek.vercel.app)
![Search and word page](docs/demo.gif)

### Try it
1. Search a word in Chinese, pinyin (with or without tone marks), English or Greek.
2. Open a word to see its meanings, example sentences and etymology.
3. Click a component in the etymology to follow it down to its radical.
4. Click "related words" to see the words that use this one as a building block.
5. Switch the interface language (EN / EL).

### What's inside
- Recursive etymology: every word is broken down into components, down to the 214 Kangxi radicals
- Words with pinyin, word type, English and Greek meanings, and example sentences
- Next.js + PostgreSQL (Neon), deployed on Vercel
- Teacher edit mode for adding and editing words (login required)
