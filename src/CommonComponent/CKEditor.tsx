'use client'

import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { useState } from "react";

interface CustomEditorComponentProps {
    editorText?: any;
    onChangeText: (editorText: string) => void;
}

const CustomEditor: React.FC<CustomEditorComponentProps> = ({ editorText, onChangeText }) => {

    const CKEditorConfig = {
        toolbar: [
            'undo',
            'redo',
            'heading',
            '|',
            'bold',
            'italic',
            'fontSize',
            'fontFamily',
            'fontColor',
            '|',
            'link',
            'bulletedList',
            'numberedList',
            'blockQuote'
        ]
    }

    return <CKEditor editor={ClassicEditor} data={editorText} config={CKEditorConfig} onChange={(event, editor) => {
        onChangeText(editor.getData());
    }} />
}

export default CustomEditor;