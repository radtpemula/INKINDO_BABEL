"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { TextAlign } from "@tiptap/extension-text-align";
import { Placeholder } from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading2,
  Heading3,
  Pilcrow,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Unlink,
  Undo2,
  Redo2,
  RemoveFormatting,
  Check,
  X,
  ImagePlus,
  Upload,
  Loader2,
} from "lucide-react";
import {
  ArticleImage,
  type ArticleImageAlign,
  type ArticleImageSize,
} from "./article-image-extension";

const ALLOWED_INLINE_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_INLINE_IMAGE_BYTES = 5 * 1024 * 1024;

interface InlineUploadResponse {
  success?: boolean;
  error?: string;
  data?: {
    publicPath?: string;
    uploadToken?: string;
  };
}

export interface RichTextEditorProps {
  value?: string;
  initialContent?: string;
  onChange?: (html: string) => void;
  onBlur?: () => void;
  onInlineImageUploaded?: (info: { publicPath: string; uploadToken: string }) => void;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
  id?: string;
  name?: string;
  minHeight?: string;
  className?: string;
}

export const CustomTextAlign = TextAlign.extend({
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          textAlign: {
            default: this.options.defaultAlignment,
            parseHTML: (element) => {
              for (const alignment of this.options.alignments) {
                if (element.classList.contains(`text-${alignment}`)) {
                  return alignment;
                }
              }
              const style = element.style?.textAlign;
              if (this.options.alignments.includes(style)) {
                return style;
              }
              return this.options.defaultAlignment;
            },
            renderHTML: (attributes) => {
              if (
                !attributes.textAlign ||
                !this.options.alignments.includes(attributes.textAlign)
              ) {
                return {};
              }
              return { class: `text-${attributes.textAlign}` };
            },
          },
        },
      },
    ];
  },
});

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  ariaLabel: string;
  children: React.ReactNode;
}

function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  title,
  ariaLabel,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      aria-pressed={isActive}
      className={`p-1.5 rounded-md text-xs font-medium flex items-center justify-center transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D97706] ${
        disabled
          ? "opacity-35 cursor-not-allowed text-slate-400 bg-transparent"
          : isActive
          ? "bg-amber-100 text-[#D97706] border border-amber-300 font-semibold shadow-2xs"
          : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 border border-transparent"
      }`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-[1px] h-5 bg-slate-200 mx-0.5 shrink-0" aria-hidden="true" />;
}

