import Image from "@tiptap/extension-image";
import type { DOMOutputSpec } from "@tiptap/pm/model";

export type ArticleImageSize = "50" | "75" | "100";
export type ArticleImageAlign = "left" | "center" | "right";

function readSize(className: string): ArticleImageSize {
  if (/\bw-1\/2\b/.test(className)) return "50";
  if (/\bw-3\/4\b/.test(className)) return "75";
  return "100";
}

function readAlign(className: string): ArticleImageAlign {
  if (/\bml-auto\b/.test(className)) return "right";
  if (/\bmx-auto\b/.test(className)) return "center";
  return "left";
}

export const ArticleImage = Image.extend({
  name: "articleImage",

  addAttributes() {
    return {
      ...this.parent?.(),
      caption: { default: "" },
      size: { default: "100" as ArticleImageSize },
      align: { default: "center" as ArticleImageAlign },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure",
        getAttrs: (element) => {
          const figure = element as HTMLElement;
          const img = figure.querySelector("img");
          if (!img) return false;
          const figcaption = figure.querySelector("figcaption");
          const className = img.getAttribute("class") ?? "";
          return {
            src: img.getAttribute("src"),
            alt: img.getAttribute("alt") ?? "",
            title: img.getAttribute("title"),
            caption: figcaption?.textContent?.trim() ?? "",
            size: readSize(className),
            align: readAlign(className),
          };
        },
      },
      ...(this.parent?.() ?? []),
    ];
  },

  renderHTML({ node }): DOMOutputSpec {
    const sizeClass =
      node.attrs.size === "50" ? "w-1/2" : node.attrs.size === "75" ? "w-3/4" : "w-full";
    const alignClass =
      node.attrs.align === "right" ? "ml-auto" : node.attrs.align === "center" ? "mx-auto" : "";
    const imgClass = `block rounded-lg ${sizeClass}${alignClass ? ` ${alignClass}` : ""}`;

    const imgAttributes: Record<string, string> = {
      src: String(node.attrs.src ?? ""),
      alt: String(node.attrs.alt ?? ""),
      class: imgClass,
    };
    if (node.attrs.title) {
      imgAttributes.title = String(node.attrs.title);
    }

    const children: DOMOutputSpec[] = [["img", imgAttributes]];
    if (node.attrs.caption) {
      children.push([
        "figcaption",
        { class: "text-xs text-slate-500 italic mt-2 text-center" },
        String(node.attrs.caption),
      ]);
    }

    return ["figure", { class: "my-6" }, ...children];
  },
});
