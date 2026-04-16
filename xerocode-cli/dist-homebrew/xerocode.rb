class Xerocode < Formula
  desc "XeroCode CLI — chat with a team of AI models from your terminal"
  homepage "https://xerocode.ru"
  url "https://registry.npmjs.org/xerocode-cli/-/xerocode-cli-0.1.0-beta.0.tgz"
  # Replace with actual shasum from `npm view xerocode-cli dist.tarball` after publish.
  # Example command to update:
  #   shasum -a 256 $(npm pack --dry-run xerocode-cli@beta 2>/dev/null | grep '\.tgz$')
  sha256 "REPLACE_WITH_ACTUAL_SHA256_AFTER_PUBLISH"
  license "MIT"
  version "0.1.0-beta.0"

  depends_on "node"

  def install
    # Install as a system-wide npm package inside the formula's libexec
    system "npm", "install", *Language::Node.std_npm_install_args(libexec)
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    assert_match(/0\.\d+\.\d+/, shell_output("#{bin}/xerocode --version"))
  end
end
