# XeroCode Homebrew tap

This folder contains the formula to install `xerocode-cli` via Homebrew.

## Step 1 — publish to npm first

```bash
cd xerocode-cli
npm login           # interactive; one-time
npm publish --tag beta --access public
```

After publish, run to get the SHA256:

```bash
curl -sL https://registry.npmjs.org/xerocode-cli | \
  python3 -c "import sys, json; d=json.load(sys.stdin); v=d['dist-tags']['beta']; print(d['versions'][v]['dist']['shasum'])"
```

Or download the tarball and hash it:

```bash
npm pack xerocode-cli@beta
shasum -a 256 xerocode-cli-0.1.0-beta.0.tgz
```

Replace `REPLACE_WITH_ACTUAL_SHA256_AFTER_PUBLISH` in `xerocode.rb` with the
output.

## Step 2 — create the tap repo

On GitHub, create a new repo named **`homebrew-tap`** under your user or org
(e.g. `github.com/SYL4R2k27/homebrew-tap`). This naming is required by
Homebrew.

Push `xerocode.rb` to that repo under `Formula/xerocode.rb`:

```bash
mkdir -p /tmp/homebrew-tap/Formula
cp xerocode-cli/dist-homebrew/xerocode.rb /tmp/homebrew-tap/Formula/
cd /tmp/homebrew-tap
git init
git add .
git commit -m "Initial: xerocode formula 0.1.0-beta.0"
git branch -M main
git remote add origin git@github.com:SYL4R2k27/homebrew-tap.git
git push -u origin main
```

## Step 3 — users can install

```bash
brew tap SYL4R2k27/tap
brew install xerocode
```

## Updating the formula for new releases

When you publish a new `xerocode-cli` version:

1. Update `version` and `url` in `xerocode.rb` (version bumps).
2. Recompute SHA256 (Step 1).
3. `git commit` and `git push` in the tap repo.
