class Xerocode < Formula
  desc "XeroCode CLI — chat with a team of AI models from your terminal"
  homepage "https://xerocode.ru"
  url "https://registry.npmjs.org/xerocode-cli/-/xerocode-cli-0.1.0-beta.0.tgz"
  sha256 "667390b6c3bd27ee5fcfc43b88008342f2b14cd2d73cedc9492ed3588cbbfe1d"
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
