import Paragraph from "@tiptap/extension-paragraph";

const PRESETS = {
    compact: "1.0",
    normal: "1.5",
    relaxed: "2.0",
};

export const ParagraphWithLineHeight = Paragraph.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            lineHeight: {
                default: "normal",
                parseHTML: (element) => {
                    const style = element.style.lineHeight;
                    const found = Object.entries(PRESETS).find(([, v]) => v === style);
                    return found ? found[0] : "normal";
                },
                renderHTML: (attributes) => {
                    const value = PRESETS[attributes.lineHeight] || PRESETS.normal;
                    return { style: `line-height: ${value}` };
                },
            },
        };
    },
});

export { PRESETS as LINE_HEIGHT_PRESETS };