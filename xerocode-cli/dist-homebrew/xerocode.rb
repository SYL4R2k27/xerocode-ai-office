class Xerocode < Formula
  desc "Chat with a team of AI models from your terminal"
  homepage "https://xerocode.ru"
  url "https://registry.npmjs.org/xerocode-cli/-/xerocode-cli-0.1.0-beta.0.tgz"
  sha256 "667390b6c3bd27ee5fcfc43b88008342f2b14cd2d73cedc9492ed3588cbbfe1d"
  license "MIT"
  version "0.1.0-beta.0"

  depends_on "node"

  def install
    # Homebrew downloaded and extracted the npm tarball to buildpath.
    # Install it as a global npm package inside libexec, then symlink the
    # `xerocode` binary into `bin/` so it appears on the user's PATH.
    system "npm", "install", "-g",
                  "--prefix=#{libexec}",
                  "--cache=#{buildpath}/npm-cache",
                  buildpath
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    assert_match(/\d+\.\d+\.\d+/, shell_output("#{bin}/xerocode --version"))
  end
end
