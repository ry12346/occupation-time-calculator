# 占領時間・到着予想時刻計算

開始日時と占領するマス数から、占領終了予想日時を計算する静的Webページです。

## 計算ルール

- 6:00〜24:00: 1マス5分
- 0:00〜2:00: 1マス10分
- 2:00〜6:00: 1マス30分
- マス間の移動: 15秒
- 最後のマスの後には移動時間を加算しません
- 各マスの所要時間は、そのマスの占領開始時刻を基準に決定します

## 主な機能

- 占領終了予想日時の表示
- 総所要時間、占領時間、移動時間の表示
- 10分帯・30分帯へ初めて入るマス番号の表示
- 時間帯別のマス数と所要時間の内訳
- 時間帯が切り替わるマスの一覧
- 結果のクリップボードコピー
- スマートフォン対応
- 外部ライブラリ・サーバー不要

## ローカルで確認

`index.html` をブラウザで開くだけでも動作します。

ローカルサーバーで確認する場合は、プロジェクトフォルダー内で次を実行します。

```bash
python -m http.server 8000
```

その後、ブラウザで `http://localhost:8000` を開きます。

## テスト

Node.jsがインストールされている環境では、次のコマンドで計算ロジックを確認できます。

```bash
node tests/calculator.test.js
```

## GitHubへ登録

GitHubで空のリポジトリを作成した後、このフォルダーで次を実行します。`YOUR_NAME` はGitHubのユーザー名に置き換えてください。

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_NAME/occupation-time-calculator.git
git push -u origin main
```

HTTPSで認証を求められた場合、環境によってはブラウザ認証またはPersonal Access Tokenを使用します。

## GitHub Pagesで公開

1. GitHubのリポジトリ画面で `Settings` → `Pages` を開きます。
2. `Build and deployment` の `Source` を `Deploy from a branch` にします。
3. Branchに `main`、フォルダーに `/(root)` を指定して保存します。
4. 公開処理の完了後、Pages画面に表示されるURLへアクセスします。

通常の公開URLは次の形式です。

```text
https://YOUR_NAME.github.io/occupation-time-calculator/
```

## ファイル構成

```text
.
├── index.html
├── styles.css
├── calculator.js
├── app.js
├── .nojekyll
├── README.md
└── tests/
    └── calculator.test.js
```
