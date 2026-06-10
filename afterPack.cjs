const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

exports.default = async function(context) {
    if (context.electronPlatformName !== 'darwin') {
        return;
    }

    const appPath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
    console.log(`Starting post-pack ad-hoc code signing for: ${appPath}`);

    try {
        // Find all physical files that might be executables or libraries
        console.log("Removing extended attributes and forcing deep ad-hoc signature...");

        // Remove quarantine because it breaks the build
        execSync(`xattr -cr "${appPath}"`, { stdio: 'inherit' });

        // Ad-hoc sign the entire app bundle including all deep nested frameworks and Python binaries
        execSync(`codesign --force --deep --sign - "${appPath}"`, { stdio: 'inherit' });

        console.log("Ad-hoc sign completed successfully.");
    } catch (error) {
        console.error("Failed to post-pack sign:", error);
    }
};
