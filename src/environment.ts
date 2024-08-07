export const vrchatEmail = process.env["VRCHAT_EMAIL"]!;
export const vrchatPassword = process.env["VRCHAT_PASSWORD"]!;
export const vrchatTotpSecret = process.env["VRCHAT_TOTP_SECRET"]!;

export const mediawikiUsername = process.env["MEDIAWIKI_USERNAME"]!;
export const mediawikiPassword = process.env["MEDIAWIKI_PASSWORD"]!;

const argv = process.argv.slice(2);

/**
 * Whether to run the script in dry-run mode, which prevents any changes from being made.
 */
export const dry = !!process.env["DRY"] || argv.includes("--dry");
