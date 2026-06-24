export const AUTOSAVE_DELAY_MS = 2000;

export const extensionFor = (paperFile) => {
  const value = paperFile?.path || paperFile?.filename || "";
  const index = value.lastIndexOf(".");
  return index >= 0 ? value.slice(index).toLowerCase() : "";
};

export const languageFor = (paperFile) => {
  const extension = extensionFor(paperFile);
  if ([".cls", ".sty", ".tex"].includes(extension)) {
    return "latex";
  }
  if (extension === ".md") {
    return "markdown";
  }

  return "plaintext";
};

export const fileTreeFor = (paperFiles) => {
  const root = [];

  paperFiles
    .slice()
    .sort((left, right) => left.path.localeCompare(right.path))
    .forEach((paperFile) => {
      const parts = paperFile.path.split("/").filter(Boolean);
      let level = root;
      parts.forEach((part, index) => {
        const isFile = index === parts.length - 1;
        const nodePath = parts.slice(0, index + 1).join("/");

        if (isFile) {
          level.push({
            id: paperFile.id,
            label: part,
            path: nodePath,
            type: "file",
            file: paperFile
          });
          return;
        }

        let folder = level.find((node) => node.type === "folder" && node.path === nodePath);
        if (!folder) {
          folder = {
            id: nodePath,
            label: part,
            path: nodePath,
            type: "folder",
            children: []
          };
          level.push(folder);
        }
        level = folder.children;
      });
    });

  return root;
};

export const folderPathsFor = (paperFiles) => {
  const paths = new Set(["source", "assets"]);

  paperFiles.forEach((paperFile) => {
    const parts = paperFile.path.split("/").filter(Boolean);
    for (let index = 1; index < parts.length; index += 1) {
      paths.add(parts.slice(0, index).join("/"));
    }
  });

  return Array.from(paths).sort((left, right) => left.localeCompare(right));
};

export const joinProjectPath = (folderPath, filePath) => {
  const cleanFolder = String(folderPath || "").trim().replace(/^\/+|\/+$/g, "");
  const cleanFile = String(filePath || "").trim().replace(/^\/+/g, "");
  return cleanFolder ? `${cleanFolder}/${cleanFile}` : cleanFile;
};

export const saveStatusLabelFor = (saveStatus) => {
  if (saveStatus === "saving") {
    return { className: "text-bg-info", label: "Saving..." };
  }
  if (saveStatus === "unsaved") {
    return { className: "text-bg-warning", label: "Unsaved changes" };
  }
  if (saveStatus === "save_failed") {
    return { className: "text-bg-danger", label: "Save failed" };
  }

  return { className: "text-bg-success", label: "Saved" };
};
