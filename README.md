## Chinese Greek English dictionary with component breakdowns

**Live:** [chinesegreek.vercel.app](https://chinesegreek.vercel.app)
![Search and word page](docs/demo.gif)

### About this project
Built for my dad, a Chinese teacher, from his own vocabulary spreadsheet. The source data was a large, inconsistent Excel file that I cleaned, normalized and restructured into a relational schema.


https://github.com/user-attachments/assets/5173f12d-6ed9-430d-a841-22e85c2ed4c7


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

### Screenshots

#### Main screen
<img width="600" src="https://github.com/user-attachments/assets/b8fcb44a-939c-493e-84b7-42c16e28e711" />
<img width="600" src="https://github.com/user-attachments/assets/e397957b-9905-4224-ae69-512a4bda6209" />

#### Teacher edit word
<img width="600" src="https://github.com/user-attachments/assets/60e7d872-497d-4ab9-b674-017904913483" /> 

#### Radicals page
<img width="600" src="https://github.com/user-attachments/assets/77722ca0-8150-4653-b5ce-7eae5e4cbfba" /> 

### Database Schema
Words point to their components, and components point down to the 214 radicals, which makes the etymology a recursive lookup.

<img src="docs/db_schema.svg" width="600" alt="database schema">
