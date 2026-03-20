import type { Configuration } from "electron-builder";

const config: Configuration = {
  appId: "dev.app-releases-tracker",
  productName: "App Releases Tracker",
  copyright: `Copyright © ${new Date().getFullYear()}`,
  directories: {
    output: "dist",
    buildResources: "build",
  },
  files: ["out/**/*"],
  linux: {
    target: [
      { target: "AppImage", arch: ["x64", "arm64"] },
      { target: "deb", arch: ["x64"] },
    ],
    category: "Utility",
  },
  win: {
    target: [{ target: "nsis", arch: ["x64"] }],
  },
  mac: {
    target: [{ target: "dmg", arch: ["x64", "arm64"] }],
    category: "public.app-category.utilities",
    hardenedRuntime: Boolean(process.env["CSC_LINK"]),
    gatekeeperAssess: false,
  },
  publish: {
    provider: "github",
    releaseType: "release",
  },
};

export default config;
