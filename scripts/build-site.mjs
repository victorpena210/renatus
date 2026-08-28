import {
  cp,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile
} from "node:fs/promises";

import path from "node:path";
import { fileURLToPath } from "node:url";


const ROOT = path.resolve(
  path.dirname(
    fileURLToPath(import.meta.url)
  ),
  ".."
);

const DIST =
  path.join(
    ROOT,
    "dist"
  );

const COMPONENTS_DIR =
  path.join(
    ROOT,
    "components"
  );


const PUBLIC_DIRECTORIES = new Set([
  "css",
  "images",
  "js"
]);


const PUBLIC_EXTENSION_ALLOWLIST = new Set([
  ".html",
  ".ico",
  ".jpeg",
  ".jpg",
  ".png",
  ".svg",
  ".txt",
  ".webmanifest",
  ".webp",
  ".xml"
]);


const PUBLIC_EXTENSIONLESS_FILES = new Set([
  "_redirects",
  "CNAME"
]);


/*
 * Renatus uses an empty div for the navbar:
 *
 * <div id="site-header"></div>
 *
 * This pattern is deliberately flexible so
 * whitespace or additional attributes do not
 * break the build later.
 */
const HEADER_PLACEHOLDER =
  /<div\b(?=[^>]*\bid=["']site-header["'])[^>]*>\s*<\/div>/i;


/*
 * Renatus footers currently look like:
 *
 * <footer
 *   id="site-footer"
 *   class="site-footer"
 * ></footer>
 *
 * Some pages put everything on one line.
 *
 * Capture the opening footer tag so all existing
 * classes and attributes are preserved.
 */
const FOOTER_PLACEHOLDER =
  /(<footer\b(?=[^>]*\bid=["']site-footer["'])[^>]*>)\s*<\/footer>/i;



function indentBlock(
  text,
  spaces = 2
) {

  const padding =
    " ".repeat(spaces);


  return text
    .split("\n")
    .map((line) =>
      line.length
        ? `${padding}${line}`
        : ""
    )
    .join("\n");

}



async function collectHtmlFiles(
  directory
) {

  const entries =
    await readdir(
      directory,
      {
        withFileTypes: true
      }
    );


  const htmlFiles = [];


  for (const entry of entries) {

    const fullPath =
      path.join(
        directory,
        entry.name
      );


    if (entry.isDirectory()) {

      htmlFiles.push(
        ...await collectHtmlFiles(
          fullPath
        )
      );

      continue;

    }


    if (
      entry.isFile() &&
      entry.name.endsWith(".html")
    ) {

      htmlFiles.push(
        fullPath
      );

    }

  }


  return htmlFiles;

}



async function copyPublicSite() {

  const entries =
    await readdir(
      ROOT,
      {
        withFileTypes: true
      }
    );


  for (const entry of entries) {

    const isPublicDirectory =
      entry.isDirectory() &&
      PUBLIC_DIRECTORIES.has(
        entry.name
      );


    const isPublicFile =
      entry.isFile() &&
      (
        PUBLIC_EXTENSIONLESS_FILES.has(
          entry.name
        ) ||
        PUBLIC_EXTENSION_ALLOWLIST.has(
          path
            .extname(entry.name)
            .toLowerCase()
        )
      );


    if (
      !isPublicDirectory &&
      !isPublicFile
    ) {

      continue;

    }


    const sourcePath =
      path.join(
        ROOT,
        entry.name
      );


    const destinationPath =
      path.join(
        DIST,
        entry.name
      );


    await cp(
      sourcePath,
      destinationPath,
      {
        recursive: true,
        force: true
      }
    );

  }

}



async function injectSharedComponents() {

  const navbar = (
    await readFile(
      path.join(
        COMPONENTS_DIR,
        "navbar.html"
      ),
      "utf8"
    )
  ).trim();


  const footer = (
    await readFile(
      path.join(
        COMPONENTS_DIR,
        "footer.html"
      ),
      "utf8"
    )
  ).trim();


  const htmlFiles =
    await collectHtmlFiles(
      DIST
    );


  let builtPageCount = 0;


  for (const filePath of htmlFiles) {

    let html =
      await readFile(
        filePath,
        "utf8"
      );


    const hasHeaderPlaceholder =
      HEADER_PLACEHOLDER.test(
        html
      );


    const hasFooterPlaceholder =
      FOOTER_PLACEHOLDER.test(
        html
      );


    /*
     * Ignore an HTML file if it does not participate
     * in the shared component architecture.
     */
    if (
      !hasHeaderPlaceholder &&
      !hasFooterPlaceholder
    ) {

      continue;

    }


    /*
     * If only one component exists, fail the build.
     *
     * This prevents a partially configured page
     * from quietly reaching production.
     */
    if (
      !hasHeaderPlaceholder ||
      !hasFooterPlaceholder
    ) {

      const relativePath =
        path.relative(
          ROOT,
          filePath
        );


      throw new Error(
        `${relativePath} must contain both ` +
        "the site-header and site-footer placeholders."
      );

    }


    /*
     * Put the actual navbar HTML directly into
     * the page.
     */
    html = html.replace(
      HEADER_PLACEHOLDER,
      [
        "<!-- Shared navbar injected at build time for SEO/AEO. -->",
        navbar
      ].join("\n")
    );


    /*
     * Preserve the existing Renatus footer opening
     * tag, including class=\"site-footer\".
     *
     * Only the shared footer content is inserted.
     */
    html = html.replace(
      FOOTER_PLACEHOLDER,
      (
        _match,
        openingTag
      ) =>
        [
          openingTag,

          "  <!-- Shared footer injected at build time for SEO/AEO. -->",

          indentBlock(
            footer,
            2
          ),

          "</footer>"
        ].join("\n")
    );


    await writeFile(
      filePath,
      html,
      "utf8"
    );


    builtPageCount += 1;

  }


  if (builtPageCount === 0) {

    throw new Error(
      "No pages were built. Expected pages with site-header/site-footer placeholders."
    );

  }


  return builtPageCount;

}



async function validateBuiltSite() {

  const htmlFiles =
    await collectHtmlFiles(
      DIST
    );


  const problems = [];


  for (const filePath of htmlFiles) {

    const html =
      await readFile(
        filePath,
        "utf8"
      );


    const relativePath =
      path.relative(
        DIST,
        filePath
      );


    /*
     * The deployed version should never contain
     * an empty navbar placeholder.
     */
    if (
      HEADER_PLACEHOLDER.test(
        html
      )
    ) {

      problems.push(
        `${relativePath}: empty site-header remains`
      );

    }


    /*
     * The deployed version should never contain
     * an empty footer placeholder.
     */
    if (
      FOOTER_PLACEHOLDER.test(
        html
      )
    ) {

      problems.push(
        `${relativePath}: empty site-footer remains`
      );

    }


    /*
     * Confirm the actual Renatus navigation
     * made it into the document.
     */
    if (
      !html.includes(
        'aria-label="Main navigation"'
      )
    ) {

      problems.push(
        `${relativePath}: main navigation was not injected`
      );

    }


    /*
     * Confirm the shared footer made it into
     * the document.
     */
    if (
      !html.includes(
        'class="container footer-inner"'
      ) ||
      !html.includes(
        "Renatus."
      )
    ) {

      problems.push(
        `${relativePath}: footer was not injected`
      );

    }

  }


  if (problems.length > 0) {

    throw new Error(
      `Build validation failed:\n- ${problems.join(
        "\n- "
      )}`
    );

  }

}



async function build() {

  /*
   * Delete the previous build so old files
   * cannot linger between deployments.
   */
  await rm(
    DIST,
    {
      recursive: true,
      force: true
    }
  );


  /*
   * Create a fresh production folder.
   */
  await mkdir(
    DIST,
    {
      recursive: true
    }
  );


  /*
   * Copy the public website assets.
   */
  await copyPublicSite();


  /*
   * Convert shared components into real static
   * HTML inside every page.
   */
  const builtPageCount =
    await injectSharedComponents();


  /*
   * Refuse to publish if the static architecture
   * is incomplete.
   */
  await validateBuiltSite();


  console.log(
    `Built ${builtPageCount} HTML pages into dist/.`
  );


  console.log(
    "Navbar/footer are now present in the deployed HTML response."
  );

}



build().catch((error) => {

  console.error(
    error
  );

  process.exit(
    1
  );

});