export function RichTextEditor({
  value,
  initialContent = "",
  onChange,
  onBlur,
  onInlineImageUploaded,
  disabled = false,
  placeholder = "Tulis isi berita...",
  error,
  id,
  name,
  minHeight = "240px",
  className = "",
}: RichTextEditorProps) {
  const [isLinkPromptOpen, setIsLinkPromptOpen] = useState(false);
  const [linkInputUrl, setLinkInputUrl] = useState("");
  const [contentVersion, setContentVersion] = useState(0);
  const lastHtmlRef = useRef(value !== undefined ? value : initialContent);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const [isImagePromptOpen, setIsImagePromptOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageAlt, setImageAlt] = useState("");
  const [imageCaption, setImageCaption] = useState("");
  const [imageSize, setImageSize] = useState<ArticleImageSize>("100");
  const [imageAlign, setImageAlign] = useState<ArticleImageAlign>("center");
  const [imageError, setImageError] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const insertImageLockRef = useRef(false);
  const imageInsertPosRef = useRef<number | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const extensions = useMemo(() => {
    return [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
        code: false,
        codeBlock: false,
        horizontalRule: false,
        link: {
          openOnClick: false,
          HTMLAttributes: {
            rel: "noopener noreferrer",
            target: "_blank",
          },
        },
      }),
      CustomTextAlign.configure({
        types: ["heading", "paragraph", "blockquote"],
        alignments: ["left", "center", "right"],
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
      ArticleImage.configure({
        allowBase64: false,
      }),
    ];
  }, [placeholder]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    content: value !== undefined ? value : initialContent,
    editable: !disabled,
    editorProps: {
      attributes: {
        id: id || "rich-text-editor-content",
        class:
          "tiptap prose max-w-none focus:outline-hidden p-4 text-slate-800 text-sm sm:text-base leading-relaxed",
        style: `min-height: ${minHeight};`,
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      lastHtmlRef.current = html;
      setContentVersion((v) => v + 1);
      onChange?.(html);
    },
    onSelectionUpdate: () => {
      setContentVersion((v) => v + 1);
    },
    onBlur: () => {
      onBlur?.();
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  useEffect(() => {
    if (!editor) return;
    const targetValue = value !== undefined ? value : initialContent;
    if (targetValue === undefined) return;

    const currentHtml = editor.getHTML();
    if (targetValue !== lastHtmlRef.current && targetValue !== currentHtml) {
      lastHtmlRef.current = targetValue;
      editor.commands.setContent(targetValue, { emitUpdate: false });
    }
  }, [value, initialContent, editor]);

  const handleOpenLinkPrompt = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href || "";
    setLinkInputUrl(previousUrl);
    setIsLinkPromptOpen(true);
    setTimeout(() => {
      linkInputRef.current?.focus();
      linkInputRef.current?.select();
    }, 50);
  }, [editor]);

  const handleApplyLink = useCallback(() => {
    if (!editor) return;
    const trimmed = linkInputUrl.trim();
    if (!trimmed) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      let finalUrl = trimmed;
      if (!/^https?:\/\//i.test(finalUrl) && !finalUrl.startsWith("/") && !finalUrl.startsWith("#")) {
        finalUrl = `https://${finalUrl}`;
      }
      editor.chain().focus().extendMarkRange("link").setLink({ href: finalUrl }).run();
    }
    setIsLinkPromptOpen(false);
    setLinkInputUrl("");
  }, [editor, linkInputUrl]);

  const handleCancelLink = useCallback(() => {
    setIsLinkPromptOpen(false);
    setLinkInputUrl("");
    editor?.commands.focus();
  }, [editor]);

  const handleUnlink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setIsLinkPromptOpen(false);
    setLinkInputUrl("");
  }, [editor]);

  const resetImageForm = useCallback(() => {
    setImageFile(null);
    setImageAlt("");
    setImageCaption("");
    setImageSize("100");
    setImageAlign("center");
    setImageError("");
    imageInsertPosRef.current = null;
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  }, []);

  const handleOpenImagePrompt = useCallback(() => {
    if (!editor) return;
    imageInsertPosRef.current = editor.state.selection.from;
    setImageError("");
    setIsImagePromptOpen(true);
    setTimeout(() => {
      imageInputRef.current?.focus();
    }, 50);
  }, [editor]);

  const handleCancelImage = useCallback(() => {
    if (isUploadingImage) return;
    setIsImagePromptOpen(false);
    resetImageForm();
    editor?.commands.focus();
  }, [editor, isUploadingImage, resetImageForm]);

  const handleImageFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setImageError("");

    if (!file) {
      setImageFile(null);
      return;
    }

    if (file.size <= 0) {
      setImageFile(null);
      setImageError("Ukuran berkas gambar kosong.");
      event.target.value = "";
      return;
    }

    if (!ALLOWED_INLINE_IMAGE_TYPES.includes(file.type)) {
      setImageFile(null);
      setImageError("Format berkas harus JPEG, PNG, atau WebP.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_INLINE_IMAGE_BYTES) {
      setImageFile(null);
      setImageError("Ukuran berkas melebihi batas maksimum 5 MB.");
      event.target.value = "";
      return;
    }

    setImageFile(file);
  }, []);

  const handleInsertImage = useCallback(async () => {
    if (
      !editor ||
      editor.isDestroyed ||
      !imageFile ||
      isUploadingImage ||
      insertImageLockRef.current
    ) {
      return;
    }

    const alt = imageAlt.trim();
    if (!alt) {
      setImageError("Alt text wajib diisi.");
      return;
    }

    insertImageLockRef.current = true;
    setIsUploadingImage(true);
    setImageError("");

    try {
      const formData = new FormData();
      formData.append("file", imageFile);

      const response = await fetch("/api/admin/news-inline-upload", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json().catch(() => null)) as InlineUploadResponse | null;
      const publicPath = payload?.data?.publicPath;
      const uploadToken = payload?.data?.uploadToken;

      if (!response.ok || !payload?.success || !publicPath) {
        setImageError(payload?.error || "Gagal mengunggah gambar. Silakan coba lagi.");
        return;
      }

      if (uploadToken) {
        onInlineImageUploaded?.({ publicPath, uploadToken });
      }

      if (editor.isDestroyed) {
        return;
      }

      const position = Math.min(
        imageInsertPosRef.current ?? editor.state.selection.from,
        editor.state.doc.content.size
      );

      editor
        .chain()
        .focus()
        .insertContentAt(position, {
          type: "articleImage",
          attrs: {
            src: publicPath,
            alt,
            caption: imageCaption.trim(),
            size: imageSize,
            align: imageAlign,
          },
        })
        .run();

      setIsImagePromptOpen(false);
      resetImageForm();
    } catch {
      setImageError("Tidak dapat menghubungi server. Periksa koneksi Anda.");
    } finally {
      insertImageLockRef.current = false;
      setIsUploadingImage(false);
    }
  }, [
    editor,
    imageFile,
    imageAlt,
    imageCaption,
    imageSize,
    imageAlign,
    isUploadingImage,
    resetImageForm,
    onInlineImageUploaded,
  ]);

  const wordCount = useMemo(() => {
    void contentVersion;
    if (!editor) return 0;
    const text = editor.getText().trim();
    if (!text) return 0;
    return text.split(/\s+/).filter(Boolean).length;
  }, [editor, contentVersion]);

  const charCount = useMemo(() => {
    void contentVersion;
    if (!editor) return 0;
    return editor.getText().length;
  }, [editor, contentVersion]);

  const activeFormatLabel = useMemo(() => {
    void contentVersion;
    if (!editor) return "Paragraf";
    if (editor.isActive("heading", { level: 2 })) return "Judul (H2)";
    if (editor.isActive("heading", { level: 3 })) return "Subjudul (H3)";
    if (editor.isActive("blockquote")) return "Kutipan";
    if (editor.isActive("bulletList")) return "Daftar Titik";
    if (editor.isActive("orderedList")) return "Daftar Nomor";
    return "Paragraf";
  }, [editor, contentVersion]);

  return (
    <div
      className={`border rounded-xl bg-white overflow-hidden transition-colors ${
        error
          ? "border-red-400 ring-2 ring-red-100"
          : "border-slate-300 focus-within:border-[#D97706] focus-within:ring-2 focus-within:ring-[#D97706]/20"
      } ${disabled ? "opacity-75 bg-slate-50 cursor-not-allowed" : ""} ${className}`}
    >
      {name && <input type="hidden" name={name} value={value !== undefined ? value : initialContent} />}

      {/* Scoped CSS for ProseMirror content styling */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .tiptap {
              outline: none;
            }
            .tiptap p {
              margin-bottom: 0.75rem;
            }
            .tiptap p:last-child {
              margin-bottom: 0;
            }
            .tiptap h2 {
              font-size: 1.35rem;
              font-weight: 700;
              color: #0F172A;
              margin-top: 1.25rem;
              margin-bottom: 0.5rem;
              line-height: 1.3;
            }
            .tiptap h3 {
              font-size: 1.15rem;
              font-weight: 600;
              color: #1E293B;
              margin-top: 1rem;
              margin-bottom: 0.5rem;
              line-height: 1.35;
            }
            .tiptap ul {
              list-style-type: disc;
              padding-left: 1.5rem;
              margin-top: 0.5rem;
              margin-bottom: 0.75rem;
            }
            .tiptap ol {
              list-style-type: decimal;
              padding-left: 1.5rem;
              margin-top: 0.5rem;
              margin-bottom: 0.75rem;
            }
            .tiptap li {
              margin-bottom: 0.25rem;
            }
            .tiptap li p {
              margin-bottom: 0;
            }
            .tiptap blockquote {
              border-left: 4px solid #D97706;
              padding-left: 1rem;
              color: #475569;
              font-style: italic;
              margin-top: 0.75rem;
              margin-bottom: 0.75rem;
              background-color: #F8FAFC;
              padding-top: 0.25rem;
              padding-bottom: 0.25rem;
              border-radius: 0 0.375rem 0.375rem 0;
            }
            .tiptap a {
              color: #D97706;
              text-decoration: underline;
              text-underline-offset: 2px;
            }
            .tiptap a:hover {
              color: #B45309;
            }
            .tiptap .text-left {
              text-align: left;
            }
            .tiptap .text-center {
              text-align: center;
            }
            .tiptap .text-right {
              text-align: right;
            }
            .tiptap figure {
              margin: 0.75rem 0;
            }
            .tiptap figure img {
              display: block;
              max-width: 100%;
              height: auto;
              border-radius: 0.5rem;
              border: 1px solid #E2E8F0;
            }
            .tiptap figure img.w-1\\/2 {
              width: 50%;
            }
            .tiptap figure img.w-3\\/4 {
              width: 75%;
            }
            .tiptap figure img.w-full {
              width: 100%;
            }
            .tiptap figure img.mx-auto {
              margin-left: auto;
              margin-right: auto;
            }
            .tiptap figure img.ml-auto {
              margin-left: auto;
              margin-right: 0;
            }
            .tiptap figcaption {
              margin-top: 0.5rem;
              font-size: 0.75rem;
              line-height: 1.5;
              font-style: italic;
              color: #64748B;
              text-align: center;
            }
            .tiptap figure.ProseMirror-selectednode {
              outline: 2px solid #D97706;
              outline-offset: 3px;
              border-radius: 0.5rem;
            }
            .tiptap p.is-editor-empty:first-child::before {
              content: attr(data-placeholder);
              float: left;
              color: #94A3B8;
              pointer-events: none;
              height: 0;
            }
          `,
        }}
      />

      {/* Toolbar */}
      <div className="bg-slate-50 border-b border-slate-200 p-1.5 sm:p-2 flex flex-wrap items-center gap-1 select-none">
        {/* Undo / Redo */}
        <ToolbarButton
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={disabled || !editor?.can().undo()}
          title="Urungkan (Ctrl+Z)"
          ariaLabel="Urungkan"
        >
          <Undo2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={disabled || !editor?.can().redo()}
          title="Ulangi (Ctrl+Y)"
          ariaLabel="Ulangi"
        >
          <Redo2 className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Headings & Paragraph */}
        <ToolbarButton
          onClick={() => editor?.chain().focus().setParagraph().run()}
          isActive={editor?.isActive("paragraph") && !editor?.isActive("blockquote")}
          disabled={disabled || !editor}
          title="Paragraf Biasa"
          ariaLabel="Paragraf Biasa"
        >
          <Pilcrow className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor?.isActive("heading", { level: 2 })}
          disabled={disabled || !editor}
          title="Judul Utama (H2)"
          ariaLabel="Judul Utama H2"
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor?.isActive("heading", { level: 3 })}
          disabled={disabled || !editor}
          title="Subjudul (H3)"
          ariaLabel="Subjudul H3"
        >
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Text Styling Marks */}
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleBold().run()}
          isActive={editor?.isActive("bold")}
          disabled={disabled || !editor}
          title="Tebal (Ctrl+B)"
          ariaLabel="Tebal"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          isActive={editor?.isActive("italic")}
          disabled={disabled || !editor}
          title="Miring (Ctrl+I)"
          ariaLabel="Miring"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          isActive={editor?.isActive("underline")}
          disabled={disabled || !editor}
          title="Garis Bawah (Ctrl+U)"
          ariaLabel="Garis Bawah"
        >
          <Underline className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleStrike().run()}
          isActive={editor?.isActive("strike")}
          disabled={disabled || !editor}
          title="Coret (Strikethrough)"
          ariaLabel="Coret"
        >
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Alignments */}
        <ToolbarButton
          onClick={() => editor?.chain().focus().setTextAlign("left").run()}
          isActive={editor?.isActive({ textAlign: "left" })}
          disabled={disabled || !editor}
          title="Rata Kiri"
          ariaLabel="Rata Kiri"
        >
          <AlignLeft className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().setTextAlign("center").run()}
          isActive={editor?.isActive({ textAlign: "center" })}
          disabled={disabled || !editor}
          title="Rata Tengah"
          ariaLabel="Rata Tengah"
        >
          <AlignCenter className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().setTextAlign("right").run()}
          isActive={editor?.isActive({ textAlign: "right" })}
          disabled={disabled || !editor}
          title="Rata Kanan"
          ariaLabel="Rata Kanan"
        >
          <AlignRight className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Lists & Blockquote */}
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          isActive={editor?.isActive("bulletList")}
          disabled={disabled || !editor}
          title="Daftar Poin (Bullet List)"
          ariaLabel="Daftar Poin"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          isActive={editor?.isActive("orderedList")}
          disabled={disabled || !editor}
          title="Daftar Nomor (Numbered List)"
          ariaLabel="Daftar Nomor"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          isActive={editor?.isActive("blockquote")}
          disabled={disabled || !editor}
          title="Kutipan (Blockquote)"
          ariaLabel="Kutipan"
        >
          <Quote className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Links */}
        <ToolbarButton
          onClick={handleOpenLinkPrompt}
          isActive={editor?.isActive("link")}
          disabled={disabled || !editor}
          title="Sisipkan/Ubah Tautan (Link)"
          ariaLabel="Sisipkan Tautan"
        >
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>
        {editor?.isActive("link") && (
          <ToolbarButton
            onClick={handleUnlink}
            disabled={disabled || !editor}
            title="Hapus Tautan (Unlink)"
            ariaLabel="Hapus Tautan"
          >
            <Unlink className="w-4 h-4 text-red-500" />
          </ToolbarButton>
        )}

        <ToolbarDivider />

        {/* Inline image */}
        <ToolbarButton
          onClick={handleOpenImagePrompt}
          isActive={isImagePromptOpen}
          disabled={disabled || !editor}
          title="Sisipkan Gambar"
          ariaLabel="Sisipkan Gambar"
        >
          <ImagePlus className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Clear formatting */}
        <ToolbarButton
          onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
          disabled={disabled || !editor}
          title="Hapus Semua Format (Clear Formatting)"
          ariaLabel="Hapus Format"
        >
          <RemoveFormatting className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Inline Link Prompt Bar */}
      {isLinkPromptOpen && (
        <div className="bg-amber-50/70 border-b border-amber-200 px-3 py-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-slate-700 flex items-center gap-1">
            <LinkIcon className="w-3.5 h-3.5 text-[#D97706]" />
            URL Tautan:
          </span>
          <input
            ref={linkInputRef}
            type="text"
            value={linkInputUrl}
            onChange={(e) => setLinkInputUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleApplyLink();
              } else if (e.key === "Escape") {
                e.preventDefault();
                handleCancelLink();
              }
            }}
            placeholder="https://contoh.com/artikel atau /halaman"
            className="flex-1 min-w-[200px] px-2.5 py-1 text-xs rounded-md border border-slate-300 bg-white focus:outline-hidden focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706]"
          />
          <button
            type="button"
            onClick={handleApplyLink}
            className="px-2.5 py-1 bg-[#D97706] hover:bg-[#B45309] text-white rounded-md font-semibold flex items-center gap-1 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Terapkan
          </button>
          {editor?.isActive("link") && (
            <button
              type="button"
              onClick={handleUnlink}
              className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-md font-medium transition-colors"
            >
              Hapus
            </button>
          )}
          <button
            type="button"
            onClick={handleCancelLink}
            className="p-1 hover:bg-slate-200 text-slate-500 rounded-md transition-colors"
            title="Batal"
            aria-label="Batal"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Inline Image Prompt Bar */}
      {isImagePromptOpen && (
        <div className="bg-slate-50 border-b border-slate-200 px-3 py-3 text-xs">
          <div className="flex items-center gap-1.5 mb-2 font-semibold text-slate-700">
            <ImagePlus className="w-3.5 h-3.5 text-[#D97706]" />
            Sisipkan Gambar
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="sm:col-span-2 font-medium text-slate-600">
              Berkas gambar (JPEG, PNG, WebP, maks. 5 MB)
              <input
                ref={imageInputRef}
                id="article-image-file"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageFileChange}
                disabled={isUploadingImage}
                className="mt-1 block w-full text-xs text-slate-600 file:mr-2 file:rounded-md file:border-0 file:bg-slate-200 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-300"
              />
            </label>

            <label className="font-medium text-slate-600">
              Alt text <span className="text-red-500">*</span>
              <input
                id="article-image-alt"
                type="text"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                disabled={isUploadingImage}
                maxLength={160}
                placeholder="Deskripsi singkat gambar"
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706]"
              />
            </label>

            <label className="font-medium text-slate-600">
              Caption (opsional)
              <input
                id="article-image-caption"
                type="text"
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
                disabled={isUploadingImage}
                maxLength={200}
                placeholder="Keterangan di bawah gambar"
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706]"
              />
            </label>

            <label className="font-medium text-slate-600">
              Ukuran gambar
              <select
                id="article-image-size"
                value={imageSize}
                onChange={(e) => setImageSize(e.target.value as ArticleImageSize)}
                disabled={isUploadingImage}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706]"
              >
                <option value="50">50%</option>
                <option value="75">75%</option>
                <option value="100">100%</option>
              </select>
            </label>

            <label className="font-medium text-slate-600">
              Posisi gambar
              <select
                id="article-image-align"
                value={imageAlign}
                onChange={(e) => setImageAlign(e.target.value as ArticleImageAlign)}
                disabled={isUploadingImage}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706]"
              >
                <option value="left">Kiri</option>
                <option value="center">Tengah</option>
                <option value="right">Kanan</option>
              </select>
            </label>
          </div>

          {imageFile && (
            <p className="mt-2 text-[11px] text-slate-500">
              {imageFile.name} • {(imageFile.size / 1024).toFixed(0)} KB
            </p>
          )}

          {imageError && (
            <p aria-live="polite" className="mt-2 font-medium text-red-600">
              {imageError}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleInsertImage}
              disabled={isUploadingImage || !imageFile}
              className="px-2.5 py-1 bg-[#D97706] hover:bg-[#B45309] text-white rounded-md font-semibold flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploadingImage ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              {isUploadingImage ? "Mengunggah..." : "Unggah & Sisipkan"}
            </button>
            <button
              type="button"
              onClick={handleCancelImage}
              disabled={isUploadingImage}
              className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Editor Content Area */}
      <EditorContent editor={editor} />

      {/* Status Bar */}
      <div className="bg-slate-50/80 border-t border-slate-200 px-3 py-1.5 flex flex-wrap items-center justify-between text-[11px] text-slate-500 select-none">
        <div className="flex items-center gap-3">
          <span>
            Format: <strong className="font-semibold text-slate-700">{activeFormatLabel}</strong>
          </span>
          {editor?.isActive({ textAlign: "center" }) && (
            <span className="text-amber-700 bg-amber-50 px-1 rounded">Rata Tengah</span>
          )}
          {editor?.isActive({ textAlign: "right" }) && (
            <span className="text-amber-700 bg-amber-50 px-1 rounded">Rata Kanan</span>
          )}
          {editor?.isActive("link") && (
            <span className="text-blue-700 bg-blue-50 px-1 rounded">Memiliki Tautan</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span>{wordCount} kata</span>
          <span>•</span>
          <span>{charCount} karakter</span>
        </div>
      </div>

      {error && <p className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 border-t border-red-200">{error}</p>}
    </div>
  );
}

export default RichTextEditor;
